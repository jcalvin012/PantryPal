const app = document.querySelector('#app')

function enhanceHome() {
  if (!app || !app.querySelector('.dashboard-hero')) return
  if (app.querySelector('.dashboard-quick-actions')) return

  const hero = app.querySelector('.dashboard-hero')
  const actions = document.createElement('section')
  actions.className = 'dashboard-quick-actions'
  actions.setAttribute('aria-label', 'Quick actions')
  actions.innerHTML = `
    <button class="dashboard-action dashboard-action-primary" data-action="add">
      <span class="dashboard-action-icon">＋</span>
      <span><strong>Add Food</strong><small>Track something new</small></span>
    </button>
    <button class="dashboard-action" data-screen="pantry">
      <span class="dashboard-action-icon">✓</span>
      <span><strong>Use Something First</strong><small>Check what needs attention</small></span>
    </button>
    <button class="dashboard-action" data-screen="meals">
      <span class="dashboard-action-icon">🍳</span>
      <span><strong>Plan a Meal</strong><small>See what you can make</small></span>
    </button>
    <button class="dashboard-action" data-screen="grocery">
      <span class="dashboard-action-icon">🛒</span>
      <span><strong>Grocery List</strong><small>Review what to buy</small></span>
    </button>`
  hero.insertAdjacentElement('afterend', actions)

  const stats = app.querySelectorAll('.dashboard-stats .card')
  stats.forEach((card, index) => {
    card.classList.add('dashboard-stat-card')
    card.dataset.dashboardStat = ['total', 'expiring', 'expired'][index] || 'other'
    const labels = ['In your pantry', 'Need attention', 'Past their date']
    const label = card.querySelector('.stat-label')
    if (label && labels[index]) label.textContent = labels[index]
  })

  const sections = app.querySelectorAll('.section')
  sections.forEach((section) => {
    const heading = section.querySelector('h2')?.textContent?.trim()
    if (heading === 'Use These First') section.classList.add('dashboard-priority')
    if (heading === 'What Can I Make?') section.classList.add('dashboard-meals')
  })
}

const observer = new MutationObserver(() => enhanceHome())
observer.observe(app, { childList: true, subtree: true })
enhanceHome()
