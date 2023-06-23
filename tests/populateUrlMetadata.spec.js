const populateUrlMetadata = require('../lib/populateUrlMetadata')

describe('populateUrlMetadata', () => {
  it('takes a url and returns an object populated with all of the metadata necessary for the url', () => {
    const urlMetadata = populateUrlMetadata('https://github.com/gatewayapps/kamino/issues/5')
    expect(urlMetadata.currentRepo).toEqual('kamino')
    expect(urlMetadata.issueNumber).toEqual('5')
    expect(urlMetadata.organization).toEqual('gatewayapps')
    expect(urlMetadata.url).toEqual('https://github.com/gatewayapps/kamino/issues/5')
  })

  it('takes an invalid url and returns an error message', () => {
    const urlMetadata = populateUrlMetadata('https://github.com/gatewayapps/kamino')
    expect(urlMetadata.error).toEqual('Cannot parse this url')
  })
})
