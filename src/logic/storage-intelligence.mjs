const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

const MONTH_MS_APPROX = 30.4375

export const CONDITION_OPTIONS = [
  'Fresh',
  'Frozen',
  'Cooked',
  'Canned',
  'Packaged',
  'Dry / Shelf-Stable',
  'Opened',
  'Other',
]

const STORAGE_RULES = [
  { match: ['chicken breast', 'chicken thigh', 'chicken leg', 'chicken wing', 'chicken'], category: 'Meat', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: 2, frozenMonths: 9, reason: 'Raw poultry should be refrigerated for only 1–2 days; freezing is better for longer storage.' },
  { match: ['turkey breast', 'turkey leg', 'turkey wing', 'turkey'], category: 'Meat', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: 2, frozenMonths: 9, reason: 'Raw poultry should be refrigerated for only 1–2 days; freezing is better for longer storage.' },
  { match: ['ground beef', 'ground pork', 'ground chicken', 'ground turkey', 'ground meat', 'minced beef', 'minced pork', 'minced meat'], category: 'Meat', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: 2, frozenMonths: 4, reason: 'Ground meat and poultry keep only 1–2 days in the refrigerator; freezing extends best quality.' },
  { match: ['beef steak', 'beef roast', 'beef', 'pork chop', 'pork roast', 'pork', 'lamb chop', 'lamb roast', 'lamb'], category: 'Meat', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: 5, frozenMonths: 9, reason: 'Fresh beef, pork and lamb cuts keep about 3–5 days refrigerated; freezing is recommended for longer storage.' },
  { match: ['salmon', 'tuna steak', 'mackerel', 'sardine', 'catfish', 'fatty fish'], category: 'Seafood', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: 2, frozenMonths: 3, reason: 'Raw fish should be refrigerated for only 1–2 days; fatty fish has about 2–3 months of best freezer quality.' },
  { match: ['cod', 'tilapia', 'bangus', 'flounder', 'haddock', 'halibut', 'sole', 'pollock', 'fish'], category: 'Seafood', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: 2, frozenMonths: 6, reason: 'Raw fish should be refrigerated for only 1–2 days; freezer guidance varies by fish type.' },
  { match: ['shrimp', 'prawn', 'crayfish'], category: 'Seafood', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: 5, frozenMonths: 6, reason: 'Fresh shrimp keeps a few days refrigerated; freezing is preferred for longer storage.' },
  { match: ['crab meat', 'lobster', 'shucked clam', 'shucked mussel', 'shucked oyster', 'scallop', 'squid'], category: 'Seafood', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: 3, frozenMonths: 3, reason: 'Fresh shellfish has short refrigerated storage times; freezing provides longer best-quality storage.' },
  { match: ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream'], category: 'Dairy', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: null, frozenMonths: null, reason: 'Dairy products generally require refrigeration; product labeling should determine the date.' },
  { match: ['egg'], category: 'Dairy', freshLocation: 'Fridge', frozenLocation: 'Fridge', freshDays: null, frozenMonths: null, reason: 'Eggs should be refrigerated; do not freeze eggs in their shells.' },
  { match: ['canned', 'can of'], category: 'Canned', freshLocation: 'Pantry', frozenLocation: 'Pantry', freshDays: null, frozenMonths: null, reason: 'Unopened canned foods are shelf-stable; store them in a cool, dry pantry and follow the printed date.' },
  { match: ['crackers', 'biscuits', 'cookies', 'instant noodles'], category: 'Canned', freshLocation: 'Pantry', frozenLocation: 'Pantry', freshDays: null, frozenMonths: null, reason: 'Shelf-stable packaged foods belong in a cool, dry pantry unless the package says otherwise.' },
  { match: ['rice', 'pasta', 'flour', 'oats', 'oat', 'cereal', 'noodle', 'bread'], category: 'Grains', freshLocation: 'Pantry', frozenLocation: 'Pantry', freshDays: null, frozenMonths: null, reason: 'Dry grains and similar shelf-stable foods are normally stored in a cool, dry pantry.' },
  { match: ['apple', 'banana', 'orange', 'mango', 'grape', 'watermelon', 'papaya', 'pineapple', 'avocado', 'lemon', 'lime', 'pear', 'peach', 'strawberry'], category: 'Fruits', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: null, frozenMonths: null, reason: 'Storage varies by fruit; refrigeration is a conservative recommendation for perishables.' },
  { match: ['carrot', 'potato', 'tomato', 'onion', 'garlic', 'lettuce', 'cabbage', 'spinach', 'broccoli', 'cauliflower', 'eggplant', 'okra', 'pepper', 'cucumber', 'squash', 'mushroom', 'bean'], category: 'Vegetables', freshLocation: 'Fridge', frozenLocation: 'Freezer', freshDays: null, frozenMonths: null, reason: 'Most fresh vegetables are best kept refrigerated; storage varies by produce type.' },
]

function findRule(name) {
  const value = normalize(name)
  return STORAGE_RULES.find((rule) => rule.match.some((keyword) => value.includes(keyword))) || null
}

function addMonths(dateValue, months) {
  const date = new Date(`${dateValue}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date')
  const wholeMonths = Math.floor(months)
  const fractionalDays = Math.round((months - wholeMonths) * MONTH_MS_APPROX)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + wholeMonths, date.getUTCDate()))
  target.setUTCDate(target.getUTCDate() + fractionalDays)
  return target.toISOString().slice(0, 10)
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function inferFoodCondition(condition = 'Fresh') {
  const value = normalize(condition)
  return CONDITION_OPTIONS.find((option) => normalize(option) === value) || 'Fresh'
}

export function getStorageRecommendation({ name, condition = 'Fresh', category = 'Other' } = {}) {
  const normalizedCondition = inferFoodCondition(condition)
  const rule = findRule(name)

  if (normalizedCondition === 'Frozen') {
    return { location: rule?.frozenLocation || 'Freezer', reason: rule?.reason || 'The item is frozen; keep it frozen for storage.', matched: Boolean(rule), category: rule?.category || category }
  }

  if (normalizedCondition === 'Cooked') {
    return { location: 'Fridge', reason: 'Cooked leftovers should be refrigerated promptly; freeze if they will not be used within the recommended refrigerator period.', matched: Boolean(rule), category: rule?.category || category }
  }

  if (normalizedCondition === 'Canned') {
    return { location: 'Pantry', reason: 'Unopened canned foods are shelf-stable; store them in a cool, dry pantry and follow the printed date.', matched: Boolean(rule), category: rule?.category || 'Canned' }
  }

  if (normalizedCondition === 'Dry / Shelf-Stable') {
    return { location: 'Pantry', reason: 'Dry and shelf-stable foods are normally stored in a cool, dry pantry.', matched: Boolean(rule), category: rule?.category || category }
  }

  if (normalizedCondition === 'Packaged') {
    return { location: rule?.freshLocation || 'Pantry', reason: rule?.reason || 'Follow the package storage instructions; shelf-stable packaged foods normally belong in the pantry.', matched: Boolean(rule), category: rule?.category || category }
  }

  if (normalizedCondition === 'Opened') {
    return { location: rule?.freshLocation || 'Fridge', reason: rule?.reason || 'Opened foods should follow the package instructions; refrigeration is a conservative recommendation when storage is unclear.', matched: Boolean(rule), category: rule?.category || category }
  }

  return { location: rule?.freshLocation || 'Pantry', reason: rule?.reason || 'Storage location could not be confidently identified; choose the location that matches the package or food type.', matched: Boolean(rule), category: rule?.category || category }
}

export function estimateExpiry({ name, condition = 'Fresh', location = '', purchaseDate, today = new Date().toISOString().slice(0, 10), category = 'Other' } = {}) {
  const normalizedCondition = inferFoodCondition(condition)
  const baseDate = purchaseDate || today
  const rule = findRule(name)
  const targetLocation = normalize(location)

  if (normalizedCondition === 'Canned' || normalizedCondition === 'Packaged' || normalizedCondition === 'Dry / Shelf-Stable' || normalizedCondition === 'Opened' || normalizedCondition === 'Other') {
    return { expiryDate: null, estimated: false, basis: 'Package or food-specific date required', reason: 'Use the package date or food-specific guidance rather than guessing an expiry date.' }
  }

  if (!rule) {
    if (normalizedCondition === 'Cooked') {
      return { expiryDate: addDays(baseDate, 4), estimated: true, basis: 'Refrigerated cooked-food guidance', reason: 'Cooked leftovers are generally recommended for 3–4 days refrigerated.', source: 'USDA/FoodSafety.gov' }
    }
    return { expiryDate: null, estimated: false, basis: 'No matching storage rule', reason: 'PantryPal could not confidently estimate a storage period for this food.' }
  }

  if (normalizedCondition === 'Fresh' && targetLocation === 'fridge' && rule.freshDays) {
    return { expiryDate: addDays(baseDate, rule.freshDays), estimated: true, basis: 'Refrigerated fresh-food guidance', reason: rule.reason, source: 'USDA/FoodSafety.gov' }
  }

  if (normalizedCondition === 'Frozen' && targetLocation === 'freezer' && rule.frozenMonths) {
    return { expiryDate: addMonths(baseDate, rule.frozenMonths), estimated: true, basis: 'Frozen best-quality guidance', reason: rule.reason, source: 'USDA/FoodSafety.gov' }
  }

  if (normalizedCondition === 'Cooked') {
    return { expiryDate: addDays(baseDate, 4), estimated: true, basis: 'Refrigerated cooked-food guidance', reason: 'Cooked meat and poultry leftovers are generally recommended for 3–4 days refrigerated.', source: 'USDA/FoodSafety.gov' }
  }

  return { expiryDate: null, estimated: false, basis: 'Package or food-specific date required', reason: 'Use the package date or food-specific guidance rather than guessing an expiry date.' }
}

export function buildSmartStorageDefaults({ name, condition = 'Fresh', category = 'Other', purchaseDate, today = new Date().toISOString().slice(0, 10) } = {}) {
  const normalizedCondition = inferFoodCondition(condition)
  const storage = getStorageRecommendation({ name, condition: normalizedCondition, category })
  const expiry = estimateExpiry({ name, condition: normalizedCondition, location: storage.location, purchaseDate, today, category })
  return { condition: normalizedCondition, location: storage.location, expiryDate: expiry.expiryDate, locationReason: storage.reason, expiryReason: expiry.reason, expiryEstimated: expiry.estimated, expiryBasis: expiry.basis, source: expiry.source || 'PantryPal food-storage guidance', matched: storage.matched }
}
