function preventMentions(text) {
  // Convert @username mentions to profile links so GitHub does not notify the user.
  return text.replace(
    /\B@([a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38})\b/gi,
    '[@**$1**](https://github.com/$1)'
  )
}

if (typeof module !== 'undefined') {
  module.exports = preventMentions
}
