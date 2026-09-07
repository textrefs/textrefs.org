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
import type { z, ZodType } from 'zod';
import {
	Work,
	CitationSystem,
	CanonicalReference,
	MappingAssertion,
} from '../standard/schema/index.js';
import type { ResolverTargetEntry } from '../standard/schema/canonical-reference.js';
import {
	workIri,
	systemIri,
	refIri,
	mappingIri,
	iriToLocal,
} from '../standard/iri.js';
import { isDraft } from '../src/lib/record-status.js';
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

// Specification §9: a published `license` is the canonical SPDX IRI, and the
// authored SPDX id is the part after this prefix. `spdxLicenseLabel` in
// `src/lib/license.ts` reverses this to render the id, so both sides import the
// one constant rather than repeating the string.
export const SPDX_LICENSE_BASE = 'https://spdx.org/licenses/';

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
			for (let b = 1; b <= range.counts.length; b++) {
				const lines = range.counts[b - 1];
				for (let l = 1; l <= lines; l++) out.push(`${b}.${l}`);
			}
			return out;
		}
		case 'book_chapter': {
			const out: string[] = [];
			for (let b = 1; b <= range.counts.length; b++) {
				const chapters = range.counts[b - 1];
				for (let c = 1; c <= chapters; c++) out.push(`${b}.${c}`);
			}
			return out;
		}
		case 'book_chapter_verse': {
			const out: string[] = [];
			for (let ch = 1; ch <= range.counts.length; ch++) {
				const verses = range.counts[ch - 1];
				for (let v = 1; v <= verses; v++) out.push(`${range.book}.${ch}.${v}`);
			}
			return out;
		}
		case 'chapter_verse': {
			const out: string[] = [];
			for (let ch = 1; ch <= range.counts.length; ch++) {
				const verses = range.counts[ch - 1];
				for (let v = 1; v <= verses; v++) out.push(`${ch}.${v}`);
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
): ResolverTargetEntry | null {
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
	if (resolver.license !== undefined && !SPDX_IDS.has(resolver.license)) {
		// Unreachable via authored YAML — ResolverEntrySource rejects it at
		// parse time. Kept so a future caller that skips the parser cannot
		// drop a licence statement silently.
		throw new Error(
			`license "${resolver.license}" is not an SPDX id (record the provider's rights statement in license_url)`,
		);
	}
	// TypeScript checks every field name and value below, rather than deferring
	// a typo to `safeParse`. The assignment order is the published key order,
	// and therefore the byte order of the JSONL dump: do not reorder these
	// lines.
	//
	// Assignment rather than one object literal of conditional spreads. The
	// literal reads better, but each `...(cond && { k: v })` allocates a
	// throwaway object, and this runs 172k times per compile — measured at 3x
	// the cost of the assignments for no gain, since the type below checks
	// these just as well.
	//
	// `Pick<…, 'url'>` keeps `url` required, so dropping it from the initialiser
	// is a compile error. `access` cannot be covered the same way: it is
	// required too, but it is assigned fifth to hold the key order, and
	// TypeScript does not let a narrowed property satisfy a required one — no
	// arrangement of guards makes the object assignable without the cast. So
	// the cast asserts exactly one thing, that `access` was assigned. It is
	// assigned unconditionally three lines down, and `CanonicalReference`
	// rejects the record on the first reference if that ever stops being true.
	const entry: Pick<ResolverTargetEntry, 'url'> & Partial<ResolverTargetEntry> =
		{ url };
	if (resolver.language !== undefined) entry.language = resolver.language;
	if (resolver.edition !== undefined) entry.edition = resolver.edition;
	if (resolver.provider !== undefined) entry.provider = resolver.provider;
	entry.access = resolver.access ?? 'unknown';
	// Emit the canonical SPDX IRI so dcterms:license has a single IRI-typed
	// range in the JSON-LD output.
	if (resolver.license !== undefined)
		entry.license = `${SPDX_LICENSE_BASE}${resolver.license}`;
	if (resolver.license_url !== undefined)
		entry.license_url = resolver.license_url;
	if (resolver.last_checked !== undefined)
		entry.last_checked = resolver.last_checked;
	return entry as ResolverTargetEntry;
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

/**
 * Print the indented issue lines of a failed `safeParse`, in the one form both
 * registry gates use.
 *
 * Only the issue lines are shared. The header above them, and what happens
 * after, differ by caller and must: the compiler names the record and throws,
 * because a malformed record must never reach the dump, while
 * `scripts/validate-data.ts` counts the failure and continues, so that one run
 * reports every bad record instead of only the first.
 */
export function printIssues(
	issues: readonly { path: readonly PropertyKey[]; message: string }[],
): void {
	for (const issue of issues) {
		const path = issue.path.map((p) => String(p)).join('.');
		console.error(`    ${path || '(root)'}: ${issue.message}`);
	}
}

/**
 * Validate one compiled record against its canonical schema, or fail the build.
 *
 * Every record type ran this same block before: report the path and message of
 * each issue, then throw. `prefix` names the record the way its IRI does
 * (`ref`, `system`, `work`, `mapping`); `kind` names it the way the thrown
 * error reads. The two differ only for a reference, whose IRI says `ref`.
 */
function parseRecord<S extends ZodType>(
	schema: S,
	record: unknown,
	kind: string,
	prefix: string,
	id: string,
): z.infer<S> {
	const parsed = schema.safeParse(record);
	if (parsed.success) return parsed.data;
	console.error(`✗ ${prefix}/${id}: invalid`);
	printIssues(parsed.error.issues);
	throw new Error(`invalid ${kind}: ${id}`);
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
		// The block's resolvers first, then this reference's own extras. A
		// skipped entry warns whichever list it came from: only the first loop
		// counted before, so a hole in a per-reference `extra_resolvers` map
		// stayed silent — the one outcome `applyResolverVars` exists to prevent.
		//
		// Two loops rather than one over a concatenation. Joining the lists
		// reads better and allocates an array per reference, 86k of them, to
		// save four lines. The duplication is the cheaper half of that trade.
		const targets: ResolverTargetEntry[] = [];
		for (const resolver of block.resolvers ?? []) {
			const entry = buildResolverEntry(resolver, vars);
			if (entry) targets.push(entry);
			else warnings++;
		}
		for (const resolver of extraResolvers) {
			const entry = buildResolverEntry(resolver, vars);
			if (entry) targets.push(entry);
			else warnings++;
		}
		const uuid = referenceUuid(workKey, systemKey, locator);
		const record = {
			id: refIri(uuid),
			type: 'CanonicalReference' as const,
			work_key: workKey,
			citation_system_key: systemKey,
			locator,
			resolver_targets: targets,
			status: opts.status,
			created: opts.created,
			modified: opts.modified,
		};
		outReferences.push(
			parseRecord(
				CanonicalReference,
				record,
				'reference',
				'ref',
				`${workKey}/${systemKey}/${locator}`,
			),
		);
		// Qualified alias: always. Keyed by the same tuple that seeds the UUID,
		// so it can never collide.
		setAlias(aliases, `${workKey}/${systemKey}/${locator}`, record.id);
		// Bare alias: only for the preferred system. At most one block per work
		// is preferred, so this cannot collide either.
		if (isPreferred) setAlias(aliases, `${workKey}/${locator}`, record.id);
	}

	return warnings;
}

/**
 * Emit one work's reified `MappingAssertion` records, and the lookup alias each
 * one earns.
 *
 * Separate from the `alternateOf` / `isReferencedBy` projection onto the Work:
 * that projection drops retired assertions (#45), because an edge carries no
 * status and would advertise a mapping the registry has taken out of use. A
 * record keeps its own status, so every assertion becomes one, retired or not.
 */
function emitMappings(
	src: WorkSource,
	thisWorkIri: string,
	outMappings: MappingAssertion[],
	aliases: Record<string, string>,
): void {
	for (const mapping of src.mappings ?? []) {
		const uuid = mappingUuid(thisWorkIri, mapping.relation, mapping.identifier);
		const record = {
			id: mappingIri(uuid),
			type: 'MappingAssertion' as const,
			subject: thisWorkIri,
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
		outMappings.push(
			parseRecord(MappingAssertion, record, 'mapping', 'mapping', uuid),
		);
		// Deliberate under ADR-0006: an `isReferencedBy` target (a page
		// *about* the work) stays a lookup alias for it. The alias table is
		// a lookup convenience, not an identity claim.
		setAlias(aliases, mapping.identifier, thisWorkIri);
	}
}

/**
 * A work's citation system blocks: the preferred one first, then any fallback
 * systems. Each block is emitted against its own citation system, resolvers,
 * and status, and only the first mints the bare `/cite/{work}/{locator}` alias
 * (ADR-0005).
 */
function systemBlocksOf(
	src: WorkSource,
): Array<{ block: SystemBlockSource; isPreferred: boolean }> {
	return [
		{
			block: {
				citation_system: src.citation_system,
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
	// A key is the whole identity of a citation system, so two files claiming
	// one is an authoring error, not a merge. `Map.set` would keep the last file
	// read and drop the other without a word.
	const systemFileByKey = new Map<string, string>();
	for (const f of listYaml(join(root, 'systems'))) {
		const src = parseSource(
			SystemSource,
			parseYaml(readFileSync(f, 'utf8')),
			basename(f),
		);
		const firstFile = systemFileByKey.get(src.key);
		if (firstFile !== undefined) {
			throw new Error(
				`citation system key "${src.key}" is declared twice: ${firstFile} and ${basename(f)}`,
			);
		}
		systemFileByKey.set(src.key, basename(f));
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
			id: systemIri(key),
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
		outSystems.push(
			parseRecord(CitationSystem, record, 'system', 'system', key),
		);
	}

	// Two work files claiming one key is never a merge. ADR-0002 seeds every
	// reference UUID on `(work_key, citation_system_key, locator)`, so the
	// second file would not just duplicate the Work record — it would mint the
	// same reference identifiers as the first, and `setAlias` cannot see it
	// because both files produce the same alias target.
	const workFileByKey = new Map<string, string>();

	for (const file of workFiles) {
		const src = parseSource(
			WorkSource,
			parseYaml(readFileSync(file, 'utf8')),
			basename(file),
		);
		const workKey = src.work.key;
		const firstWorkFile = workFileByKey.get(workKey);
		if (firstWorkFile !== undefined) {
			throw new Error(
				`work key "${workKey}" is declared twice: ${firstWorkFile} and ${basename(file)}`,
			);
		}
		workFileByKey.set(workKey, basename(file));
		const thisWorkIri = workIri(workKey);
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
			id: thisWorkIri,
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
		outWorks.push(parseRecord(Work, workRecord, 'work', 'work', workKey));

		emitMappings(src, thisWorkIri, outMappings, aliases);

		for (const { block, isPreferred } of systemBlocksOf(src)) {
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

	enforceRegistryInvariants({
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
}): void {
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
		const refWorkIri = workIri(ref.work_key);
		const refSystemIri = systemIri(ref.citation_system_key);
		if (tombstoneIris.has(refWorkIri))
			errors.push(
				`${ref.id}: live reference points at tombstoned work ${refWorkIri}`,
			);
		if (tombstoneIris.has(refSystemIri))
			errors.push(
				`${ref.id}: live reference points at tombstoned system ${refSystemIri}`,
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
		const preferredIri = systemIri(key);
		if (!TOMBSTONE_STATUSES.has(work.status) && tombstoneIris.has(preferredIri))
			errors.push(
				`${work.id}: live work points at tombstoned preferred citation system ${preferredIri}`,
			);
		const preferredStatus = statusByIri.get(preferredIri);
		if (work.status === 'active' && preferredStatus !== 'active')
			errors.push(
				`${work.id}: active work requires an active preferred citation system, but ${preferredIri} is ${preferredStatus}`,
			);
	}

	for (const ref of reg.references) {
		if (ref.status !== 'active') continue;
		const refWorkIri = workIri(ref.work_key);
		const refSystemIri = systemIri(ref.citation_system_key);
		const workStatus = statusByIri.get(refWorkIri);
		const systemStatus = statusByIri.get(refSystemIri);
		if (workStatus !== 'active')
			errors.push(
				`${ref.id}: active reference requires an active work, but ${refWorkIri} is ${workStatus ?? 'missing'}`,
			);
		if (systemStatus !== 'active')
			errors.push(
				`${ref.id}: active reference requires an active citation system, but ${refSystemIri} is ${systemStatus ?? 'missing'}`,
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
}

export function readPackageVersion(): string {
	const pkgPath = join(projectRoot, 'package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
	return pkg.version;
}

/**
 * The registry version as the data package spells it: SemVer with no leading
 * `v`, per `standard/versioning.md`. One function so the descriptor and the
 * `/dump/` page can never disagree about the form.
 */
export function packageVersion(version: string): string {
	return version.replace(/^v/, '');
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

export interface ResourceDescriptor {
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
 * The complete alias table (#84). Two kinds of entry share it: a `/cite/` alias
 * targeting a reference IRI, and an external mapping identifier targeting a
 * work IRI. Values stay full IRIs so a consumer can tell the two apart; a `://`
 * in the key marks the second kind.
 *
 * Keys are sorted by code unit, so the body — and therefore its sha256 —
 * depends on the registry content alone, never on the order the compiler
 * happened to visit the work files in. No indentation: the body is ~17 MB.
 */
function aliasBody(registry: CompiledRegistry): string {
	return (
		JSON.stringify(
			Object.fromEntries(
				Object.entries(registry.aliases).sort(([a], [b]) =>
					a < b ? -1 : a > b ? 1 : 0,
				),
			),
		) + '\n'
	);
}

/**
 * The five `/dump/` resources, declared once, in descriptor order.
 *
 * `body` is a thunk rather than a string because the two consumers need
 * different halves of this list. `DUMP_MANIFEST` below is the file list alone,
 * which `/dump/index.astro` renders during `astro build`; forcing the bodies
 * there would serialise and hash ~90 MB that `scripts/compile.ts` then
 * serialises and hashes again. `dumpResources` is the same list with every
 * thunk called.
 *
 * Declaring the set twice is what this replaces: the manifest and the resource
 * builder each listed all five, and only a test kept them in step.
 */
const DUMP_SPECS: ReadonlyArray<{
	name: string;
	filename: string;
	format: string;
	mediatype: string;
	body: (registry: CompiledRegistry) => string;
}> = [
	{
		name: 'works',
		filename: 'works.jsonl',
		format: 'jsonl',
		mediatype: 'application/x-ndjson',
		body: (r) => jsonlBody(r.works),
	},
	{
		name: 'citation-systems',
		filename: 'citation-systems.jsonl',
		format: 'jsonl',
		mediatype: 'application/x-ndjson',
		body: (r) => jsonlBody(r.systems),
	},
	{
		name: 'references',
		filename: 'references.jsonl',
		format: 'jsonl',
		mediatype: 'application/x-ndjson',
		body: (r) => jsonlBody(r.references),
	},
	{
		name: 'mappings',
		filename: 'mappings.jsonl',
		format: 'jsonl',
		mediatype: 'application/x-ndjson',
		body: (r) => jsonlBody(r.mappings),
	},
	{
		name: 'aliases',
		filename: 'aliases.json',
		format: 'json',
		mediatype: 'application/json',
		body: aliasBody,
	},
];

/**
 * What `/dump/` publishes, without any body. Derived from `DUMP_SPECS`, so it
 * cannot drift from what `dumpResources` actually writes.
 */
export const DUMP_MANIFEST = DUMP_SPECS.map(({ name, filename, format }) => ({
	name,
	filename,
	format,
}));

/**
 * Every `/dump/` resource body, in descriptor order. Pure — `writeDump` does
 * the I/O — so the resource set, its media types, and its bodies are testable
 * without a filesystem.
 */
export function dumpResources(registry: CompiledRegistry): ResourceSpec[] {
	return DUMP_SPECS.map((spec) => ({
		name: spec.name,
		filename: spec.filename,
		format: spec.format,
		mediatype: spec.mediatype,
		body: spec.body(registry),
	}));
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

/**
 * The Frictionless data package that describes the whole `/dump/` directory.
 * Pure, so that `/dump/index.html` can render the same descriptor that
 * `/dump/datapackage.json` publishes, from the same registry, and neither can
 * drift from the other.
 *
 * `created` is a parameter rather than a `new Date()` call, because a caller
 * that only reads the descriptor must not depend on the clock.
 */
export function datapackageDescriptor(
	resources: ReadonlyArray<ResourceDescriptor>,
	version: string,
	created: string,
) {
	return {
		profile: 'data-package',
		name: 'textrefs-registry',
		title: 'TextRefs Registry',
		version: packageVersion(version),
		created,
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
}

/** The filename of the descriptor itself, which no resource entry describes. */
export const DATAPACKAGE_FILENAME = 'datapackage.json';

/**
 * One `/cite/` redirect page, in 370 bytes.
 *
 * Four things earn their place, and nothing else does. The refresh performs the
 * redirect, because GitHub Pages serves no `Location` header. The canonical
 * link states the target for a client that ignores the refresh. The title and
 * the `lang` attribute keep the page at the WCAG 2.2 AA baseline the site
 * holds everywhere else (SC 2.4.2 and SC 3.1.1). The paragraph gives a person
 * a link to follow when nothing redirects them.
 *
 * `<html>`, `<head>` and `<body>` are implied and left out. The target is
 * spelled twice, not three times: as the link text it added 44 bytes a page,
 * and the reader already has it in the address bar.
 *
 * `target` is always a site path that `iriToLocal` produced, so it holds a
 * record type and a flat key or a UUID, and it needs no escaping.
 *
 * ADR-0003: an alias of a draft record is `noindex`, exactly like the record it
 * redirects to.
 */
export function citeRedirectHtml(target: string, noindex: boolean): string {
	return (
		'<!doctype html><html lang="en"><meta charset="utf-8">' +
		'<title>Redirecting</title>' +
		`<meta http-equiv="refresh" content="0;url=${target}">` +
		`<link rel="canonical" href="${target}">` +
		(noindex ? '<meta name="robots" content="noindex">' : '') +
		`<p>Redirecting to <a href="${target}">the record</a>.`
	);
}

/**
 * Write `dist/cite/{alias}/index.html` for every alias the compiler minted.
 *
 * These pages are output, not routes. Astro rendered 172,794 of them through
 * the full route pipeline to produce four tags each, and Pagefind then opened
 * every one of them to find no `data-pagefind-body`. Writing them here, after
 * `astro build`, costs a `writeFileSync` per alias and hides them from both.
 * `/dump/` already works this way.
 *
 * The alias table mixes two key kinds: a `/cite/` alias path, and an external
 * mapping identifier. Only the first is a route, and an identifier is an IRI,
 * so the `://` test that the Astro route applied still separates them.
 *
 * A draft target is `noindex`. The rule matches `draftRecordIris` in
 * `src/lib/sitemap.ts`, which keeps the same pages out of the sitemap.
 *
 * Returns the number of pages written. `citeRootOverride` exists for the tests,
 * like `dataRootOverride` on `compileRegistry`.
 */
export function writeCiteRedirects(
	registry: CompiledRegistry,
	citeRootOverride?: string,
): number {
	const draft = new Set<string>();
	for (const record of [
		...registry.works,
		...registry.systems,
		...registry.references,
		...registry.mappings,
	]) {
		if (isDraft(record.status)) draft.add(record.id);
	}

	const citeDir = citeRootOverride ?? join(distRoot, 'cite');
	let written = 0;
	for (const [alias, target] of Object.entries(registry.aliases)) {
		if (alias.includes('://')) continue;
		// An alias needs a directory of its own, because the URL it serves ends
		// in a slash. `recursive` is what makes the call idempotent: the parent
		// exists after the first sibling, and a bare alias may reuse a directory
		// a qualified one already created.
		const dir = join(citeDir, alias);
		mkdirSync(dir, { recursive: true });
		writeFileSync(
			join(dir, 'index.html'),
			citeRedirectHtml(iriToLocal(target), draft.has(target)),
		);
		written++;
	}
	return written;
}

function writeDump(registry: CompiledRegistry, version: string): void {
	const dumpDir = join(distRoot, 'dump');
	mkdirSync(dumpDir, { recursive: true });

	const resources = dumpResources(registry).map((spec) => {
		writeFileSync(join(dumpDir, spec.filename), spec.body);
		return describeResource(spec);
	});

	writeFileSync(
		join(dumpDir, DATAPACKAGE_FILENAME),
		JSON.stringify(
			datapackageDescriptor(resources, version, new Date().toISOString()),
			null,
			2,
		) + '\n',
	);
}

const isCliEntry =
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith('compile.ts');

if (isCliEntry) {
	const registry = compileRegistry();
	const version = readPackageVersion();
	writeDump(registry, version);
	const redirects = writeCiteRedirects(registry);
	const totalRecords =
		registry.works.length +
		registry.systems.length +
		registry.references.length +
		registry.mappings.length;
	console.log(
		`✓ compiled ${registry.systems.length} system(s), ${registry.works.length} work(s), ${registry.references.length} reference(s), ${registry.mappings.length} mapping(s); ${Object.keys(registry.aliases).length} alias(es), ${redirects} /cite/ redirect(s); ${totalRecords} records in dump`,
	);
	if (registry.warnings > 0) {
		console.warn(
			`  (${registry.warnings} resolver entry(ies) skipped — missing template variable or url_by key)`,
		);
	}
}
