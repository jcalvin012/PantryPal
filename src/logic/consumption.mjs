export function calculateRemainingQuantity(current, consumed) {
  const available = Number(current)
  const amount = Number(consumed)
  if (!Number.isFinite(available) || available < 0) throw new Error('Invalid current quantity')
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Consumption must be positive')
  if (amount > available) throw new Error('Consumption exceeds available quantity')
  return Number((available - amount).toFixed(4))
}

export function buildConsumptionLog(item, amount, source = 'manual') {
  const remaining = calculateRemainingQuantity(item.quantity, amount)
  return {
    item_name: item.name,
    quantity: amount,
    unit: item.unit,
    pantry_item_id: item.id,
    source,
    remaining,
  }
}
