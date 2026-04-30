// @ts-check
import { defineConfig } from 'astro/config';
import { getOscalVersions, getLatestVersion } from './src/lib/metaschema/index.ts';

const versions = await getOscalVersions();
const latest = await getLatestVersion();
const base = '/OSCAL-Info/';

/** @type {Record<string, string>} */
const redirects = {
  '/': `${base}${latest}/catalog/json/`,
};
for (const v of versions) {
  redirects[`/${v}`] = `${base}${v}/catalog/json/`;
}

export default defineConfig({
  site: 'https://OSCAL-Foundation.github.io',
  base,
  trailingSlash: 'always',
  redirects,
});
