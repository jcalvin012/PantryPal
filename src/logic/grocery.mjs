export const GROCERY_UNITS = ['pc', 'pcs', 'kg', 'g', 'L', 'mL', 'bottle', 'pack', 'box', 'can', 'dozen']

export function nextGroceryQuantity(item, delta) {
  return Math.max(0, Number(item?.quantity || 0) + Number(delta || 0))
}

export function parseGroceryQuantity(value) {
  if (String(value ?? '').trim() === '') return null
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

export function mergeSameGroceryItems(items = []) {
  const merged = []
  const index = new Map()
  for (const item of items) {
    const name = String(item?.item_name || item?.name || '').trim().toLowerCase().replace(/\s+/g, ' ')
    const unit = groceryUnit(item)
    const key = `${name}::${unit}`
    if (!name) continue
    const existingIndex = index.get(key)
    if (existingIndex == null) {
      merged.push({ ...item, quantity: Number(item.quantity) || 0, unit })
      index.set(key, merged.length - 1)
    } else {
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: Math.round((Number(merged[existingIndex].quantity || 0) + Number(item.quantity || 0)) * 100) / 100,
      }
    }
  }
  return merged
}
