const preventReferences = require('../lib/preventReferences')

describe('preventReferences', () => {
  it('updates the url for github', () => {
    const originalText = 'This is text with a url: https://github.com/'

    const alteredText = preventReferences(originalText)
    expect(alteredText).toEqual(`This is text with a url: https://www.github.com/`)
  })

  it('updates urls for github enterprise hosts', () => {
    const originalText = 'This is text with a url: https://github.mycompany.com/gatewayapps/kamino/issues/1'

    const alteredText = preventReferences(originalText, 'github.mycompany.com')
    expect(alteredText).toEqual(
      'This is text with a url: https://www.github.mycompany.com/gatewayapps/kamino/issues/1'
    )
  })
})
