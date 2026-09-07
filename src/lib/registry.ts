import {
	compileRegistry,
	type CompiledRegistry,
} from '../../scripts/compile.js';
import { fixtureRegistry } from './registry.fixture.js';

// Re-exported, not defined here: `scripts/compile.ts` writes the `/cite/`
// redirects and needs it too, and it cannot import this module without a cycle.
export { iriToLocal } from '../../standard/iri.js';

// Astro loads `astro.config.mjs` in a module graph of its own, separate from
// the one the pages render in, so this module is instantiated twice in a single
// build and a module-level memo is not shared between the two. Compiling the
// real registry takes about 2.6s and materialises 86k records, so the second
// pass is worth avoiding. `globalThis` is the one scope both graphs agree on;
// the registered symbol keeps the key from colliding with anything else.
//
// Lifetime is the process, exactly as the module-level memo was, so a `dev`
// server still needs a restart after the `data/` submodule changes.
const CACHE_KEY = Symbol.for('textrefs.compiledRegistry');
type CacheHost = { [CACHE_KEY]?: CompiledRegistry };

function registry(): CompiledRegistry {
	if (process.env.TEXTREFS_REGISTRY_FIXTURE === '1') return fixtureRegistry;
	const host = globalThis as CacheHost;
	host[CACHE_KEY] ??= compileRegistry();
	return host[CACHE_KEY];
}

/**
 * The whole compiled registry. A page that needs one record set uses the
 * narrow loaders below; `/dump/` describes every set at once, so it takes the
 * bundle and stays fixture-aware like every other page.
 */
export function loadRegistry(): CompiledRegistry {
	return registry();
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
