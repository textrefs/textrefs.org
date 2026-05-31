import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	schemaByType,
	type RegistryObjectType,
} from '../standard/schema/index.js';

const root = fileURLToPath(new URL('../data', import.meta.url));

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});
}

const files = walk(root).filter((f) => f.endsWith('.json'));
let failed = 0;

for (const file of files) {
	const rel = relative(root, file);
	let parsed: unknown;
	try {
		parsed = JSON.parse(readFileSync(file, 'utf8'));
	} catch (e) {
		console.error(`✗ ${rel}: invalid JSON — ${(e as Error).message}`);
		failed++;
		continue;
	}
	const type = (parsed as { type?: string })?.type as
		| RegistryObjectType
		| undefined;
	if (!type || !(type in schemaByType)) {
		console.error(`✗ ${rel}: missing or unknown "type" field`);
		failed++;
		continue;
	}
	const result = schemaByType[type].safeParse(parsed);
	if (!result.success) {
		console.error(`✗ ${rel}:`);
		for (const issue of result.error.issues) {
			console.error(
				`    ${issue.path.join('.') || '(root)'}: ${issue.message}`,
			);
		}
		failed++;
	} else {
		console.log(`✓ ${rel}`);
	}
}

console.log(`\n${files.length - failed}/${files.length} records valid`);
if (failed > 0) process.exit(1);
