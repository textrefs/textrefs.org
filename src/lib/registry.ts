import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type {
	Work,
	CitationSystem,
	CanonicalReference,
	MappingAssertion,
} from '../../standard/schema/index.js';

const dataRoot = resolve(process.cwd(), 'data');

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function listJson(dir: string): string[] {
	const full = join(dataRoot, dir);
	if (!existsSync(full)) return [];
	return readdirSync(full)
		.filter((n) => n.endsWith('.json'))
		.map((n) => join(full, n));
}

export function loadWorks(): Work[] {
	return listJson('works').map((p) => readJson<Work>(p));
}

export function loadSystems(): CitationSystem[] {
	return listJson('systems').map((p) => readJson<CitationSystem>(p));
}

export function loadReferences(): CanonicalReference[] {
	return listJson('refs').map((p) => readJson<CanonicalReference>(p));
}

export function loadMappings(): MappingAssertion[] {
	return listJson('mappings').map((p) => readJson<MappingAssertion>(p));
}

export function loadAliases(): Record<string, string> {
	const p = join(dataRoot, 'aliases.json');
	if (!existsSync(p)) return {};
	return readJson<Record<string, string>>(p);
}

export function uuidOf(iri: string): string {
	return iri.split('/').pop() ?? iri;
}

export function workKeyOf(iri: string): string {
	return iri.replace(/^https:\/\/textrefs\.org\/id\/work\//, '');
}

export function iriToLocal(iri: string): string {
	const refMatch = iri.match(
		/^https:\/\/textrefs\.org\/id\/ref\/([0-9a-f-]+)$/,
	);
	if (refMatch) return `/reg/id/${refMatch[1]}/`;
	const objMatch = iri.match(
		/^https:\/\/textrefs\.org\/id\/(work|system)\/(.+)$/,
	);
	if (objMatch) return `/reg/${objMatch[1]}/${objMatch[2]}/`;
	return iri;
}
