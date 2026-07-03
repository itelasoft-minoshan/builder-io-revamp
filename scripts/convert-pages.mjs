import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOURCE = path.resolve(ROOT, '..', 'builder-io')
const OUT_DIR = path.resolve(ROOT, 'src', 'generated')

const PAGES = [
  { route: '/', file: 'index.html' },
  { route: '/automations', file: 'automations/index.html' },
  { route: '/enterprise', file: 'enterprise/index.html' },
  { route: '/pricing', file: 'pricing/index.html' },
  { route: '/company', file: 'company/index.html' },
  { route: '/get-started', file: 'get-started/index.html' },
  { route: '/book-professional', file: 'book-professional/index.html' },
  { route: '/book-enterprise', file: 'book-enterprise/index.html' },
  { route: '/privacy-policy', file: 'privacy-policy/index.html' },
  { route: '/terms-of-service', file: 'terms-of-service/index.html' },
]

const ROUTE_MAP = {
  'index.html': '/',
  '../index.html': '/',
  'automations/index.html': '/automations',
  '../automations/index.html': '/automations',
  'enterprise/index.html': '/enterprise',
  '../enterprise/index.html': '/enterprise',
  'pricing/index.html': '/pricing',
  '../pricing/index.html': '/pricing',
  'company/index.html': '/company',
  '../company/index.html': '/company',
  'get-started/index.html': '/get-started',
  '../get-started/index.html': '/get-started',
  'book-professional/index.html': '/book-professional',
  '../book-professional/index.html': '/book-professional',
  'book-enterprise/index.html': '/book-enterprise',
  '../book-enterprise/index.html': '/book-enterprise',
  'privacy-policy/index.html': '/privacy-policy',
  '../privacy-policy/index.html': '/privacy-policy',
  'terms-of-service/index.html': '/terms-of-service',
  '../terms-of-service/index.html': '/terms-of-service',
}

