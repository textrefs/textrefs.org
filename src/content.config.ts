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
		// `extend` must return a ZodObject: Starlight deep-merges it into its own
		// frontmatter shape, so an intersection (`.and()`) is rejected.
		schema: docsSchema({
			extend: (context) =>
				blogSchema(context).extend({
					maturity: Maturity.optional(),
					banner: z.object({ content: z.string() }).default(UNSTABLE_BANNER),
				}),
		}),
	}),
};
