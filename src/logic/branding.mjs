export const PRODUCT_NAME = 'Nouri'
export const PRODUCT_TAGLINE = 'Eat smarter. Waste less.'
export const LEGACY_PRODUCT_NAME = 'PantryPal'

export function brandText(value) {
  return String(value ?? '').replaceAll(LEGACY_PRODUCT_NAME, PRODUCT_NAME)
}
