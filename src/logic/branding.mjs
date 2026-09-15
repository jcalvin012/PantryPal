export const PRODUCT_NAME = 'Nouri'
export const PRODUCT_TAGLINE = 'Eat smarter. Waste less.'
export const LEGACY_PRODUCT_NAME = 'PantryPal'
export const PRODUCT_THEME_COLOR = '#24513b'

export function brandText(value) {
  return String(value ?? '').replaceAll(LEGACY_PRODUCT_NAME, PRODUCT_NAME)
}

export function getBrandingAttributes() {
  return {
    name: PRODUCT_NAME,
    tagline: PRODUCT_TAGLINE,
    themeColor: PRODUCT_THEME_COLOR,
  }
}

export function applyBranding(root = document) {
  const title = root.querySelector?.('title')
  if (title) title.textContent = PRODUCT_NAME
  if (root.documentElement) root.documentElement.style.setProperty('--product-theme-color', PRODUCT_THEME_COLOR)
  if (root.querySelectorAll) {
    root.querySelectorAll('*').forEach((node) => {
      if (node.children.length === 0 && node.textContent.includes(LEGACY_PRODUCT_NAME)) node.textContent = brandText(node.textContent)
    })
  }
}

if (typeof document !== 'undefined') {
  applyBranding(document)
  const observer = new MutationObserver(() => applyBranding(document))
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
}
