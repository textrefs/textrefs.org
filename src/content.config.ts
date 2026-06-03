import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { blogSchema } from 'starlight-blog/schema';
import { UNSTABLE_BANNER } from './lib/banner.ts';

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
			extend: (context) =>
				blogSchema(context).and(
					z.object({
						maturity: Maturity.optional(),
						banner: z.object({ content: z.string() }).default(UNSTABLE_BANNER),
					}),
				),
		}),
	}),
};
