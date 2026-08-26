import {
	readFileSync,
	readdirSync,
	writeFileSync,
	mkdirSync,
	existsSync,
} from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { v5 as uuidv5 } from 'uuid';
import { parse as parseYaml } from 'yaml';
import {
	Work,
	CitationSystem,
	CanonicalReference,
	MappingAssertion,
} from '../standard/schema/index.js';
import {
	parseSource,
	SystemSource,
	WorkSource,
	type MappingSource,
	type ReferenceRangeSource as ReferenceRange,
	type ReferenceSource,
	type ResolverEntrySource as ResolverEntry,
	SPDX_IDS,
	type SystemBlockSource,
} from './source-schema.js';

const REFERENCE_NS = 'b1a3670e-2ac7-544c-a1b9-396e0dc193f7';
const MAPPING_NS = 'f16bb214-4241-549d-ad41-7b011f02befb';

const projectRoot = resolve(process.cwd());
const dataRoot = join(projectRoot, 'data');
const distRoot = join(projectRoot, 'dist');

function expandRange(range: ReferenceRange): string[] {
	switch (range.kind) {
		case 'integer': {
			const out: string[] = [];
			for (let i = range.from; i <= range.to; i++) out.push(String(i));
			return out;
		}
		case 'book_line': {
			const out: string[] = [];
			const separator = range.separator ?? '.';
			for (let b = 1; b <= range.counts.length; b++) {
				const lines = range.counts[b - 1];
				for (let l = 1; l <= lines; l++) out.push(`${b}${separator}${l}`);
			}
			return out;
		}
		case 'book_chapter': {
			const out: string[] = [];
			const separator = range.separator ?? '.';
			for (let b = 1; b <= range.counts.length; b++) {
				const chapters = range.counts[b - 1];
				for (let c = 1; c <= chapters; c++) out.push(`${b}${separator}${c}`);
			}
			return out;
		}
		case 'book_chapter_verse': {
			const out: string[] = [];
			const separator = range.separator ?? '.';
			for (let ch = 1; ch <= range.counts.length; ch++) {
				const verses = range.counts[ch - 1];
				for (let v = 1; v <= verses; v++)
					out.push(`${range.book}${separator}${ch}${separator}${v}`);
			}
			return out;
		}
		case 'chapter_verse': {
			const out: string[] = [];
			const separator = range.separator ?? '.';
			for (let ch = 1; ch <= range.counts.length; ch++) {
				const verses = range.counts[ch - 1];
				for (let v = 1; v <= verses; v++) out.push(`${ch}${separator}${v}`);
			}
			return out;
		}
		case 'bekker': {
			const out: string[] = [];
			const seen = new Set<string>();
			for (const [from, to] of range.page_ranges) {
				for (let p = from; p <= to; p++) {
					for (const col of ['a', 'b']) {
						for (let l = 1; l <= range.lines_per_column; l++) {
							const loc = `${p}${col}${l}`;
							if (!seen.has(loc)) {
								seen.add(loc);
								out.push(loc);
							}
						}
					}
				}
			}
			return out;
		}
		case 'stephanus': {
			const sections = range.sections ?? ['a', 'b', 'c', 'd', 'e'];
			const out: string[] = [];
			for (let p = range.page_range[0]; p <= range.page_range[1]; p++) {
				for (const s of sections) out.push(`${p}${s}`);
			}
			return out;
		}
	}
}

const ROMAN_NUMERALS: Array<[number, string]> = [
	[1000, 'M'],
	[900, 'CM'],
	[500, 'D'],
	[400, 'CD'],
	[100, 'C'],
	[90, 'XC'],
	[50, 'L'],
	[40, 'XL'],
	[10, 'X'],
	[9, 'IX'],
	[5, 'V'],
	[4, 'IV'],
	[1, 'I'],
];

function toRoman(n: number): string {
	let out = '';
	let v = n;
	for (const [value, sym] of ROMAN_NUMERALS) {
		while (v >= value) {
			out += sym;
			v -= value;
		}
	}
	return out;
}

function listYaml(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((n) => n.endsWith('.yaml'))
		.map((n) => join(dir, n))
		.sort();
}

