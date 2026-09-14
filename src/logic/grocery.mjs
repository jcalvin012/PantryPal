export const GROCERY_UNITS = ['pc', 'pcs', 'kg', 'g', 'L', 'mL', 'bottle', 'pack', 'box', 'can', 'dozen']

export function nextGroceryQuantity(item, delta) {
  return Math.max(0, Number(item?.quantity || 0) + Number(delta || 0))
}

export function parseGroceryQuantity(value) {
  const quantity = Number(value)
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : null
}

export function groceryUnit(item) {
  return String(item?.unit || 'pcs').trim() || 'pcs'
}

export function groceryUnitOptions(selected = 'pcs') {
  const value = groceryUnit({ unit: selected })
  return GROCERY_UNITS.includes(value) ? GROCERY_UNITS : [value, ...GROCERY_UNITS]
}
