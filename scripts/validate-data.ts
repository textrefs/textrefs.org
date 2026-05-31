import { v5 as uuidv5 } from 'uuid';
import { compileRegistry } from './compile.js';
import {
	Work,
	CitationSystem,
	CanonicalReference,
	MappingAssertion,
} from '../standard/schema/index.js';

const REFERENCE_NS = 'b1a3670e-2ac7-544c-a1b9-396e0dc193f7';
const MAPPING_NS = 'f16bb214-4241-549d-ad41-7b011f02befb';

const registry = compileRegistry();

let failed = 0;
let checked = 0;

function reportIssue(
	label: string,
	issues: { path: (string | number)[]; message: string }[],
): void {
	console.error(`✗ ${label}:`);
	for (const issue of issues) {
		console.error(`    ${issue.path.join('.') || '(root)'}: ${issue.message}`);
	}
	failed++;
}

for (const w of registry.works) {
	const r = Work.safeParse(w);
	checked++;
	if (!r.success) reportIssue(`work/${w.key}`, r.error.issues);
}

for (const s of registry.systems) {
	const r = CitationSystem.safeParse(s);
	checked++;
	if (!r.success) reportIssue(`system/${s.key}`, r.error.issues);
}

for (const ref of registry.references) {
	const r = CanonicalReference.safeParse(ref);
	checked++;
	if (!r.success) {
		reportIssue(`ref/${ref.work_key}/${ref.locator}`, r.error.issues);
		continue;
	}
	const seed = [
		ref.work_key,
		ref.citation_system_key,
		ref.locator,
		ref.normalization_version,
	].join('\n');
	const expected = `https://textrefs.org/id/ref/${uuidv5(seed, REFERENCE_NS)}`;
	if (ref.id !== expected) {
		console.error(
			`✗ ref/${ref.work_key}/${ref.locator}: UUID not deterministic from seed (got ${ref.id}, expected ${expected})`,
		);
		failed++;
	}
}

for (const m of registry.mappings) {
	const r = MappingAssertion.safeParse(m);
	checked++;
	if (!r.success) {
		reportIssue(`mapping/${m.id}`, r.error.issues);
		continue;
	}
	const seed = [m.subject, m.relation, m.target.identifier].join('\n');
	const expected = `https://textrefs.org/id/mapping/${uuidv5(seed, MAPPING_NS)}`;
	if (m.id !== expected) {
		console.error(
			`✗ mapping/${m.id}: UUID not deterministic from seed (expected ${expected})`,
		);
		failed++;
	}
}

console.log(
	`\n${checked - failed}/${checked} records valid (works=${registry.works.length}, systems=${registry.systems.length}, refs=${registry.references.length}, mappings=${registry.mappings.length})`,
);
if (failed > 0) process.exit(1);
