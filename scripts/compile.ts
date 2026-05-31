import {
	readFileSync,
	readdirSync,
	statSync,
	writeFileSync,
	rmSync,
	mkdirSync,
	existsSync,
} from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const dataRoot = fileURLToPath(new URL('../data', import.meta.url));
const sourceRoot = join(dataRoot, 'source');

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

// Compact shorthand for large canonical reference sets. Each entry is one
// named expander; the compiler concatenates the expansion of every entry with
// the explicit `references:` list and de-duplicates. See docs/get-started/authoring.
type ReferenceRange =
	| { kind: 'integer'; from: number; to: number }
	| { kind: 'book_line'; counts: number[] }
	| { kind: 'book_chapter'; counts: number[] }
	| {
			kind: 'book_chapter_verse';
			book: string;
			counts: number[];
	  }
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

type WorkSource = {
	work: {
		key: string;
		preferred_label: string;
		status: string;
		created: string;
		modified: string;
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
};

function walk(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});
}

function slugifyLocator(locator: string): string {
	return locator
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
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
			}
		}
	}
	return vars;
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

function emitFile(path: string, value: unknown): void {
	mkdirSync(join(path, '..'), { recursive: true });
	writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

function clean(dir: string): void {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
		return;
	}
	for (const name of readdirSync(dir)) {
		if (name.endsWith('.json')) rmSync(join(dir, name));
	}
}

const systems = new Map<string, SystemSource>();
const systemFiles = walk(join(sourceRoot, 'systems')).filter((f) =>
	f.endsWith('.yaml'),
);
for (const f of systemFiles) {
	const src = parseYaml(readFileSync(f, 'utf8')) as SystemSource;
	systems.set(src.key, src);
}

const workFiles = walk(sourceRoot).filter(
	(f) => f.endsWith('.yaml') && !f.includes(`${sourceRoot}/systems/`),
);

clean(join(dataRoot, 'works'));
clean(join(dataRoot, 'systems'));
clean(join(dataRoot, 'refs'));
clean(join(dataRoot, 'mappings'));

const aliases: Record<string, string> = {};
let warnings = 0;

for (const [key, src] of systems) {
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
		process.exit(1);
	}
	emitFile(join(dataRoot, 'systems', `${key}.json`), record);
}

for (const file of workFiles) {
	const src = parseYaml(readFileSync(file, 'utf8')) as WorkSource;
	const workKey = src.work.key;
	const workIri = `https://textrefs.org/id/work/${workKey}`;
	const systemKey = src.citation_system;
	const system = systems.get(systemKey);
	if (!system) {
		console.error(
			`✗ ${basename(file)}: references unknown citation_system "${systemKey}"`,
		);
		process.exit(1);
	}

	const workRecord = {
		id: workIri,
		key: workKey,
		type: 'Work' as const,
		preferred_label: src.work.preferred_label,
		status: src.work.status,
		created: src.work.created,
		modified: src.work.modified,
	};
	const workParsed = Work.safeParse(workRecord);
	if (!workParsed.success) {
		console.error(`✗ work/${workKey}: invalid`);
		for (const issue of workParsed.error.issues) {
			console.error(
				`    ${issue.path.join('.') || '(root)'}: ${issue.message}`,
			);
		}
		process.exit(1);
	}
	emitFile(join(dataRoot, 'works', `${workKey}.json`), workRecord);

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
			process.exit(1);
		}
		emitFile(join(dataRoot, 'mappings', `${uuid}.json`), record);
		aliases[mapping.identifier] = workIri;
	}

	const explicitRefs: ReferenceSource[] = src.references ?? [];
	const expandedRefs: ReferenceSource[] = (src.references_range ?? []).flatMap(
		expandRange,
	);
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
			process.exit(1);
		}
		const slug = slugifyLocator(locator);
		emitFile(join(dataRoot, 'refs', `${workKey}__${slug}.json`), record);
		aliases[`${workKey}/${locator}`] = record.id;
	}
}

emitFile(join(dataRoot, 'aliases.json'), aliases);

console.log(
	`✓ compiled ${systems.size} system(s), ${workFiles.length} work(s); ${Object.keys(aliases).length} alias(es)`,
);
if (warnings > 0) {
	console.warn(
		`  (${warnings} resolver entry(ies) skipped — missing template variable or url_by key)`,
	);
}
