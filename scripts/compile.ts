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

const REFERENCE_NS = 'b1a3670e-2ac7-544c-a1b9-396e0dc193f7';
const MAPPING_NS = 'f16bb214-4241-549d-ad41-7b011f02befb';
const NORMALIZATION_VERSION = '1.0.0';

const projectRoot = resolve(process.cwd());
const dataRoot = join(projectRoot, 'data');
const distRoot = join(projectRoot, 'dist');

type ResolverEntry = {
	url?: string;
	url_by?: Record<string, Record<string, string>>;
	provider?: string;
	edition?: string;
	language?: string;
	access?: 'open' | 'paywalled' | 'restricted' | 'unknown';
	license?: string;
	license_url?: string;
	last_checked?: string;
};

type ReferenceSource =
	| string
	| { locator: string; extra_resolvers?: ResolverEntry[] };

type ReferenceRange =
	| { kind: 'integer'; from: number; to: number }
	| { kind: 'book_line'; counts: number[] }
	| { kind: 'book_chapter'; counts: number[] }
	| { kind: 'book_chapter_verse'; book: string; counts: number[] }
	| { kind: 'chapter_verse'; counts: number[] }
	| {
			kind: 'bekker';
			page_ranges: Array<[number, number]>;
			lines_per_column: number;
	  }
	| {
			kind: 'stephanus';
			page_range: [number, number];
			sections?: string[];
	  };

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

type MappingSource = {
	relation: 'exactMatch' | 'closeMatch';
	target_kind?: string;
	identifier: string;
	source: string;
	status: string;
	created: string;
	modified: string;
};

type CreatorSource =
	| { kind: 'person'; family: string; given?: string }
	| { kind: 'literal'; name: string };

type WorkSource = {
	work: {
		key: string;
		preferred_label: string;
		status: string;
		created: string;
		modified: string;
		creators?: CreatorSource[];
	};
	citation_system: string;
	mappings?: MappingSource[];
	resolvers?: ResolverEntry[];
	references?: ReferenceSource[];
	references_range?: ReferenceRange[];
};

type SystemSource = {
	key: string;
	preferred_label: string;
	normalization_version: string;
	locator_regex: string;
	examples: { valid: string[]; invalid: string[] };
	status: string;
	created: string;
	modified: string;
	// Per-chapter verse counts for chapter/verse systems. When present, the
	// compiler exposes a `verseGlobal` template variable (cumulative 1..N
	// across chapters) for resolvers whose anchors use a single running counter.
	chapter_sizes?: number[];
};

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
	const vars: Record<string, string> = {};
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

