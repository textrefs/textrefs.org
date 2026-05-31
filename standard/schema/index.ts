import { z } from 'zod';
import { Work, WorkBase } from './work.js';
import { CitationSystem, CitationSystemBase } from './citation-system.js';
import { CanonicalReference } from './canonical-reference.js';
import { ResolverTarget } from './resolver-target.js';
import { MappingAssertion } from './mapping-assertion.js';

export * from './common.js';
export {
	Work,
	CitationSystem,
	CanonicalReference,
	ResolverTarget,
	MappingAssertion,
};

export const RegistryObject = z.discriminatedUnion('type', [
	WorkBase,
	CitationSystemBase,
	CanonicalReference,
	ResolverTarget,
	MappingAssertion,
]);

export const schemaByType = {
	Work,
	CitationSystem,
	CanonicalReference,
	ResolverTarget,
	MappingAssertion,
} as const;

export type RegistryObjectType = keyof typeof schemaByType;