function deriveLocatorVars(
	locator: string,
	system: SystemSource,
): Record<string, string> {
	const re = new RegExp(system.locator_regex);
	const m = locator.match(re);
	// Null-prototype: variable names come from named capture groups and their
	// values from locators, both author-controlled. On a plain object a name
	// like `constructor` or `toString` would resolve up the prototype chain and
	// expand into a URL instead of being treated as absent.
	const vars: Record<string, string> = Object.create(null);
	if (m?.groups) {
		for (const [k, v] of Object.entries(m.groups)) {
			if (v === undefined) continue;
			vars[k] = v;
			if (/^\d+$/.test(v)) {
				vars[`${k}02`] = v.padStart(2, '0');
				vars[`${k}03`] = v.padStart(3, '0');
				vars[`${k}04`] = v.padStart(4, '0');
				const n = Number(v);
				if (n >= 1 && n <= 3999) vars[`${k}Roman`] = toRoman(n);
			}
		}
		// `verseGlobal`: cumulative verse index across chapters. Emitted only
		// when the system declares per-chapter sizes and the locator has both
		// `chapter` and `verse` numeric groups. Used by resolvers (e.g.
		// palikanon.com) whose anchors use a single 1..N counter.
		const chStr = vars.chapter;
		const vsStr = vars.verse;
		if (
			system.chapter_sizes &&
			chStr !== undefined &&
			vsStr !== undefined &&
			/^\d+$/.test(chStr) &&
			/^\d+$/.test(vsStr)
		) {
			const ch = Number(chStr);
			const vs = Number(vsStr);
			if (ch >= 1 && ch <= system.chapter_sizes.length) {
				let offset = 0;
				for (let i = 0; i < ch - 1; i++) offset += system.chapter_sizes[i];
				vars.verseGlobal = String(offset + vs);
			}
		}
	}
	return vars;
}

function assertValidLocator(locator: string, system: SystemSource): void {
	if (!new RegExp(system.locator_regex).test(locator)) {
		throw new Error(
			`${system.key}: locator "${locator}" does not match locator_regex`,
		);
	}
	// The `/cite/` alias grammar distinguishes `{work}/{locator}` from
	// `{work}/{system}/{locator}` by segment count alone (ADR-0005). Flat keys
	// already exclude `/`; locators must too, or the two forms become
	// ambiguous. Checked before any alias is minted.
	if (locator.includes('/')) {
		throw new Error(
			`${system.key}: locator "${locator}" contains "/", which the /cite/ alias grammar cannot represent`,
		);
	}
}

function expandTemplate(
	tpl: string,
	vars: Record<string, string>,
): string | null {
	let missing = false;
	const out = tpl.replace(
		/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
		(_, name: string) => {
			if (vars[name] === undefined) {
				missing = true;
				return '';
			}
			return vars[name];
		},
	);
	return missing ? null : out;
}

/**
 * Bind a resolver's `vars` on top of the locator-derived variables. Each entry
 * translates one canonical value into the provider's own spelling — OSIS `John`
 * into die-bibel.de's USFM `JHN`. A source value with no entry in the map is
 * treated exactly like a missing template variable: the caller skips the
 * resolver for this reference and warns, so a hole in a book table shows up in
 * the build output instead of silently emitting a wrong URL.
 */
function applyResolverVars(
	resolver: ResolverEntry,
	vars: Record<string, string>,
): Record<string, string> | null {
	if (!resolver.vars) return vars;
	const out: Record<string, string> = Object.assign(Object.create(null), vars);
	for (const [name, spec] of Object.entries(resolver.vars)) {
		if (Object.hasOwn(vars, name)) {
			throw new Error(
				`resolver var "${name}" shadows a locator-derived variable; give the mapped value its own name`,
			);
		}
		const source = vars[spec.from];
		if (source === undefined) return null;
		// `map` is parsed YAML, so own-property only: a locator value of
		// `toString` must miss the map, not inherit Object.prototype's method.
		if (!Object.hasOwn(spec.map, source)) return null;
		out[name] = spec.map[source];
	}
	return out;
}

