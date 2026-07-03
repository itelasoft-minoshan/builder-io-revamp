import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'builder-io', 'index.html'), 'utf8')
const css = fs.readFileSync(path.join(__dirname, '..', '..', 'builder-io', 'wp-content', 'uploads', 'oxygen', 'css', '101c49b.css'), 'utf8')

const all = html + css
const matches = [...all.matchAll(/wp-content\/uploads\/[A-Za-z0-9_./-]+\.(?:png|jpg|jpeg|webp|gif|svg)/gi)]
const relative = [...all.matchAll(/\.\.\/\.\.\/20\d{2}\/[A-Za-z0-9_./-]+\.(?:png|jpg|jpeg|webp|gif|svg)/gi)]

const unique = new Set(matches.map((m) => m[0].toLowerCase()))
for (const r of relative) {
  const resolved = r[0].replace(/^\.\.\/\.\.\//, 'wp-content/uploads/')
  unique.add(resolved.toLowerCase())
}

;[...unique].sort().forEach((u) => console.log(u))
