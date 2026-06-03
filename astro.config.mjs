// @ts-check
import { defineConfig } from 'astro/config';
import mermaid from 'astro-mermaid';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';
import starlightBlog from 'starlight-blog';

const siteDomain = process.env.SITE_DOMAIN ?? 'textrefs.org';
const site = siteDomain.startsWith('http')
	? siteDomain
	: `https://${siteDomain}`;

export default defineConfig({
	site,
	integrations: [
		mermaid({ autoTheme: true }),
		starlight({
			plugins: [
				starlightBlog({
					title: 'Announcements',
					authors: {
						moritz: {
							name: 'Moritz Mähr',
							url: 'https://moritzmaehr.ch',
						},
						luz: {
							name: 'Luz Christopher Seiberth',
						},
					},
				}),
				starlightLinksValidator({
					errorOnFallbackPages: false,
					exclude: ['/id/**', '/reg/**', '/cite/**', '/api/**'],
				}),
				starlightOpenAPI([
					{
						base: 'api',
						label: 'API',
						schema: './api/openapi.yaml',
					},
				]),
				starlightLlmsTxt({
					projectName: 'TextRefs',
					description:
						'An open, persistent, machine-readable registry for canonical text references. Records live at /id/ — /id/{type}/{key}/ for HTML, /id/{type}/{key}.json for JSON-LD (advertised via <link rel="alternate">). /reg/ browses the registry; /cite/ redirects short aliases; /api/ documents the contract (OpenAPI at /api/openapi.yaml, JSON-LD context at /contexts/v1.jsonld).',
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
				PageTitle: './src/components/PageTitle.astro',
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
					label: 'Registry',
					translations: { de: 'Verzeichnis' },
					items: [{ label: 'Browse', link: '/reg/' }],
				},
				...openAPISidebarGroups,
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
