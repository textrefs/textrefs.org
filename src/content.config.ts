import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const Maturity = z.enum([
	'working-draft',
	'candidate-recommendation',
	'recommendation',
	'superseded',
]);

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				maturity: Maturity.optional(),
			}),
		}),
	}),
};
