const preventMentions = require('../lib/preventMentions')

describe('preventMentions', () => {
  it('replaces @username with urls', () => {
    const originalText = 'Hello, @johnmurphy01. How are you doing?'

    const alteredText = preventMentions(originalText)
    expect(alteredText).toEqual(`Hello, [@**johnmurphy01**](https://www.github.com/johnmurphy01). How are you doing?`)
  })
})
