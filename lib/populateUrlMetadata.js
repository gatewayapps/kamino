function populateUrlMetadata(href) {
  const url = href
  const urlArray = url.split('/')

  if (urlArray.length >= 7) {
    const currentRepo = urlArray[4]
    const organization = urlArray[3]
    const issueNumber = urlArray[urlArray.length - 1].replace('#', '')

    return {
      url,
      currentRepo,
      organization,
      issueNumber,
    }
  } else if (urlArray.length >= 6) {
    const currentRepo = urlArray[4]
    const organization = urlArray[3]

    return {
      url,
      currentRepo,
      organization,
      issueNumber: undefined,
    }
  }

  return { error: 'Cannot parse this url' }
}

module.exports = populateUrlMetadata
