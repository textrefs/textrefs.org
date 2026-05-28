// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

export default defineConfig({
	site: 'https://textrefs.org',
	integrations: [
		starlight({
			plugins: [
				starlightLinksValidator({
					errorOnFallbackPages: false,
				}),
			],
			title: 'TextRefs',
			description:
				'An open, persistent, machine-readable registry for canonical text references.',
			logo: { src: './public/logo.svg', replacesTitle: true },
			favicon: '/favicon.svg',
			customCss: ['./src/styles/brand.css'],
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'preload',
						href: '/fonts/inter-v20-latin-regular.woff2',
						as: 'font',
						type: 'font/woff2',
						crossorigin: '',
					},
				},
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: '/logo.svg' } },
			],
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/textrefs/textrefs.org',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/textrefs/textrefs.org/edit/main/',
			},
			components: {
				Footer: './src/components/Footer.astro',
			},
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				de: { label: 'Deutsch', lang: 'de' },
			},
			sidebar: [
				{
					label: 'Get started',
					translations: { de: 'Erste Schritte' },
					items: [{ autogenerate: { directory: 'get-started' } }],
				},
				{
					label: 'Standard',
					items: [{ autogenerate: { directory: 'standard' } }],
				},
				{
					label: 'Community',
					items: [{ autogenerate: { directory: 'community' } }],
				},
				{
					label: 'Association',
					translations: { de: 'Verein' },
					items: [{ autogenerate: { directory: 'association' } }],
				},
			],
		}),
	],
});
