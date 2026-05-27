const preventMentions = require('../lib/preventMentions')

describe('preventMentions', () => {
  it('converts GitHub mentions to profile links', () => {
    const originalText = 'Please check with @octocat before merging.'

    const alteredText = preventMentions(originalText)
    expect(alteredText).toEqual('Please check with [@**octocat**](https://github.com/octocat) before merging.')
  })

  it('does not convert email addresses', () => {
    const originalText = 'Email test@example.com for details.'

    const alteredText = preventMentions(originalText)
    expect(alteredText).toEqual(originalText)
  })
})
