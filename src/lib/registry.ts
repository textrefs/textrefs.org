import {
	compileRegistry,
	type CompiledRegistry,
} from '../../scripts/compile.js';
import { fixtureRegistry } from './registry.fixture.js';

let cached: CompiledRegistry | null = null;
function registry(): CompiledRegistry {
	if (process.env.TEXTREFS_REGISTRY_FIXTURE === '1') return fixtureRegistry;
	cached ??= compileRegistry();
	return cached;
}

export function loadWorks() {
	return registry().works;
}

export function loadSystems() {
	return registry().systems;
}

export function loadReferences() {
	return registry().references;
}

export function loadMappings() {
	return registry().mappings;
}

export function loadAliases() {
	return registry().aliases;
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
