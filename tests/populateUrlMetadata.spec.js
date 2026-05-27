const populateUrlMetadata = require('../lib/populateUrlMetadata')

describe('populateUrlMetadata', () => {
  it('takes a url and returns an object populated with all of the metadata necessary for the url', () => {
    const urlMetadata = populateUrlMetadata('https://github.com/gatewayapps/kamino/issues/5')
    expect(urlMetadata.currentRepo).toEqual('kamino')
    expect(urlMetadata.githubApiUrl).toEqual('https://api.github.com/')
    expect(urlMetadata.githubOrigin).toEqual('https://github.com')
    expect(urlMetadata.issueNumber).toEqual('5')
    expect(urlMetadata.organization).toEqual('gatewayapps')
    expect(urlMetadata.url).toEqual('https://github.com/gatewayapps/kamino/issues/5')
  })

  it('takes an invalid url and returns an error message', () => {
    const urlMetadata = populateUrlMetadata('https://github.com/gatewayapps/kamino')
    expect(urlMetadata.error).toEqual('Cannot parse this url')
  })

  it('takes a url with querystrings from the issue page and returns all metadata except for the issue number', () => {
    const urlMetadata = populateUrlMetadata('https://github.com/gatewayapps/kamino/issues?q=is%3Aopen+is%3Aissue')
    expect(urlMetadata.currentRepo).toEqual('kamino')
    expect(urlMetadata.issueNumber).toEqual(undefined)
    expect(urlMetadata.organization).toEqual('gatewayapps')
    expect(urlMetadata.url).toEqual('https://github.com/gatewayapps/kamino/issues?q=is%3Aopen+is%3Aissue')
  })

  it('supports github enterprise issue urls', () => {
    const urlMetadata = populateUrlMetadata('https://github.mycompany.com/gatewayapps/kamino/issues/5')
    expect(urlMetadata.currentRepo).toEqual('kamino')
    expect(urlMetadata.githubApiUrl).toEqual('https://github.mycompany.com/api/v3/')
    expect(urlMetadata.githubOrigin).toEqual('https://github.mycompany.com')
    expect(urlMetadata.issueNumber).toEqual('5')
    expect(urlMetadata.organization).toEqual('gatewayapps')
  })

  it('does not support non-github hosts with github-like paths', () => {
    const urlMetadata = populateUrlMetadata('https://example.com/gatewayapps/kamino/issues/5')
    expect(urlMetadata.error).toEqual('Unsupported GitHub host')
  })
})