function buildResolverEntry(
	resolver: ResolverEntry,
	vars: Record<string, string>,
): Record<string, unknown> | null {
	let url: string | null = null;
	if (resolver.url) {
		url = expandTemplate(resolver.url, vars);
	} else if (resolver.url_by) {
		const byVars = Object.keys(resolver.url_by);
		if (byVars.length !== 1) return null;
		const byVar = byVars[0];
		const key = vars[byVar];
		if (key === undefined) return null;
		url = resolver.url_by[byVar][key] ?? null;
	}
	if (!url) return null;
	const entry: Record<string, unknown> = { url };
	if (resolver.language !== undefined) entry.language = resolver.language;
	if (resolver.edition !== undefined) entry.edition = resolver.edition;
	if (resolver.provider !== undefined) entry.provider = resolver.provider;
	entry.access = resolver.access ?? 'unknown';
	if (resolver.license !== undefined) entry.license = resolver.license;
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
	normalizationVersion: string,
): string {
	const seed = [workKey, systemKey, locator, normalizationVersion].join('\n');
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

export interface CompiledRegistry {
	works: Work[];
	systems: CitationSystem[];
	references: CanonicalReference[];
	mappings: MappingAssertion[];
	aliases: Record<string, string>;
	warnings: number;
}

export function compileRegistry(): CompiledRegistry {
	const systems = new Map<string, SystemSource>();
	for (const f of listYaml(join(dataRoot, 'systems'))) {
		const src = parseYaml(readFileSync(f, 'utf8')) as SystemSource;
		systems.set(src.key, src);
	}

	const workFiles = listYaml(join(dataRoot, 'works'));

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
			normalization_version: src.normalization_version,
			locator_regex: src.locator_regex,
			examples: src.examples,
			status: src.status,
			created: src.created,
			modified: src.modified,
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
		const src = parseYaml(readFileSync(file, 'utf8')) as WorkSource;
		const workKey = src.work.key;
		const workIri = `https://textrefs.org/id/work/${workKey}`;
		const systemKey = src.citation_system;
		const system = systems.get(systemKey);
		if (!system) {
			throw new Error(
				`${basename(file)}: references unknown citation_system "${systemKey}"`,
			);
		}

		const workRecord = {
			id: workIri,
			key: workKey,
			type: 'Work' as const,
			preferred_label: src.work.preferred_label,
			status: src.work.status,
			created: src.work.created,
			modified: src.work.modified,
			...(src.work.creators ? { creators: src.work.creators } : {}),
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
					...(mapping.target_kind !== undefined && {
						target_kind: mapping.target_kind,
					}),
					identifier: mapping.identifier,
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
			setAlias(aliases, mapping.identifier, workIri);
		}

		const explicitRefs: ReferenceSource[] = src.references ?? [];
		const expandedRefs: ReferenceSource[] = (
			src.references_range ?? []
		).flatMap(expandRange);
		const seenLocators = new Set<string>();
		const allRefs: ReferenceSource[] = [];
		for (const r of [...expandedRefs, ...explicitRefs]) {
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
			for (const resolver of src.resolvers ?? []) {
				const entry = buildResolverEntry(resolver, vars);
				if (entry) targets.push(entry);
				else warnings++;
			}
			for (const resolver of extraResolvers) {
				const entry = buildResolverEntry(resolver, vars);
				if (entry) targets.push(entry);
			}
			const uuid = referenceUuid(
				workKey,
				systemKey,
				locator,
				NORMALIZATION_VERSION,
			);
			const record = {
				id: `https://textrefs.org/id/ref/${uuid}`,
				type: 'CanonicalReference' as const,
				work_key: workKey,
				citation_system_key: systemKey,
				locator,
				normalization_version: NORMALIZATION_VERSION,
				resolver_targets: targets,
				status: src.work.status,
				created: src.work.created,
				modified: src.work.modified,
			};
			const parsed = CanonicalReference.safeParse(record);
			if (!parsed.success) {
				console.error(`✗ ref/${workKey}/${locator}: invalid`);
				for (const issue of parsed.error.issues) {
					console.error(
						`    ${issue.path.join('.') || '(root)'}: ${issue.message}`,
					);
				}
				throw new Error(`invalid reference: ${workKey}/${locator}`);
			}
			outReferences.push(parsed.data);
			setAlias(aliases, `${workKey}/${locator}`, record.id);
		}
	}

	outWorks.sort((a, b) => a.key.localeCompare(b.key));
	outReferences.sort((a, b) => a.id.localeCompare(b.id));
	outMappings.sort((a, b) => a.id.localeCompare(b.id));

	warnings += enforceTombstoneInvariants({
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

type TombstoneRecord = {
	id: string;
	status: string;
};

const TOMBSTONE_STATUSES = new Set(['withdrawn']);

function enforceTombstoneInvariants(reg: {
	works: Work[];
	systems: CitationSystem[];
	references: CanonicalReference[];
	mappings: MappingAssertion[];
}): number {
	const all: TombstoneRecord[] = [
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

	// Active CanonicalReferences MUST NOT point at tombstoned work/system —
	// those break resolution. MappingAssertions are intentionally exempt:
	// successor links are carried by active exactMatch mappings whose subject
	// is the withdrawn IRI and whose target is the active successor.
	const isActive = (r: TombstoneRecord) => !TOMBSTONE_STATUSES.has(r.status);
	for (const ref of reg.references) {
		if (!isActive(ref)) continue;
		const workIri = `https://textrefs.org/id/work/${ref.work_key}`;
		const systemIri = `https://textrefs.org/id/system/${ref.citation_system_key}`;
		if (tombstoneIris.has(workIri))
			errors.push(
				`${ref.id}: active reference points at tombstoned work ${workIri}`,
			);
		if (tombstoneIris.has(systemIri))
			errors.push(
				`${ref.id}: active reference points at tombstoned system ${systemIri}`,
			);
	}

	if (errors.length > 0) {
		for (const e of errors) console.error(`✗ ${e}`);
		throw new Error(
			`${errors.length} tombstone invariant violation(s); fix the offending records`,
		);
	}
	return 0;
}

function readPackageVersion(): string {
	const pkgPath = join(projectRoot, 'package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
	return pkg.version;
}

function writeDump(registry: CompiledRegistry, version: string): void {
	const dumpDir = join(distRoot, 'dump');
	mkdirSync(dumpDir, { recursive: true });

	type ResourceSpec = {
		name: string;
		filename: string;
		records: ReadonlyArray<unknown>;
	};

	const specs: ResourceSpec[] = [
		{ name: 'works', filename: 'works.jsonl', records: registry.works },
		{
			name: 'citation-systems',
			filename: 'citation-systems.jsonl',
			records: registry.systems,
		},
		{
			name: 'references',
			filename: 'references.jsonl',
			records: registry.references,
		},
		{
			name: 'mappings',
			filename: 'mappings.jsonl',
			records: registry.mappings,
		},
	];

	const resources = specs.map((spec) => {
		const body =
			spec.records.length === 0
				? ''
				: spec.records.map((r) => JSON.stringify(r)).join('\n') + '\n';
		const bytes = Buffer.byteLength(body, 'utf8');
		const hash = createHash('sha256').update(body).digest('hex');
		writeFileSync(join(dumpDir, spec.filename), body);
		return {
			name: spec.name,
			path: spec.filename,
			profile: 'data-resource',
			format: 'jsonl',
			mediatype: 'application/x-ndjson',
			encoding: 'utf-8',
			bytes,
			hash: `sha256:${hash}`,
		};
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
