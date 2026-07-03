# Effi Revamp

React conversion of the Effi marketing site from the `builder-io` HTML scrape. Pages preserve the original HTML markup and Oxygen/WordPress styles.

## Routes

| Path | Source |
|------|--------|
| `/` | `builder-io/index.html` |
| `/automations` | `builder-io/automations/index.html` |
| `/enterprise` | `builder-io/enterprise/index.html` |
| `/pricing` | `builder-io/pricing/index.html` |
| `/company` | `builder-io/company/index.html` |
| `/get-started` | `builder-io/get-started/index.html` |
| `/book-professional` | `builder-io/book-professional/index.html` |
| `/book-enterprise` | `builder-io/book-enterprise/index.html` |
| `/privacy-policy` | `builder-io/privacy-policy/index.html` |
| `/terms-of-service` | `builder-io/terms-of-service/index.html` |

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Regenerating pages

After updating HTML in `builder-io`, regenerate React page modules:

```bash
npm run convert
npm run patch-css
```

## Missing images

The HTTrack scrape only included SVGs. Raster images (PNG/JPG) are downloaded from the live site:

```bash
npm run assets
npm run patch-css
```

`patch-css` rewrites Oxygen CSS background URLs to use local `/wp-content/` paths instead of `https://effi.com.au/`.

## Project structure

- `scripts/convert-pages.mjs` — converts builder-io HTML into `src/generated/`
- `src/components/HtmlPage.jsx` — renders page HTML, loads styles/scripts, handles SPA navigation
- `public/wp-content/` and `public/wp-includes/` — static assets from the scrape
