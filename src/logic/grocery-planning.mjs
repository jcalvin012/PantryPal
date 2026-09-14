export const GROCERY_FREQUENCIES = [
  { value: 'daily', label: 'Daily', days: 1 },
  { value: 'every-3-days', label: 'Every 3 days', days: 3 },
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'every-2-weeks', label: 'Every 2 weeks', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
]

export const SHOPPING_SECTIONS = [
  { key: 'produce', label: 'Produce', icon: '🥬' },
  { key: 'meat', label: 'Meat & Poultry', icon: '🥩' },
  { key: 'seafood', label: 'Seafood', icon: '🐟' },
  { key: 'dairy-eggs', label: 'Dairy & Eggs', icon: '🥛' },
  { key: 'bakery', label: 'Bakery', icon: '🍞' },
  { key: 'grains-pasta', label: 'Rice, Grains & Pasta', icon: '🍚' },
  { key: 'canned-packaged', label: 'Canned & Packaged', icon: '🥫' },
  { key: 'condiments', label: 'Condiments & Cooking', icon: '🧂' },
  { key: 'beverages', label: 'Beverages', icon: '🥤' },
  { key: 'snacks', label: 'Snacks', icon: '🍪' },
  { key: 'frozen', label: 'Frozen', icon: '🧊' },
  { key: 'household', label: 'Household & Personal Care', icon: '🧴' },
  { key: 'other', label: 'Other', icon: '🛍️' },
]

const normalize = (value) => String(value || '').trim().toLowerCase()

const SECTION_KEYWORDS = [
  ['produce', ['banana', 'apple', 'orange', 'mango', 'tomato', 'potato', 'onion', 'garlic', 'lettuce', 'cabbage', 'carrot', 'spinach', 'vegetable', 'fruit', 'lemon', 'calamansi', 'ginger', 'pepper']],
  ['meat', ['chicken', 'beef', 'pork', 'turkey', 'meat', 'sausage', 'bacon', 'ham']],
  ['seafood', ['fish', 'salmon', 'tuna', 'tilapia', 'bangus', 'shrimp', 'prawn', 'squid', 'seafood', 'crab', 'mussel']],
  ['dairy-eggs', ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'margarine']],
  ['bakery', ['bread', 'bun', 'roll', 'croissant', 'pastry', 'cake', 'donut', 'biscuit']],
  ['grains-pasta', ['rice', 'pasta', 'noodle', 'spaghetti', 'macaroni', 'flour', 'oat', 'cereal', 'grain', 'cornmeal']],
  ['canned-packaged', ['canned', 'can ', 'tuna can', 'sardines', 'corned beef', 'instant noodle', 'packaged', 'packet', 'pack ']],
  ['condiments', ['soy sauce', 'vinegar', 'ketchup', 'mayonnaise', 'mustard', 'sauce', 'oil', 'salt', 'sugar', 'pepper', 'spice', 'seasoning']],
  ['beverages', ['water', 'juice', 'coffee', 'tea', 'soda', 'soft drink', 'drink', 'cola', 'milk tea']],
  ['snacks', ['chips', 'cracker', 'cookie', 'chocolate', 'candy', 'snack', 'popcorn', 'nuts']],
  ['frozen', ['frozen', 'ice cream', 'icecream']],
  ['household', ['detergent', 'dishwashing', 'dish soap', 'laundry', 'tissue', 'toilet paper', 'paper towel', 'cleaner', 'bleach', 'shampoo', 'soap', 'toothpaste', 'toiletries', 'trash bag', 'sponge']],
]

export function getGroceryFrequency(value = 'weekly') {
  return GROCERY_FREQUENCIES.find((frequency) => frequency.value === value) || GROCERY_FREQUENCIES.find((frequency) => frequency.value === 'weekly')
}

export function inferShoppingSection(item = {}) {
  const text = normalize(`${item.item_name || item.name || ''} ${item.category || ''}`)
  if (normalize(item.shopping_section)) return normalize(item.shopping_section)
  for (const [key, keywords] of SECTION_KEYWORDS) {
    if (keywords.some((keyword) => text.includes(keyword))) return key
  }
  return 'other'
}

export function sortGroceriesForShopping(items = []) {
  const sectionOrder = new Map(SHOPPING_SECTIONS.map((section, index) => [section.key, index]))
  return [...items].sort((a, b) => {
    const sectionA = inferShoppingSection(a)
    const sectionB = inferShoppingSection(b)
    const orderA = sectionOrder.get(sectionA) ?? sectionOrder.size
    const orderB = sectionOrder.get(sectionB) ?? sectionOrder.size
    if (orderA !== orderB) return orderA - orderB
    return normalize(a.item_name || a.name).localeCompare(normalize(b.item_name || b.name))
  })
}

export function groupGroceriesForShopping(items = []) {
  const sorted = sortGroceriesForShopping(items)
  return SHOPPING_SECTIONS.map((section) => ({
    ...section,
    items: sorted.filter((item) => inferShoppingSection(item) === section.key),
  })).filter((section) => section.items.length)
}

export function getGroceryPlanningDays(value) {
  return getGroceryFrequency(value).days
}
