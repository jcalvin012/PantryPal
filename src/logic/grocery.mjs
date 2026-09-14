export function nextGroceryQuantity(item, delta) {
  return Math.max(0, Number(item?.quantity || 0) + Number(delta || 0))
}

export function groceryUnit(item) {
  return String(item?.unit || 'pcs').trim() || 'pcs'
}
