# OSCAL-Info

A static documentation site for the [OSCAL](https://pages.nist.gov/OSCAL/) (Open Security Controls Assessment Language)
data models, generated directly from the official [NIST OSCAL Metaschema](https://github.com/usnistgov/OSCAL) sources.

## What it does

- Fetches the OSCAL Metaschema XML for every released OSCAL version at build time.
- Parses assemblies, fields, flags, and constraints, including inline `define-assembly`/`define-field` definitions.
- Renders a browsable reference for each model (catalog, profile, component-definition, SSP, AP, AR, POA&M) in both
  **JSON** and **XML** form.
- Provides a collapsible top-level format outline plus per-definition cards with linked properties, attributes,
  constraints, and remarks.

## Tech stack

- [Astro](https://astro.build/) v6 (static SSG, `output: 'static'`)
- [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser) with a custom DOCTYPE entity resolver
- Modular CSS under [`src/styles/`](src/styles/) (tokens, base, layout, sidebar, cards, definitions, outline)
- Deployed via GitHub Actions ([`withastro/action`](https://github.com/withastro/action)) to GitHub Pages

## Local development

Requires Node.js &ge; 22.12.

```sh
npm install
npm run dev      # http://localhost:4321/OSCAL-Info/
npm run build    # static output in ./dist
npm run preview
```

The build fetches metaschema sources from GitHub, so an internet connection is required.

## Deployment

Pushes to `main` trigger the GitHub Actions workflow in [`.github/workflows/`](.github/workflows/), which builds the
site and publishes `dist/` to GitHub Pages.
