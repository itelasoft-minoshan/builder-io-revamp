import { filterScripts } from './scriptFilter'

/**
 * Browsers do not execute (and may render as text) <script> tags inserted via innerHTML.
 * Extract scripts and stylesheets from HTML first, inject markup, then load assets manually.
 */
export function extractScriptsFromHtml(html) {
  const scripts = []
  const stylesheets = []

  let htmlWithoutScripts = html.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (_, attrs, content) => {
      const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i)
      const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i)
      scripts.push({
        src: srcMatch ? decodeHtmlEntities(srcMatch[1]) : null,
        content: srcMatch ? '' : content,
        type: typeMatch ? typeMatch[1] : '',
        async: /\basync\b/i.test(attrs),
      })
      return ''
    },
  )

  htmlWithoutScripts = htmlWithoutScripts.replace(
    /<link\b([^>]*rel=["']stylesheet["'][^>]*)>/gi,
    (match) => {
      const hrefMatch = match.match(/\bhref=["']([^"']+)["']/i)
      if (hrefMatch) {
        stylesheets.push(decodeHtmlEntities(hrefMatch[1]))
      }
      return ''
    },
  )

  return { html: htmlWithoutScripts, scripts, stylesheets }
}

function decodeHtmlEntities(value) {
  return value.replace(/&amp;/g, '&')
}

function appendScript({ src, content, async }) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    if (src) {
      script.src = src
      if (async) script.async = true
      script.onload = () => resolve()
      script.onerror = reject
    } else {
      script.textContent = content
      resolve()
    }
    document.body.appendChild(script)
  })
}

export async function runExtractedScripts(scripts, { loadedScripts = new Set() } = {}) {
  const runnable = filterScripts(scripts)

  for (const script of runnable) {
    if (script.src) {
      if (loadedScripts.has(script.src)) continue
      try {
        await appendScript(script)
        loadedScripts.add(script.src)
      } catch (error) {
        console.warn('Failed to load script:', script.src, error)
      }
      continue
    }

    if (!script.content?.trim()) continue
    try {
      await appendScript(script)
    } catch (error) {
      console.warn('Failed to run inline script', error)
    }
  }
}
