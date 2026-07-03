const JQUERY_EXTERNAL_PATTERNS = [
  /jquery/i,
  /unslider/i,
  /jquery\.event/i,
  /power-toggle/i,
  /form-submission/i,
  /interactive-cursor/i,
  /masonry/i,
  /imagesloaded/i,
  /infinite-scroll/i,
]

const EXECUTABLE_SCRIPT_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module'])

function isJQueryInlineScript(content) {
  if (!content?.trim()) return false
  return (
    /\bjQuery\b/.test(content) ||
    /jQuery\(/.test(content) ||
    /\$\(document\)/.test(content) ||
    /\$\(['"]body['"]\)/.test(content) ||
    /\$\(window\)/.test(content) ||
    /\$\(selector\)/.test(content)
  )
}

function isSafeInlineScript(content) {
  if (!content?.trim()) return false
  if (isJQueryInlineScript(content)) return false
  // Fluent form config objects are safe to run
  if (/window\.fluent_form_/.test(content)) return true
  if (/var fluentFormVars/.test(content)) return true
  if (/var fluentform_/.test(content)) return true
  if (/window\.dataLayer/.test(content)) return true
  if (/gtag\(/.test(content)) return true
  return false
}

export function shouldRunScript(script) {
  const type = (script.type || '').toLowerCase().trim()

  if (type && !EXECUTABLE_SCRIPT_TYPES.has(type)) {
    return false
  }

  if (script.src) {
    const src = script.src
    if (JQUERY_EXTERNAL_PATTERNS.some((pattern) => pattern.test(src))) {
      return false
    }
    // Keep AOS, intlTelInput, gtag
    return true
  }

  return isSafeInlineScript(script.content)
}

export function filterScripts(scripts) {
  return scripts.filter(shouldRunScript)
}
