import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOURCE = path.resolve(ROOT, '..', 'builder-io')
const PUBLIC = path.resolve(ROOT, 'public')
const BASE_URL = 'https://effi.com.au'

function collectFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectFiles(full, acc)
    else if (/\.(html|css|js)$/i.test(entry.name)) acc.push(full)
  }
  return acc
}

function normalizeAssetUrl(raw) {
  let url = raw.trim().replace(/&amp;/g, '&')
  if (!url || url.startsWith('data:') || url.startsWith('#')) return null

  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (!url.includes('effi.com.au')) return null
    const parsed = new URL(url)
    return parsed.pathname.replace(/^\//, '')
  }

  url = url.replace(/^(\.\.\/)+/, '')
  if (url.startsWith('/')) url = url.slice(1)
  if (!url.startsWith('wp-content/')) return null
  return url.split('?')[0]
}

function extractAssetPaths(content) {
  const paths = new Set()
  const patterns = [
    /(?:src|href)=["']([^"']+\.(?:png|jpg|jpeg|webp|gif|svg))(?:\?[^"']*)?["']/gi,
    /url\((['"]?)([^'")]+)\1\)/gi,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const candidate = pattern === patterns[1] ? match[2] : match[1]
      const normalized = normalizeAssetUrl(candidate)
      if (normalized) paths.add(normalized)
    }
  }

  return paths
}

function download(urlPath, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      resolve('exists')
      return
    }

    const url = `${BASE_URL}/${urlPath}`
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirect = res.headers.location
          if (redirect) {
            https.get(redirect, handle).on('error', reject)
            return
          }
        }
        handle(res)
      })
      .on('error', reject)

    function handle(res) {
      if (res.statusCode !== 200) {
        reject(new Error(`${urlPath} -> HTTP ${res.statusCode}`))
        return
      }
      const file = fs.createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => {
        file.close(() => resolve('downloaded'))
      })
    }
  })
}

const files = [
  path.join(SOURCE, 'index.html'),
  ...collectFiles(path.join(SOURCE, 'automations')),
  ...collectFiles(path.join(SOURCE, 'enterprise')),
  ...collectFiles(path.join(SOURCE, 'pricing')),
  ...collectFiles(path.join(SOURCE, 'company')),
  ...collectFiles(path.join(SOURCE, 'get-started')),
  ...collectFiles(path.join(SOURCE, 'book-professional')),
  ...collectFiles(path.join(SOURCE, 'book-enterprise')),
  ...collectFiles(path.join(SOURCE, 'privacy-policy')),
  ...collectFiles(path.join(SOURCE, 'terms-of-service')),
  ...collectFiles(path.join(SOURCE, 'wp-content')),
]

const assetPaths = new Set()
for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8')
  for (const p of extractAssetPaths(content)) assetPaths.add(p)
}

const sorted = [...assetPaths].sort()
console.log(`Found ${sorted.length} asset paths`)

let downloaded = 0
let failed = 0

for (const assetPath of sorted) {
  const dest = path.join(PUBLIC, assetPath)
  try {
    const result = await download(assetPath, dest)
    if (result === 'downloaded') {
      downloaded++
      console.log(`Downloaded: ${assetPath}`)
    }
  } catch (error) {
    failed++
    console.warn(`Failed: ${assetPath} (${error.message})`)
  }
}

console.log(`Done. Downloaded ${downloaded}, failed ${failed}, skipped ${sorted.length - downloaded - failed}`)
