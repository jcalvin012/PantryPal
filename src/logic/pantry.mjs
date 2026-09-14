export function validatePantryItem(input) {
  const name = String(input?.name || '').trim()
  const quantity = Number(input?.quantity)
  const unit = String(input?.unit || 'pcs').trim() || 'pcs'
  if (!name) throw new Error('Pantry item name is required')
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Pantry item quantity must be positive')
  if (input?.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.expiry_date)) throw new Error('Invalid expiry date')
  return { name, quantity, unit }
}
