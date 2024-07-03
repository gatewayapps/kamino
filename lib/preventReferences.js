function preventReferences(text) {
  // replace "github.com" links with "www.github.com" links, which do not cause references on the original issue due to the "www" (see https://github.com/orgs/community/discussions/23123#discussioncomment-3239240)
  return text.replace(/https:\/\/github.com\//gi, 'https://www.github.com/')
}

module.exports = preventReferences
