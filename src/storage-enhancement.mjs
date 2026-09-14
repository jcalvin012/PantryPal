import { buildSmartStorageDefaults, inferFoodCondition } from './logic/storage-intelligence.mjs'

const today = () => new Date().toISOString().slice(0, 10)

function getForm() { return document.querySelector('#pantry-form') }
function field(form, name) { return form?.querySelector(`[name="${name}"]`) }
function setSelect(form, name, value) {
  const input = field(form, name)
  if (!input || !value) return
  const option = [...input.options].find((item) => item.value === value)
  if (option) input.value = value
}

function applySuggestions(form, { forceLocation = false, forceExpiry = false } = {}) {
  const name = field(form, 'name')?.value.trim()
  if (!name) return

  const condition = inferFoodCondition(field(form, 'condition')?.value || 'Fresh')
  const purchaseDate = field(form, 'purchase_date')?.value || today()
  const currentLocation = field(form, 'location')?.value || 'Pantry'
  const expiryInput = field(form, 'expiry_date')
  const defaults = buildSmartStorageDefaults({ name, condition, category: field(form, 'category')?.value || 'Other', purchaseDate, today: today() })

  const locationLocked = form.dataset.locationLocked === 'true'
  const expiryLocked = form.dataset.expiryLocked === 'true'
  let autoEstimated = expiryInput?.dataset.autoEstimated === 'true'

  // When editing an existing item, an automatically generated expiry is already
  // persisted in the database. Re-identify it as auto-generated if it still
  // matches the current storage rule so condition/location changes can recalculate it.
  if (!expiryLocked && expiryInput?.value && !autoEstimated && defaults.expiryDate === expiryInput.value) {
    expiryInput.dataset.autoEstimated = 'true'
    autoEstimated = true
  }

  if ((forceLocation || !locationLocked) && defaults.location && (currentLocation === 'Pantry' || forceLocation)) {
    setSelect(form, 'location', defaults.location)
  }

  if (!expiryLocked && expiryInput && defaults.expiryDate && (!expiryInput.value || forceExpiry || autoEstimated)) {
    expiryInput.value = defaults.expiryDate
    expiryInput.dataset.autoEstimated = 'true'
  }

  const hint = form.querySelector('[data-storage-intelligence]')
  if (hint) {
    const parts = []
    if (defaults.location) parts.push(`Suggested location: ${defaults.location}`)
    if (defaults.expiryDate) parts.push(`Estimated date: ${defaults.expiryDate}`)
    hint.textContent = parts.length ? `💡 ${parts.join(' · ')}. ${defaults.expiryReason}` : `💡 ${defaults.locationReason}`
  }
}

function enhanceForm(form) {
  if (!form || form.dataset.storageEnhanced === 'true') return
  form.dataset.storageEnhanced = 'true'

  const name = field(form, 'name')
  const category = field(form, 'category')
  const conditionField = document.createElement('div')
  conditionField.className = 'field'
  conditionField.innerHTML = `<label for="pantry-condition">Condition</label><select id="pantry-condition" name="condition"><option value="Fresh">Fresh</option><option value="Frozen">Frozen</option><option value="Cooked">Cooked</option><option value="Packaged">Packaged</option></select>`

  const grid = form.querySelector('.form-grid')
  const categoryField = category?.closest('.field')
  if (grid && categoryField) grid.insertBefore(conditionField, categoryField.nextSibling)

  const currentLocation = field(form, 'location')?.value || 'Pantry'
  field(form, 'condition').value = inferFoodCondition(currentLocation === 'Freezer' ? 'Frozen' : 'Fresh')

  const hint = document.createElement('div')
  hint.className = 'storage-intelligence-hint full'
  hint.dataset.storageIntelligence = 'true'
  grid?.appendChild(hint)

  field(form, 'location')?.addEventListener('change', () => {
    form.dataset.locationLocked = 'true'
    applySuggestions(form, { forceExpiry: field(form, 'expiry_date')?.dataset.autoEstimated === 'true' })
  })
  field(form, 'expiry_date')?.addEventListener('change', () => { form.dataset.expiryLocked = 'true'; field(form, 'expiry_date').dataset.autoEstimated = 'false' })
  field(form, 'condition')?.addEventListener('change', () => applySuggestions(form, { forceLocation: true, forceExpiry: field(form, 'expiry_date')?.dataset.autoEstimated === 'true' }))
  name?.addEventListener('input', () => applySuggestions(form, { forceExpiry: field(form, 'expiry_date')?.dataset.autoEstimated === 'true' }))
  field(form, 'purchase_date')?.addEventListener('change', () => applySuggestions(form, { forceExpiry: field(form, 'expiry_date')?.dataset.autoEstimated === 'true' }))

  applySuggestions(form)
}

const observer = new MutationObserver(() => {
  const form = getForm()
  if (form) enhanceForm(form)
})
observer.observe(document.body, { childList: true, subtree: true })

document.addEventListener('submit', (event) => {
  const form = event.target.closest('#pantry-form')
  if (!form) return
  if (!field(form, 'expiry_date')?.value) applySuggestions(form)
}, true)
