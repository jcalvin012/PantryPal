import { getExpiryStatus } from './expiry.mjs'

const normalize = (value) => String(value || '').trim().toLowerCase()

export function rankMeals(pantryItems, recipes, today = new Date().toISOString().slice(0, 10)) {
  const available = new Set(pantryItems.filter((item) => Number(item.quantity) > 0 && !item.is_consumed).map((item) => normalize(item.name)))
  return recipes.map((recipe) => {
    const ingredients = recipe.ingredients || []
    const matched = ingredients.filter((ingredient) => available.has(normalize(ingredient.ingredient_name)))
    const urgentMatches = ingredients.filter((ingredient) => pantryItems.some((item) => normalize(item.name) === normalize(ingredient.ingredient_name) && getExpiryStatus(item.expiry_date, today).tone === 'urgent'))
    const missing = ingredients.filter((ingredient) => !available.has(normalize(ingredient.ingredient_name)))
    const coverage = ingredients.length ? matched.length / ingredients.length : 0
    const score = coverage * 100 + urgentMatches.length * 12 - missing.length * 4
    return { ...recipe, matchedCount: matched.length, missingCount: missing.length, urgentMatches: urgentMatches.length, score }
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
}

export function buildGrocerySuggestions(pantryItems, recipes, settings = {}) {
  const householdSize = Math.max(1, Number(settings?.householdSize) || 1)
  const counts = new Map()
  for (const recipe of recipes) {
    const servings = Math.max(1, Number(recipe.servings) || 1)
    const scale = householdSize / servings
    for (const ingredient of recipe.ingredients || []) {
      const matches = pantryItems.filter((item) => normalize(item.name) === normalize(ingredient.ingredient_name) && Number(item.quantity) > 0 && !item.is_consumed)
      const onHand = matches.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      const needed = Number(ingredient.quantity) > 0 ? Number(ingredient.quantity) * scale : null
      if (needed != null && onHand >= needed) continue
      const key = normalize(ingredient.ingredient_name)
      const entry = counts.get(key) || { frequency: 0, units: new Map(), shortage: 0, unit: ingredient.unit || 'pcs' }
      entry.frequency += 1
      const unit = String(ingredient.unit || '').trim()
      if (unit) entry.units.set(unit, (entry.units.get(unit) || 0) + 1)
      if (needed != null) entry.shortage += Math.max(0, needed - onHand)
      counts.set(key, entry)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1].frequency - a[1].frequency || a[0].localeCompare(b[0])).map(([item_name, entry]) => {
    const unit = [...entry.units.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || entry.unit || 'pcs'
    const quantity = entry.shortage > 0 ? Math.round(entry.shortage * 100) / 100 : 1
    return {
      item_name,
      quantity,
      unit,
      reason: `Needed for ${entry.frequency} meal${entry.frequency === 1 ? '' : 's'}`,
      priority: Math.min(100, 40 + entry.frequency * 15),
      source: 'recipe',
    }
  })
}