function buildResolverEntry(
	resolver: ResolverEntry,
	locatorVars: Record<string, string>,
): Record<string, unknown> | null {
	const vars = applyResolverVars(resolver, locatorVars);
	if (!vars) return null;
	let url: string | null = null;
	if (resolver.url) {
		url = expandTemplate(resolver.url, vars);
	} else if (resolver.url_by) {
		const byVars = Object.keys(resolver.url_by);
		if (byVars.length !== 1) return null;
		const byVar = byVars[0];
		const key = vars[byVar];
		if (key === undefined) return null;
		const byMap = resolver.url_by[byVar];
		url = Object.hasOwn(byMap, key) ? (byMap[key] ?? null) : null;
	}
	if (!url) return null;
	const entry: Record<string, unknown> = { url };
	if (resolver.language !== undefined) entry.language = resolver.language;
	if (resolver.edition !== undefined) entry.edition = resolver.edition;
	if (resolver.provider !== undefined) entry.provider = resolver.provider;
	entry.access = resolver.access ?? 'unknown';
	if (resolver.license !== undefined) {
		if (!SPDX_IDS.has(resolver.license)) {
			// Unreachable via authored YAML — ResolverEntrySource rejects it at
			// parse time. Kept so a future caller that skips the parser cannot
			// drop a licence statement silently.
			throw new Error(
				`license "${resolver.license}" is not an SPDX id (use license_url for non-SPDX terms)`,
			);
		}
		// Emit the canonical SPDX IRI so dcterms:license has a single
		// IRI-typed range in the JSON-LD output.
		entry.license = `https://spdx.org/licenses/${resolver.license}`;
	}
	if (resolver.license_url !== undefined)
		entry.license_url = resolver.license_url;
	if (resolver.last_checked !== undefined)
		entry.last_checked = resolver.last_checked;
	return entry;
}

function referenceUuid(
	workKey: string,
	systemKey: string,
	locator: string,
): string {
	const seed = [workKey, systemKey, locator].join('\n');
	return uuidv5(seed, REFERENCE_NS);
}

function mappingUuid(
	subject: string,
	relation: string,
	identifier: string,
): string {
	const seed = [subject, relation, identifier].join('\n');
	return uuidv5(seed, MAPPING_NS);
}

function setAlias(
	aliases: Record<string, string>,
	alias: string,
	target: string,
): void {
	const existing = aliases[alias];
	if (existing !== undefined && existing !== target) {
		throw new Error(
			`alias "${alias}" points to both ${existing} and ${target}`,
		);
	}
	aliases[alias] = target;
}

/**
 * Emit every `CanonicalReference` for one work under one citation system, and
 * mint its aliases (ADR-0005): a qualified `{work}/{system}/{locator}` for
 * every reference, plus the bare `{work}/{locator}` when this block is the
 * work's preferred citation system. Returns the number of skipped resolver
 * entries.
 */
function emitBlockReferences(opts: {
	workKey: string;
	block: SystemBlockSource;
	system: SystemSource;
	status: string;
	created: string;
	modified: string;
	isPreferred: boolean;
	outReferences: CanonicalReference[];
	aliases: Record<string, string>;
}): number {
	const { workKey, block, system, isPreferred, outReferences, aliases } = opts;
	const systemKey = system.key;
	let warnings = 0;

	const expandedRefs: ReferenceSource[] = (
		block.references_range ?? []
	).flatMap(expandRange);
	const seenLocators = new Set<string>();
	const allRefs: ReferenceSource[] = [];
	for (const r of [...expandedRefs, ...(block.references ?? [])]) {
		const loc = typeof r === 'string' ? r : r.locator;
		if (seenLocators.has(loc)) continue;
		seenLocators.add(loc);
		allRefs.push(r);
	}

	for (const refSrc of allRefs) {
		const locator = typeof refSrc === 'string' ? refSrc : refSrc.locator;
		assertValidLocator(locator, system);
		const extraResolvers =
			typeof refSrc === 'string' ? [] : (refSrc.extra_resolvers ?? []);
		const vars = deriveLocatorVars(locator, system);
		const targets: Record<string, unknown>[] = [];
		for (const resolver of block.resolvers ?? []) {
			const entry = buildResolverEntry(resolver, vars);
			if (entry) targets.push(entry);
			else warnings++;
		}
		for (const resolver of extraResolvers) {
			const entry = buildResolverEntry(resolver, vars);
			if (entry) targets.push(entry);
		}
		const uuid = referenceUuid(workKey, systemKey, locator);
		const record = {
			id: `https://textrefs.org/id/ref/${uuid}`,
			type: 'CanonicalReference' as const,
			work_key: workKey,
			citation_system_key: systemKey,
			locator,
			resolver_targets: targets,
			status: opts.status,
			created: opts.created,
			modified: opts.modified,
		};
		const parsed = CanonicalReference.safeParse(record);
		if (!parsed.success) {
			console.error(`✗ ref/${workKey}/${systemKey}/${locator}: invalid`);
			for (const issue of parsed.error.issues) {
				console.error(
					`    ${issue.path.join('.') || '(root)'}: ${issue.message}`,
				);
			}
			throw new Error(`invalid reference: ${workKey}/${systemKey}/${locator}`);
		}
		outReferences.push(parsed.data);
		// Qualified alias: always. Keyed by the same tuple that seeds the UUID,
		// so it can never collide.
		setAlias(aliases, `${workKey}/${systemKey}/${locator}`, record.id);
		// Bare alias: only for the preferred system. At most one block per work
		// is preferred, so this cannot collide either.
		if (isPreferred) setAlias(aliases, `${workKey}/${locator}`, record.id);
	}

	return warnings;
}

