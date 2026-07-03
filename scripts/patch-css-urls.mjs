import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_WP = path.resolve(__dirname, '..', 'public', 'wp-content')

function patchFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf-8')
  const updated = original
    .replace(/https:\/\/effi\.com\.au\/wp-content\//g, '/wp-content/')
    .replace(/url\(\.\.\/\.\.\/20/g, 'url(/wp-content/uploads/20')

  if (updated !== original) {
    fs.writeFileSync(filePath, updated)
    console.log(`patched ${path.relative(PUBLIC_WP, filePath)}`)
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.css')) patchFile(full)
  }
}

walk(PUBLIC_WP)
console.log('CSS URL patch complete')
