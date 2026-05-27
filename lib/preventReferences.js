function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function preventReferences(text, githubHost) {
  const host =
    githubHost ||
    (typeof window !== 'undefined' && window.location && window.location.hostname) ||
    'github.com'
  const referenceLink = new RegExp(`https://${escapeRegex(host)}/`, 'gi')

  // Add "www." to same-host GitHub links so cloned content does not notify the original issue.
  return text.replace(referenceLink, `https://www.${host}/`)
}

if (typeof module !== 'undefined') {
  module.exports = preventReferences
}
