function addBlockQuote(text) {
  return text.replace(/^/gm, '> ')
}

module.exports = addBlockQuote
