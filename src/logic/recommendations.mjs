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

export function buildGrocerySuggestions(pantryItems, recipes) {
  const available = new Set(pantryItems.filter((item) => Number(item.quantity) > 0 && !item.is_consumed).map((item) => normalize(item.name)))
  const counts = new Map()
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients || []) {
      const key = normalize(ingredient.ingredient_name)
      if (!available.has(key)) {
        const entry = counts.get(key) || { frequency: 0, units: new Map() }
        entry.frequency += 1
        const unit = String(ingredient.unit || '').trim()
        if (unit) entry.units.set(unit, (entry.units.get(unit) || 0) + 1)
        counts.set(key, entry)
      }
    }
  }
  return [...counts.entries()].sort((a, b) => b[1].frequency - a[1].frequency || a[0].localeCompare(b[0])).map(([item_name, entry]) => {
    const unit = [...entry.units.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'pcs'
    return {
      item_name,
      quantity: 1,
      unit,
      reason: `Needed for ${entry.frequency} meal${entry.frequency === 1 ? '' : 's'}`,
      priority: Math.min(100, 40 + entry.frequency * 15),
      source: 'recipe',
    }
  })
}
