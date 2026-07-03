import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { extractScriptsFromHtml, runExtractedScripts } from '../utils/executeScripts'
import { initEffiInteractions, destroyEffiInteractions } from '../utils/effiInteractions'
import { shouldRunScript } from '../utils/scriptFilter'

const LOADED_STYLES = new Set()
const LOADED_SCRIPTS = new Set()

function normalizeAssetUrl(href) {
  return href.replace(/&amp;/g, '&')
}

function loadStylesheet(href) {
  const normalized = normalizeAssetUrl(href)
  if (LOADED_STYLES.has(normalized)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = normalized
    link.onload = () => {
      LOADED_STYLES.add(normalized)
      resolve()
    }
    link.onerror = reject
    document.head.appendChild(link)
  })
}

function loadScript({ src, async }) {
  const normalized = normalizeAssetUrl(src)
  if (LOADED_SCRIPTS.has(normalized)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = normalized
    if (async) script.async = true
    script.onload = () => {
      LOADED_SCRIPTS.add(normalized)
      resolve()
    }
    script.onerror = reject
    document.body.appendChild(script)
  })
}

export function HtmlPage({ page }) {
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const { meta, bodyHtml } = page

  const handleClick = useCallback(
    (event) => {
      const anchor = event.target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      if (href.startsWith('/') && !anchor.target) {
        event.preventDefault()
        navigate(href)
        window.scrollTo(0, 0)
      }
    },
    [navigate],
  )

  useEffect(() => {
    document.body.className = meta.bodyClass

    const headAssets = meta.headAssets || {}
    const headStyles = (headAssets.styles || []).map(normalizeAssetUrl)
    const headScripts = (headAssets.scripts || []).filter(shouldRunScript)

    Promise.resolve()
      .then(() => Promise.all(headStyles.map(loadStylesheet)))
      .then(() => Promise.all(headScripts.map(loadScript)))
      .catch(console.error)

    return () => {
      document.body.className = ''
    }
  }, [meta.bodyClass, meta.headAssets])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false

    async function renderPage() {
      destroyEffiInteractions(container)

      const { html, scripts, stylesheets } = extractScriptsFromHtml(bodyHtml)

      await Promise.all(stylesheets.map(loadStylesheet))
      if (cancelled) return

      container.innerHTML = html

      await runExtractedScripts(scripts, { loadedScripts: LOADED_SCRIPTS })
      if (cancelled) return

      initEffiInteractions(container)
    }

    renderPage().catch(console.error)

    return () => {
      cancelled = true
      destroyEffiInteractions(container)
    }
  }, [bodyHtml])

  const inlineStyles = (meta.headAssets?.inlineStyles || []).join('\n')

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        {inlineStyles ? <style>{inlineStyles}</style> : null}
      </Helmet>
      <div ref={containerRef} onClick={handleClick} />
    </>
  )
}