export interface CompiledRegistry {
	works: Work[];
	systems: CitationSystem[];
	references: CanonicalReference[];
	mappings: MappingAssertion[];
	aliases: Record<string, string>;
	warnings: number;
}

export function compileRegistry(dataRootOverride?: string): CompiledRegistry {
	const root = dataRootOverride ?? dataRoot;
	const systems = new Map<string, SystemSource>();
	for (const f of listYaml(join(root, 'systems'))) {
		const src = parseSource(
			SystemSource,
			parseYaml(readFileSync(f, 'utf8')),
			basename(f),
		);
		systems.set(src.key, src);
	}

	const workFiles = listYaml(join(root, 'works'));

	const outWorks: Work[] = [];
	const outSystems: CitationSystem[] = [];
	const outReferences: CanonicalReference[] = [];
	const outMappings: MappingAssertion[] = [];
	const aliases: Record<string, string> = {};
	let warnings = 0;

	for (const [key, src] of [...systems].sort(([a], [b]) =>
		a.localeCompare(b),
	)) {
		const record = {
			id: `https://textrefs.org/id/system/${key}`,
			key,
			type: 'CitationSystem' as const,
			preferred_label: src.preferred_label,
			description: src.description,
			locator_regex: src.locator_regex,
			status: src.status,
			created: src.created,
			modified: src.modified,
			...(src.superseded_by ? { superseded_by: src.superseded_by } : {}),
		};
		const parsed = CitationSystem.safeParse(record);
		if (!parsed.success) {
			console.error(`✗ system/${key}: invalid`);
			for (const issue of parsed.error.issues) {
				console.error(
					`    ${issue.path.join('.') || '(root)'}: ${issue.message}`,
				);
			}
			throw new Error(`invalid system: ${key}`);
		}
		outSystems.push(parsed.data);
	}

	for (const file of workFiles) {
		const src = parseSource(
			WorkSource,
			parseYaml(readFileSync(file, 'utf8')),
			basename(file),
		);
		const workKey = src.work.key;
		const workIri = `https://textrefs.org/id/work/${workKey}`;
		const systemKey = src.citation_system;

		// Direct mapping edges (prov:alternateOf / dcterms:isReferencedBy via
		// the context, ADR-0006) projected from the work's mapping assertions,
		// in addition to the reified MappingAssertion records below. Keyed off
		// the relation enum so adding a relation needs no branch here.
		// A retired assertion does not project: the edge carries no status, so
		// it would advertise a mapping the registry has taken out of use (#45).
		const mappingEdges: Record<MappingSource['relation'], string[]> = {
			alternateOf: [],
			isReferencedBy: [],
		};
		for (const m of src.mappings ?? []) {
			if (RETIRED_STATUSES.has(m.status)) continue;
			mappingEdges[m.relation].push(m.identifier);
		}

		const workRecord = {
			id: workIri,
			key: workKey,
			type: 'Work' as const,
			preferred_label: src.work.preferred_label,
			...(src.work.alternative_labels
				? { alternative_labels: src.work.alternative_labels }
				: {}),
			// The top-level `citation_system:` block is the preferred one
			// (ADR-0005); it is what mints the bare `/cite/{work}/{locator}` alias.
			preferred_citation_system_key: systemKey,
			status: src.work.status,
			created: src.work.created,
			modified: src.work.modified,
			...(src.work.superseded_by
				? { superseded_by: src.work.superseded_by }
				: {}),
			...(src.work.creators ? { creators: src.work.creators } : {}),
			...Object.fromEntries(
				Object.entries(mappingEdges).filter(([, targets]) => targets.length),
			),
		};
		const workParsed = Work.safeParse(workRecord);
		if (!workParsed.success) {
			console.error(`✗ work/${workKey}: invalid`);
			for (const issue of workParsed.error.issues) {
				console.error(
					`    ${issue.path.join('.') || '(root)'}: ${issue.message}`,
				);
			}
			throw new Error(`invalid work: ${workKey}`);
		}
		outWorks.push(workParsed.data);

		for (const mapping of src.mappings ?? []) {
			const uuid = mappingUuid(workIri, mapping.relation, mapping.identifier);
			const record = {
				id: `https://textrefs.org/id/mapping/${uuid}`,
				type: 'MappingAssertion' as const,
				subject: workIri,
				relation: mapping.relation,
				target: {
					identifier: mapping.identifier,
					...(mapping.conforms_to !== undefined && {
						conforms_to: mapping.conforms_to,
					}),
				},
				source: mapping.source,
				status: mapping.status,
				created: mapping.created,
				modified: mapping.modified,
			};
			const parsed = MappingAssertion.safeParse(record);
			if (!parsed.success) {
				console.error(`✗ mapping/${uuid}: invalid`);
				for (const issue of parsed.error.issues) {
					console.error(
						`    ${issue.path.join('.') || '(root)'}: ${issue.message}`,
					);
				}
				throw new Error(`invalid mapping: ${uuid}`);
			}
			outMappings.push(parsed.data);
			// Deliberate under ADR-0006: an `isReferencedBy` target (a page
			// *about* the work) stays a lookup alias for it. The alias table is
			// a lookup convenience, not an identity claim.
			setAlias(aliases, mapping.identifier, workIri);
		}

		// The preferred block first, then any fallback systems. Each block is
		// emitted against its own citation system, resolvers, and status.
		const blocks: Array<{ block: SystemBlockSource; isPreferred: boolean }> = [
			{
				block: {
					citation_system: systemKey,
					reference_status: src.reference_status,
					resolvers: src.resolvers,
					references: src.references,
					references_range: src.references_range,
				},
				isPreferred: true,
			},
			...(src.additional_systems ?? []).map((block) => ({
				block,
				isPreferred: false,
			})),
		];

		for (const { block, isPreferred } of blocks) {
			const system = systems.get(block.citation_system);
			if (!system) {
				throw new Error(
					`${basename(file)}: references unknown citation_system "${block.citation_system}"`,
				);
			}
			warnings += emitBlockReferences({
				workKey,
				block,
				system,
				// The preferred block inherits the work's status; a fallback block
				// defaults to `draft`, never to the work's status, so adding a
				// system to an active work never promotes data by inheritance
				// (ADR-0005).
				status:
					block.reference_status ?? (isPreferred ? src.work.status : 'draft'),
				created: src.work.created,
				modified: src.work.modified,
				isPreferred,
				outReferences,
				aliases,
			});
		}
	}

	outWorks.sort((a, b) => a.key.localeCompare(b.key));
	outReferences.sort((a, b) => a.id.localeCompare(b.id));
	outMappings.sort((a, b) => a.id.localeCompare(b.id));

	warnings += enforceRegistryInvariants({
		works: outWorks,
		systems: outSystems,
		references: outReferences,
		mappings: outMappings,
	});

	return {
		works: outWorks,
		systems: outSystems,
		references: outReferences,
		mappings: outMappings,
		aliases,
		warnings,
	};
}

