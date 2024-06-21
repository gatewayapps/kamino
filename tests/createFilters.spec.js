const createFilters = require('../lib/createFilters')

describe('createFilter', () => {
  it('adds a new filter to the list that does not exist', () => {
    const newFilter = {
      filter: 'test-filter',
      organization: 'gatewayapps',
      currentRepo: 'kamino',
    }

    const existingFilters = {
      filters: [
        {
          filter: 'another-filter',
          organization: 'another-org',
          currentRepo: 'another-repo',
        },
      ],
    }

    const {changed, filters} = createFilters(newFilter, existingFilters)
    expect(filters).toHaveLength(2)
    expect(changed).toBeTruthy()
    expect(filters[1].filter).toEqual('test-filter')
  })

  it('updates a filter that already exists', () => {
    const newFilter = {
      filter: 'test-filter',
      organization: 'gatewayapps',
      currentRepo: 'kamino',
    }

    const existingFilters = {
      filters: [
        {
          filter: 'another-filter',
          organization: 'gatewayapps',
          currentRepo: 'kamino',
        },
      ],
    }

    const {changed, filters} = createFilters(newFilter, existingFilters)
    expect(filters).toHaveLength(1)
    expect(changed).toBeTruthy()
    expect(filters[0].filter).toEqual('test-filter')
  })

  it('adds an already existing filter', () => {
    const newFilter = {
      filter: 'test-filter',
      organization: 'gatewayapps',
      currentRepo: 'kamino',
    }

    const existingFilters = {
      filters: [
        {
          filter: 'test-filter',
          organization: 'gatewayapps',
          currentRepo: 'kamino',
        },
      ],
    }

    const {changed, filters} = createFilters(newFilter, existingFilters)
    expect(filters).toHaveLength(1)
    expect(changed).toEqual(false)
    expect(filters[0].filter).toEqual('test-filter')
  })
})
