const preventReferences = require('../lib/preventReferences')

describe('preventReferences', () => {
  it('updates the url for github', () => {
    const originalText = 'This is text with a url: https://github.com/'

    const alteredText = preventReferences(originalText)
    expect(alteredText).toEqual(`This is text with a url: https://www.github.com/`)
  })
})
