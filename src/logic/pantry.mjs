const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

export function validatePantryItem(input) {
  const name = String(input?.name || '').trim()
  const quantity = Number(input?.quantity)
  const unit = String(input?.unit || 'pcs').trim() || 'pcs'
  if (!name) throw new Error('Pantry item name is required')
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Pantry item quantity must be positive')
  if (input?.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.expiry_date)) throw new Error('Invalid expiry date')
  return { name, quantity, unit }
}

function pantryIdentity(item) {
  return [
    normalize(item?.name),
    normalize(item?.unit || 'pcs'),
    normalize(item?.location || 'Pantry'),
    normalize(item?.condition || 'Fresh'),
    normalize(item?.category || 'Other'),
    String(item?.expiry_date || ''),
  ].join('::')
}

export function findMatchingPantryItem(items = [], candidate = {}) {
  const key = pantryIdentity(candidate)
  return items.find((item) => pantryIdentity(item) === key) || null
}

export function mergeSamePantryItems(items = []) {
  const merged = []
  const index = new Map()
  for (const item of items) {
    if (!String(item?.name || '').trim()) continue
    const key = pantryIdentity(item)
    const existingIndex = index.get(key)
    if (existingIndex == null) {
      merged.push({ ...item, quantity: Number(item.quantity) || 0 })
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