type StatusRecord = {
	id: string;
	status: string;
	superseded_by?: string;
};

const TOMBSTONE_STATUSES = new Set(['withdrawn', 'blocked']);
// ADR-0004: deprecated, withdrawn and blocked are the states for records that
// have left active use.
const RETIRED_STATUSES = new Set(['deprecated', 'withdrawn', 'blocked']);

function enforceRegistryInvariants(reg: {
	works: Work[];
	systems: CitationSystem[];
	references: CanonicalReference[];
	mappings: MappingAssertion[];
}): number {
	const all: StatusRecord[] = [
		...reg.works,
		...reg.systems,
		...reg.references,
		...reg.mappings,
	];

	const tombstoneIris = new Set<string>();
	for (const r of all) {
		if (TOMBSTONE_STATUSES.has(r.status)) tombstoneIris.add(r.id);
	}

	const errors: string[] = [];

	// superseded_by carries the successor of a record that has left active use.
	// A record still in use has none.
	for (const r of all) {
		if (r.superseded_by !== undefined && !RETIRED_STATUSES.has(r.status)) {
			errors.push(
				`${r.id}: superseded_by is only allowed on deprecated/withdrawn/blocked records (status: ${r.status})`,
			);
		}
	}

	// A reference that is not itself a tombstone MUST NOT point at a tombstoned
	// work or system — those break resolution. Successor links are carried by
	// the tombstoned record's own superseded_by field (dcterms:isReplacedBy),
	// not by MappingAssertions, which are reserved for work-level equivalence.
	for (const ref of reg.references) {
		if (TOMBSTONE_STATUSES.has(ref.status)) continue;
		const workIri = `https://textrefs.org/id/work/${ref.work_key}`;
		const systemIri = `https://textrefs.org/id/system/${ref.citation_system_key}`;
		if (tombstoneIris.has(workIri))
			errors.push(
				`${ref.id}: live reference points at tombstoned work ${workIri}`,
			);
		if (tombstoneIris.has(systemIri))
			errors.push(
				`${ref.id}: live reference points at tombstoned system ${systemIri}`,
			);
	}

	// Status dependency rules — ADR-0004's general rule (an active record MUST
	// NOT depend on a draft one), specialised by ADR-0005:
	//
	//   an active reference requires an active work AND an active citation
	//     system for its own citation_system_key;
	//   an active work requires an active preferred citation system.
	//
	// A work MAY additionally carry draft fallback systems and draft references
	// without being downgraded — the status of a fallback never touches the work.
	const statusByIri = new Map<string, string>();
	for (const r of [...reg.works, ...reg.systems])
		statusByIri.set(r.id, r.status);
	const systemKeys = new Set(reg.systems.map((s) => s.key));

	for (const work of reg.works) {
		const key = work.preferred_citation_system_key;
		if (!systemKeys.has(key)) {
			errors.push(
				`${work.id}: preferred_citation_system_key "${key}" is not a known CitationSystem`,
			);
			continue;
		}
		const preferredIri = `https://textrefs.org/id/system/${key}`;
		const preferredStatus = statusByIri.get(preferredIri);
		if (work.status === 'active' && preferredStatus !== 'active')
			errors.push(
				`${work.id}: active work requires an active preferred citation system, but ${preferredIri} is ${preferredStatus}`,
			);
	}

	for (const ref of reg.references) {
		if (ref.status !== 'active') continue;
		const workIri = `https://textrefs.org/id/work/${ref.work_key}`;
		const systemIri = `https://textrefs.org/id/system/${ref.citation_system_key}`;
		const workStatus = statusByIri.get(workIri);
		const systemStatus = statusByIri.get(systemIri);
		if (workStatus !== 'active')
			errors.push(
				`${ref.id}: active reference requires an active work, but ${workIri} is ${workStatus ?? 'missing'}`,
			);
		if (systemStatus !== 'active')
			errors.push(
				`${ref.id}: active reference requires an active citation system, but ${systemIri} is ${systemStatus ?? 'missing'}`,
			);
	}

	for (const mapping of reg.mappings) {
		if (mapping.status !== 'active') continue;
		const subjectStatus = statusByIri.get(mapping.subject);
		if (subjectStatus !== 'active')
			errors.push(
				`${mapping.id}: active mapping requires an active subject work, but ${mapping.subject} is ${subjectStatus ?? 'missing'}`,
			);
	}

	if (errors.length > 0) {
		for (const e of errors) console.error(`✗ ${e}`);
		throw new Error(
			`${errors.length} registry invariant violation(s); fix the offending records:\n${errors
				.map((e) => `  - ${e}`)
				.join('\n')}`,
		);
	}
	return 0;
}

