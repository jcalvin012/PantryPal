const normalize = (value) => String(value || '').trim().toLowerCase()

export function calculateRecipeRequirements(recipe, pantryItems, householdSize = 1) {
  const servings = Math.max(1, Number(recipe.servings) || 1)
  const people = Math.max(1, Number(householdSize) || 1)
  const scale = people / servings
  const ingredients = (recipe.ingredients || []).map((ingredient) => {
    const needed = Number(ingredient.quantity) > 0 ? Number(ingredient.quantity) * scale : null
    const matches = pantryItems.filter((item) => normalize(item.name) === normalize(ingredient.ingredient_name))
    const onHand = matches.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    const shortage = needed == null ? null : Math.max(0, needed - onHand)
    return { ...ingredient, needed, onHand, shortage, enough: needed == null ? onHand > 0 : onHand >= needed }
  })
  return { ...recipe, householdSize: people, ingredients }
}

export function buildMealPlan(recipes, pantryItems, settings) {
  const householdSize = Math.max(1, Number(settings?.householdSize) || 1)
  const schedule = settings?.schedule || {}
  const slots = [
    ['today', 'breakfast', schedule.today?.breakfast],
    ['today', 'lunch', schedule.today?.lunch],
    ['today', 'dinner', schedule.today?.dinner],
    ['tomorrow', 'breakfast', schedule.tomorrow?.breakfast],
    ['tomorrow', 'lunch', schedule.tomorrow?.lunch],
    ['tomorrow', 'dinner', schedule.tomorrow?.dinner],
  ]
  const ranked = [...recipes].map((recipe) => {
    const ingredients = recipe.ingredients || []
    const matched = ingredients.filter((ingredient) => pantryItems.some((item) => normalize(item.name) === normalize(ingredient.ingredient_name) && Number(item.quantity) > 0))
    const score = ingredients.length ? (matched.length / ingredients.length) * 100 : 0
    return { ...recipe, score }
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  return slots.filter(([, , enabled]) => enabled).map(([day, meal], index) => {
    const selected = ranked[index % ranked.length]
    return selected ? { slot: `${day}-${meal}`, day, meal, recipe: calculateRecipeRequirements(selected, pantryItems, householdSize) } : null
  }).filter(Boolean)
}

export function formatQuantity(value) {
  if (value == null) return ''
  const rounded = Math.round(Number(value) * 100) / 100
  return String(rounded)
}
