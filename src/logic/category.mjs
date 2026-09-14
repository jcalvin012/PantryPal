const CATEGORY_RULES = [
  ['Meat', ['chicken', 'beef', 'pork', 'lamb', 'goat', 'steak', 'ground meat', 'ground beef', 'ground pork', 'ham', 'bacon', 'sausage', 'hotdog', 'hot dog', 'turkey', 'duck']],
  ['Seafood', ['fish', 'salmon', 'tuna', 'sardine', 'sardines', 'shrimp', 'prawn', 'crab', 'squid', 'mackerel', 'bangus', 'tilapia']],
  ['Dairy', ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'margarine']],
  ['Fruits', ['apple', 'banana', 'orange', 'mango', 'grape', 'watermelon', 'papaya', 'pineapple', 'avocado', 'lemon', 'lime', 'pear', 'peach', 'strawberry', 'melon']],
  ['Vegetables', ['carrot', 'potato', 'tomato', 'onion', 'garlic', 'lettuce', 'cabbage', 'spinach', 'broccoli', 'cauliflower', 'eggplant', 'aubergine', 'okra', 'pepper', 'bell pepper', 'cucumber', 'squash', 'corn', 'mushroom', 'beans']],
  ['Grains & Staples', ['rice', 'pasta', 'noodle', 'noodles', 'bread', 'flour', 'oat', 'oats', 'cereal', 'quinoa', 'cornmeal']],
  ['Canned & Packaged', ['canned', 'can of', 'instant noodles', 'crackers', 'chips', 'biscuits', 'cookies', 'canned goods']],
  ['Condiments & Sauces', ['ketchup', 'mayonnaise', 'mayo', 'mustard', 'soy sauce', 'vinegar', 'sauce', 'salsa', 'hot sauce']],
  ['Beverages', ['water', 'juice', 'coffee', 'tea', 'soda', 'soft drink', 'drink', 'beer']],
  ['Snacks', ['snack', 'chocolate', 'candy', 'popcorn', 'nuts', 'peanuts']],
]

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

export function inferCategory(name, selectedCategory = 'Other') {
  const selected = String(selectedCategory || 'Other').trim() || 'Other'
  if (selected.toLowerCase() !== 'other' && selected.toLowerCase() !== 'others') return selected

  const normalizedName = normalize(name)
  if (!normalizedName) return 'Other'

  for (const [category, keywords] of CATEGORY_RULES) {
    if (keywords.some((keyword) => normalizedName.includes(keyword))) return category
  }

  return 'Other'
}
