function preventMentions(text) {
  // replace "@githubusername" with a link to the user to avoid mention notifications
  // regex from https://stackoverflow.com/a/30281147
  return text.replace(
    /\B@([a-z0-9](?:-(?=[a-z0-9])|[a-z0-9]){0,38}(?<=[a-z0-9]))/gi,
    '[@**$1**](https://www.github.com/$1)'
  )
}

module.exports = preventMentions