function readPackageVersion(): string {
	const pkgPath = join(projectRoot, 'package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
	return pkg.version;
}

type ResourceSpec = {
	name: string;
	filename: string;
	format: string;
	mediatype: string;
	/**
	 * The pre-serialised body. The dump is no longer JSONL-only, so each
	 * resource carries its own bytes rather than a record array.
	 */
	body: string;
};

interface ResourceDescriptor {
	name: string;
	path: string;
	profile: 'data-resource';
	format: string;
	mediatype: string;
	encoding: 'utf-8';
	bytes: number;
	hash: string;
}

function jsonlBody(records: ReadonlyArray<unknown>): string {
	return records.length === 0
		? ''
		: records.map((r) => JSON.stringify(r)).join('\n') + '\n';
}

/**
 * Every `/dump/` resource body, in descriptor order. Pure — `writeDump` does
 * the I/O — so the resource set, its media types, and its bodies are testable
 * without a filesystem.
 */
export function dumpResources(registry: CompiledRegistry): ResourceSpec[] {
	const jsonl = (
		name: string,
		filename: string,
		records: ReadonlyArray<unknown>,
	): ResourceSpec => ({
		name,
		filename,
		format: 'jsonl',
		mediatype: 'application/x-ndjson',
		body: jsonlBody(records),
	});

	// The complete alias table (#84). Two kinds of entry share it: a `/cite/`
	// alias targeting a reference IRI, and an external mapping identifier
	// targeting a work IRI. Values stay full IRIs so a consumer can tell the two
	// apart; a `://` in the key marks the second kind.
	//
	// Keys are sorted by code unit, so the body — and therefore its sha256 —
	// depends on the registry content alone, never on the order the compiler
	// happened to visit the work files in. No indentation: the body is ~13 MB.
	const aliasBody =
		JSON.stringify(
			Object.fromEntries(
				Object.entries(registry.aliases).sort(([a], [b]) =>
					a < b ? -1 : a > b ? 1 : 0,
				),
			),
		) + '\n';

	return [
		jsonl('works', 'works.jsonl', registry.works),
		jsonl('citation-systems', 'citation-systems.jsonl', registry.systems),
		jsonl('references', 'references.jsonl', registry.references),
		jsonl('mappings', 'mappings.jsonl', registry.mappings),
		{
			name: 'aliases',
			filename: 'aliases.json',
			format: 'json',
			mediatype: 'application/json',
			body: aliasBody,
		},
	];
}

/**
 * The Frictionless descriptor of one resource body: the byte count and the
 * `sha256:` hash that a consumer recomputes to verify a download.
 */
export function describeResource(spec: ResourceSpec): ResourceDescriptor {
	return {
		name: spec.name,
		path: spec.filename,
		profile: 'data-resource',
		format: spec.format,
		mediatype: spec.mediatype,
		encoding: 'utf-8',
		bytes: Buffer.byteLength(spec.body, 'utf8'),
		hash: `sha256:${createHash('sha256').update(spec.body).digest('hex')}`,
	};
}

function writeDump(registry: CompiledRegistry, version: string): void {
	const dumpDir = join(distRoot, 'dump');
	mkdirSync(dumpDir, { recursive: true });

	const resources = dumpResources(registry).map((spec) => {
		writeFileSync(join(dumpDir, spec.filename), spec.body);
		return describeResource(spec);
	});

	const datapackage = {
		profile: 'data-package',
		name: 'textrefs-registry',
		title: 'TextRefs Registry',
		version: version.replace(/^v/, ''),
		created: new Date().toISOString(),
		homepage: 'https://textrefs.org',
		licenses: [
			{
				name: 'CC0-1.0',
				path: 'https://creativecommons.org/publicdomain/zero/1.0/',
				title: 'Creative Commons Zero v1.0 Universal',
			},
		],
		resources,
	};

	writeFileSync(
		join(dumpDir, 'datapackage.json'),
		JSON.stringify(datapackage, null, 2) + '\n',
	);
}

const isCliEntry =
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith('compile.ts');

if (isCliEntry) {
	const registry = compileRegistry();
	const version = readPackageVersion();
	writeDump(registry, version);
	const totalRecords =
		registry.works.length +
		registry.systems.length +
		registry.references.length +
		registry.mappings.length;
	console.log(
		`✓ compiled ${registry.systems.length} system(s), ${registry.works.length} work(s), ${registry.references.length} reference(s), ${registry.mappings.length} mapping(s); ${Object.keys(registry.aliases).length} alias(es); ${totalRecords} records in dump`,
	);
	if (registry.warnings > 0) {
		console.warn(
			`  (${registry.warnings} resolver entry(ies) skipped — missing template variable or url_by key)`,
		);
	}
}
