function getGithubApiUrl(origin) {
  const githubUrl = new URL(origin)

  if (githubUrl.hostname === 'github.com') {
    return 'https://api.github.com/'
  }

  return `${githubUrl.origin}/api/v3/`
}

function isSupportedGithubHost(hostname) {
  const normalizedHostname = hostname.toLowerCase()
  return normalizedHostname === 'github.com' || normalizedHostname.startsWith('github.')
}

function populateUrlMetadata(href) {
  let parsedUrl

  try {
    parsedUrl = new URL(href)
  } catch {
    return { error: 'Cannot parse this url' }
  }

  if (!isSupportedGithubHost(parsedUrl.hostname)) {
    return { error: 'Unsupported GitHub host' }
  }

  const url = href
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean)

  if (pathParts.length >= 4 && pathParts[2] === 'issues') {
    return {
      url,
      currentRepo: pathParts[1],
      githubApiUrl: getGithubApiUrl(parsedUrl.origin),
      githubOrigin: parsedUrl.origin,
      githubHost: parsedUrl.hostname,
      organization: pathParts[0],
      issueNumber: pathParts[3],
    }
  } else if (pathParts.length === 3 && pathParts[2] === 'issues') {
    return {
      url,
      currentRepo: pathParts[1],
      githubApiUrl: getGithubApiUrl(parsedUrl.origin),
      githubOrigin: parsedUrl.origin,
      githubHost: parsedUrl.hostname,
      organization: pathParts[0],
      issueNumber: undefined,
    }
  }

  return { error: 'Cannot parse this url' }
}

if (typeof module !== 'undefined') {
  module.exports = populateUrlMetadata
  module.exports.getGithubApiUrl = getGithubApiUrl
  module.exports.isSupportedGithubHost = isSupportedGithubHost
}
