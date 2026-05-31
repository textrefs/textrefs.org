import { z } from 'zod';
import { Work, WorkBase } from './work.js';
import { CitationSystem, CitationSystemBase } from './citation-system.js';
import {
	CanonicalReference,
	ResolverTargetEntry,
} from './canonical-reference.js';
import { MappingAssertion } from './mapping-assertion.js';

export * from './common.js';
export {
	Work,
	CitationSystem,
	CanonicalReference,
	ResolverTargetEntry,
	MappingAssertion,
};

export const RegistryObject = z.discriminatedUnion('type', [
	WorkBase,
	CitationSystemBase,
	CanonicalReference,
	MappingAssertion,
]);

export const schemaByType = {
	Work,
	CitationSystem,
	CanonicalReference,
	MappingAssertion,
} as const;

export type RegistryObjectType = keyof typeof schemaByType;