function normalizePaths(html) {
  let result = html

  // Relative asset paths -> absolute public paths
  result = result.replace(/(?:\.\.\/)+wp-content\//g, '/wp-content/')
  result = result.replace(/(?:\.\.\/)+wp-includes\//g, '/wp-includes/')
  result = result.replace(/href=["'](?:\.\.\/)*wp-content\//g, 'href="/wp-content/')
  result = result.replace(/href=["'](?:\.\.\/)*wp-includes\//g, 'href="/wp-includes/')
  result = result.replace(/src=["'](?:\.\.\/)*wp-content\//g, 'src="/wp-content/')
  result = result.replace(/src=["'](?:\.\.\/)*wp-includes\//g, 'src="/wp-includes/')

  // Fix mixed quotes introduced by earlier replacements
  result = result.replace(/src='(\/wp-[^"']+)"(\s)/g, 'src="$1"$2')
  result = result.replace(/href='(\/wp-[^"']+)"(\s)/g, 'href="$1"$2')

  // Internal page links -> React Router paths
  for (const [oldHref, route] of Object.entries(ROUTE_MAP)) {
    const patterns = [
      new RegExp(`href=["']${oldHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g'),
      new RegExp(`href=["']\\.\\./${oldHref.replace(/^\.\.\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g'),
    ]
    for (const pattern of patterns) {
      result = result.replace(pattern, `href="${route}"`)
    }
  }

  // Catch remaining ../section/index.html patterns
  result = result.replace(
    /href=["'](?:\.\.\/)+([a-z-]+)\/index\.html["']/g,
    (_, segment) => `href="/${segment}"`,
  )
  result = result.replace(/href=["']index\.html["']/g, 'href="/"')

  return result
}

function extractTitle(headHtml) {
  const match = headHtml.match(/<title>([^<]*)<\/title>/i)
  return match ? match[1] : 'Effi'
}

function extractBodyClass(bodyOpenTag) {
  const match = bodyOpenTag.match(/<body[^>]*class=["']([^"']*)["']/i)
  return match ? match[1] : 'oxygen-body'
}

function extractHeadAssets(headHtml) {
  const assets = { styles: [], scripts: [], inlineStyles: [], inlineScripts: [] }

  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi
  let m
  while ((m = linkRegex.exec(headHtml)) !== null) {
    const tag = m[0]
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i)
    if (hrefMatch) {
      let href = hrefMatch[1].replace(/&amp;/g, '&')
      if (!href.startsWith('http') && !href.startsWith('//')) {
        href = href.replace(/^(?:\.\.\/)+/, '/').replace(/^wp-content/, '/wp-content').replace(/^wp-includes/, '/wp-includes')
        if (!href.startsWith('/')) href = `/${href}`
      }
      assets.styles.push(href)
    }
  }

  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  while ((m = styleRegex.exec(headHtml)) !== null) {
    assets.inlineStyles.push(m[1])
  }

  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi
  while ((m = scriptRegex.exec(headHtml)) !== null) {
    const attrs = m[1]
    const content = m[2]
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i)
    if (srcMatch) {
      let src = srcMatch[1]
      if (!src.startsWith('http') && !src.startsWith('//')) {
        src = src.replace(/^(?:\.\.\/)+/, '/').replace(/^wp-content/, '/wp-content').replace(/^wp-includes/, '/wp-includes')
        if (!src.startsWith('/')) src = `/${src}`
      }
      assets.scripts.push({ src, async: /async/i.test(attrs) })
    } else if (content.trim()) {
      assets.inlineScripts.push(content)
    }
  }

  return assets
}

function extractBodyContent(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (!bodyMatch) return { bodyClass: 'oxygen-body', bodyHtml: '' }

  const bodyOpenMatch = html.match(/<body[^>]*>/i)
  const bodyClass = extractBodyClass(bodyOpenMatch[0])
  let bodyHtml = bodyMatch[1]

  // Remove HTTrack mirror comment at end
  bodyHtml = bodyHtml.replace(/<!--\s*Mirrored from[\s\S]*$/i, '').trim()

  return { bodyClass, bodyHtml: normalizePaths(bodyHtml) }
}

function routeToId(route) {
  if (route === '/') return 'home'
  return route
    .slice(1)
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function escapeForTemplate(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}

function convertPage({ route, file }) {
  const filePath = path.join(SOURCE, file)
  const html = fs.readFileSync(filePath, 'utf-8')

  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const headHtml = headMatch ? headMatch[1] : ''
  const title = extractTitle(headHtml)
  const headAssets = extractHeadAssets(headHtml)
  const { bodyClass, bodyHtml } = extractBodyContent(html)

  // Normalize head asset paths
  headAssets.styles = headAssets.styles.map((s) =>
    s.replace(/^(?:\.\.\/)+/, '/').replace(/^wp-content/, '/wp-content').replace(/^wp-includes/, '/wp-includes'),
  )

  return {
    id: routeToId(route),
    route,
    title,
    bodyClass,
    bodyHtml,
    headAssets,
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true })

// Remove stale generated page files before writing new ones
for (const file of fs.readdirSync(OUT_DIR)) {
  if (file.endsWith('.js') && file !== 'index.js' && file !== 'routes.js') {
    fs.unlinkSync(path.join(OUT_DIR, file))
  }
}

const pages = PAGES.map(convertPage)

const routesFile = `// Auto-generated by scripts/convert-pages.mjs — do not edit manually
export const routes = ${JSON.stringify(
  pages.map((p) => ({ path: p.route, id: p.id })),
  null,
  2,
)}
`

fs.writeFileSync(path.join(OUT_DIR, 'routes.js'), routesFile)

for (const page of pages) {
  const pageFile = `// Auto-generated from builder-io/${PAGES.find((p) => p.route === page.route).file}
export const meta = ${JSON.stringify(
    { route: page.route, title: page.title, bodyClass: page.bodyClass, headAssets: page.headAssets },
    null,
    2,
  )}

export const bodyHtml = \`${escapeForTemplate(page.bodyHtml)}\`
`
  fs.writeFileSync(path.join(OUT_DIR, `${page.id}.js`), pageFile)
}

const indexFile = `// Auto-generated page registry
${pages.map((p) => `import * as ${p.id} from './${p.id}.js'`).join('\n')}

export const pages = {
${pages.map((p) => `  '${p.route}': ${p.id},`).join('\n')}
}

export { routes } from './routes.js'
`

fs.writeFileSync(path.join(OUT_DIR, 'index.js'), indexFile)

console.log(`Converted ${pages.length} pages to ${OUT_DIR}`)
