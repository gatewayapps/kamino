function addBlockQuote(text) {
  return text.replace(/^/gm, '> ')
}

if (typeof module !== 'undefined') {
  module.exports = addBlockQuote
}
