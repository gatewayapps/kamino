const addBlockQuote = require('../lib/addBlockQuote')

describe('addBlockQuote', () => {
  it('adds block quotes to text', () => {
    const originalText = 'This is text'

    const blockQuoteText = addBlockQuote(originalText)
    expect(blockQuoteText).toEqual(`> ${originalText}`)
  })
})
