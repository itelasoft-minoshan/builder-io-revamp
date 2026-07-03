import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC = path.resolve(__dirname, '..', 'public')
const BASE = 'https://effi.com.au'

const ASSETS = [
  'wp-content/uploads/2022/03/cropped-index-32x32.png',
  'wp-content/uploads/2022/03/cropped-index-192x192.png',
  'wp-content/uploads/2022/03/cropped-index-180x180.png',
  'wp-content/uploads/2022/03/cropped-index-270x270.png',
  'wp-content/uploads/2023/02/shape-08.png',
  'wp-content/uploads/2023/02/shape-14.png',
  'wp-content/uploads/2023/02/shape-38.png',
  'wp-content/uploads/2023/06/Effi-BG-gradient-hero.png',
  'wp-content/uploads/2023/06/Effi-mortgage-broker-dashboard.png',
  'wp-content/uploads/2023/06/Effi-mortgage-broker-lead-generation.png',
  'wp-content/uploads/2024/03/Effi-and-Canstar-integration-mortgage-broker-reviews.jpg',
  'wp-content/uploads/2024/03/Effi-chat-to-leads.jpg',
  'wp-content/uploads/2024/03/Effi-receive-notifications-on-leads.jpg',
  'wp-content/uploads/2024/03/Effi-view-documents-by-lead.jpg',
  'wp-content/uploads/2024/03/Effi-view-progress.jpg',
  'wp-content/uploads/2024/03/view-lead-and-tasks-on-effi.jpg',
  'wp-content/uploads/2024/03/view-lead-details-on-effi.jpg',
  'wp-content/uploads/2024/03/glare-padlock-for-cyber-security-digital-blocking-2.png',
]

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        download(res.headers.location).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

for (const assetPath of ASSETS) {
  const dest = path.join(PUBLIC, assetPath)
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`skip ${assetPath}`)
    continue
  }
  try {
    const data = await download(`${BASE}/${assetPath}`)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, data)
    console.log(`ok ${assetPath} (${data.length} bytes)`)
  } catch (e) {
    console.warn(`fail ${assetPath}: ${e.message}`)
  }
}
