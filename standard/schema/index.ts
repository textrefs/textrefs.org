import { z } from 'zod';
import { Work, WorkBase, Creator } from './work.js';
import { CitationSystem, CitationSystemBase } from './citation-system.js';
import {
	CanonicalReference,
	CanonicalReferenceBase,
	ResolverTargetEntry,
} from './canonical-reference.js';
import { MappingAssertion, MappingAssertionBase } from './mapping-assertion.js';

export * from './common.js';
export {
	Work,
	Creator,
	CitationSystem,
	CanonicalReference,
	ResolverTargetEntry,
	MappingAssertion,
};

export const RegistryObject = z.discriminatedUnion('type', [
	WorkBase,
	CitationSystemBase,
	CanonicalReferenceBase,
	MappingAssertionBase,
]);

export const schemaByType = {
	Work,
	CitationSystem,
	CanonicalReference,
	MappingAssertion,
} as const;

export type RegistryObjectType = keyof typeof schemaByType;
