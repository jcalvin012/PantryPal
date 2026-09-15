import { brandText, PRODUCT_NAME } from './logic/branding.mjs'

const BRAND_ATTRIBUTES = ['title', 'aria-label', 'placeholder', 'content']

function applyBranding(root = document.body) {
  if (!root) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)
  for (const node of textNodes) {
    const next = brandText(node.nodeValue)
    if (next !== node.nodeValue) node.nodeValue = next
  }

  root.querySelectorAll?.('*').forEach((element) => {
    for (const attribute of BRAND_ATTRIBUTES) {
      if (!element.hasAttribute(attribute)) continue
      const current = element.getAttribute(attribute)
      const next = brandText(current)
      if (next !== current) element.setAttribute(attribute, next)
    }
  })
}

document.title = PRODUCT_NAME
for (const selector of ['meta[name="apple-mobile-web-app-title"]', 'meta[property="og:site_name"]']) {
  const element = document.querySelector(selector)
  if (element) element.setAttribute('content', PRODUCT_NAME)
}

applyBranding()
const observer = new MutationObserver(() => applyBranding())
observer.observe(document.body, { childList: true, subtree: true, characterData: true })
