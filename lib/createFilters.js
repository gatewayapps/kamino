function createFilters(newFilter, item) {
  let exists = false
  let changed = false

  // convert the string to an empty array for existing users
  if (typeof item.filters === 'string') {
    item.filters = []
  }

  item.filters.forEach((filter) => {
    const filterOrigin = filter.githubOrigin || 'https://github.com'
    const newFilterOrigin = newFilter.githubOrigin || 'https://github.com'
    const isMatchingFilter =
      filterOrigin === newFilterOrigin &&
      filter.organization === newFilter.organization &&
      filter.currentRepo === newFilter.currentRepo

    if (!isMatchingFilter) {
      return
    }

    exists = true

    if (filter.filter !== newFilter.filter) {
      changed = true
      filter.filter = newFilter.filter
    }
  })

  if (!exists) {
    changed = true
    item.filters.push(newFilter)
  }

  return { filters: item.filters, changed }
}

if (typeof module !== 'undefined') {
  module.exports = createFilters
}
