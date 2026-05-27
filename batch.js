var batchToken = ''
var issueList = []
var batchRepoList = []
var batchIntervalIds = []
var batchGithubApiUrl = 'https://api.github.com/'

$(window).on('unload', () => {
  batchIntervalIds.forEach(clearInterval)
  return
})

// don't try to re initialize the extension if there's a token in memory
if (batchToken === '') {
  batchIntervalIds.push(
    setInterval(() => {
      initializeBatchExtension()
    }, 1000),
  )
}

function initializeBatchExtension() {
  if ($('.kaminoButton').length > 0 || $('.batchButton').length > 0) {
    return
  }

  const newBtn = $(Handlebars.templates.batchButton().replace(/(\r\n|\n|\r)/gm, ''))
  const popup = $(Handlebars.templates.batchModal().replace(/(\r\n|\n|\r)/gm, ''))
  const urlObj = populateUrlMetadata(document.location.href)

  if (urlObj.error || !isIssueListUrl(urlObj)) {
    return
  }

  const mountTarget = getBatchMountTarget()

  if (mountTarget.length === 0) {
    return
  }

  $('#batchModal').remove()

  // append button and modal to DOM
  $(newBtn).insertBefore(mountTarget)
  $(popup).insertBefore(mountTarget)

  $(newBtn).click(() => {
    openBatchModal()
  })

  chrome.storage.sync.get(
    {
      githubToken: '',
    },
    (item) => {
      batchToken = item.githubToken
      loadIssues(urlObj)
      loadRepos()
    },
  )

  $('.cloneAndClose').on('click', async () => {
    const repoName = $('.repoDropdown option:selected').text()

    for (var item of $('.batchIssuesContainer > div > input:checked')) {
      const issueNumber = $(item).attr('id')
      updateMessageText(`Cloning issue #${issueNumber}`)
      await getGithubIssue(repoName, issueNumber, true)
    }
    updateMessageText('Done!')
  })

  $('.cloneAndKeepOpen').on('click', async () => {
    const repoName = $('.repoDropdown option:selected').text()

    for (var item of $('.batchIssuesContainer > div > input:checked')) {
      const issueNumber = $(item).attr('id')
      updateMessageText(`Cloning issue #${issueNumber}`)
      await getGithubIssue(repoName, issueNumber, false)
    }
    updateMessageText('Done!')
  })

  $('.close').on('click', () => {
    closeBatchModal()
  })

  $('.noClone').on('click', () => {
    closeBatchModal()
  })
}

function isIssueListUrl(urlObj) {
  try {
    const issueListUrl = new URL(urlObj.url)
    return issueListUrl.pathname === `/${urlObj.organization}/${urlObj.currentRepo}/issues`
  } catch {
    return false
  }
}

function getBatchMountTarget() {
  const filterMenu = $('#filters-select-menu')

  if (filterMenu.length > 0) {
    return filterMenu
  }

  return $('[data-testid="issue-pr-toolbar"]').first()
}

function updateMessageText(message) {
  if (message === 'Done!') {
    $('.message').text(message)
  } else {
    $('.message').text(`${message}...`)
  }
}

function getIssues(url) {
  return ajaxRequest('GET', '', url).then((issues) => {
    issueList = issueList.concat(issues.data)
    // are there more issues?
    var linkstring = issues.header.getResponseHeader('Link')
    if (linkstring) {
      var nextLink = undefined
      var linkArray = linkstring.split(',')
      linkArray.forEach((link) => {
        if (link.indexOf('rel="next"') > -1) {
          const re = /\<(.*?)\>/
          nextLink = link.match(re)[1]
        }
      })
      issues.data.forEach((item) => {
        if (!item.pull_request) {
          addIssueToList(item.title, item.number)
        }
      })

      if (nextLink) {
        return getIssues(nextLink)
      } else {
        return null
      }
    } else {
      issues.data.forEach((item) => {
        if (!item.pull_request) {
          addIssueToList(item.title, item.number)
        }
      })
      return null
    }
  })
}

function getRepos(url) {
  return ajaxRequest('GET', '', url).then((repos) => {
    batchRepoList = batchRepoList.concat(repos.data)
    // does the user have more repos
    var linkstring = repos.header.getResponseHeader('Link')
    if (linkstring) {
      var nextLink = undefined
      var linkArray = linkstring.split(',')
      linkArray.forEach((link) => {
        if (link.indexOf('rel="next"') > -1) {
          const re = /\<(.*?)\>/
          nextLink = link.match(re)[1]
        }
      })

      compileRepositoryList(repos.data)

      if (nextLink) {
        return getRepos(nextLink)
      } else {
        return null
      }
    } else {
      compileRepositoryList(repos.data)
      return null
    }
  })
}

function loadIssues(urlObj) {
  getIssues(`${batchGithubApiUrl}repos/${urlObj.organization}/${urlObj.currentRepo}/issues?per_page=100`).then(() => {})
}

function loadRepos() {
  // wire up search value change events
  var lastValue = ''
  $('.repoSearch').on('change keyup paste mouseup', function () {
    if ($(this).val() != lastValue) {
      lastValue = $(this).val()
      searchRepositories(lastValue)
    }
  })

  // if there's no personal access token, disable the button
  if (batchToken === '') {
    console.warn('disabling button because there is no Personal Access Token for authentication with Github')
    $('.batchButton').prop('disabled', true)
  } else {
    $('.batchButton').prop('disabled', false)
  }

  batchRepoList = []

  // clear the list each time to avoid duplicates
  $('.repoDropdown').empty()

  // add separator headers
  $('.repoDropdown').append('<option class="dropdown-header dropdown-header-used" disabled>Last Used</option>')
  $('.repoDropdown').append('<option class="dropdown-header dropdown-header-rest" disabled>The Rest</option>')

  getRepos(`${batchGithubApiUrl}user/repos?per_page=100`).then(() => {})
}

function compileRepositoryList(list, searchTerm) {
  chrome.storage.sync.get(
    {
      mostUsed: [],
    },
    (item) => {
      // check for a populated list
      if (item.mostUsed && item.mostUsed.length > 0) {
        // show used separator header
        $('.dropdown-header-used').addClass('active')

        var mostUsed = item.mostUsed

        // filter out most used by search term
        if (searchTerm && searchTerm !== '') {
          mostUsed = item.mostUsed.filter((item, index) => {
            return item.indexOf(searchTerm) > -1
          })
        }

        // hide header if there are no last used items
        if (!mostUsed || mostUsed.length === 0) {
          $('.dropdown-header-used').removeClass('active')
        }

        mostUsed.forEach((repoFull) => {
          addRepoToList(repoFull, 'used')

          // remove the item from the main repos list
          list = list.filter((i) => {
            return i.full_name !== repoFull
          })
        })
      } else {
        $('.dropdown-header-used').removeClass('active')
      }

      // show or hide rest header based on number of items
      if (!list || list.length === 0) {
        $('.dropdown-header-rest').removeClass('active')
      } else {
        $('.dropdown-header-rest').addClass('active')
      }

      list.forEach((repo) => {
        addRepoToList(repo.full_name)
      })
    },
  )
}

function searchRepositories(searchTerm) {
  // first look for any already loaded values in the repo dropdown
  var matches = batchRepoList.filter((item, index) => {
    return item.full_name.indexOf(searchTerm) > -1
  })

  // remove all items that are not a dropdown header
  // and hide headers
  $('.repoDropdown :not(.dropdown-header)').remove()
  $('.dropdown-header-used').removeClass('active')
  $('.dropdown-header-rest').removeClass('active')

  compileRepositoryList(matches, searchTerm)
}

async function getGithubIssue(destinationRepo, sourceIssueNumber, closeOriginal) {
  const { currentRepo, error, organization } = populateUrlMetadata(document.location.href)

  if (error) {
    return
  }

  const repoName = destinationRepo.split('/')[1]

  // Make the assumption that if users are using Kamino, then enable issues for the repo.
  // Otherwise Kamino will not function
  await ajaxRequest('PATCH', { has_issues: true, name: repoName }, `${batchGithubApiUrl}repos/${destinationRepo}`)

  const issue = await ajaxRequest(
    'GET',
    '',
    `${batchGithubApiUrl}repos/${organization}/${currentRepo}/issues/${sourceIssueNumber}`,
  )

  updateMessageText(`Creating issue #${sourceIssueNumber} at ${destinationRepo}`)

  await createGithubIssue(destinationRepo, issue.data, closeOriginal)
}

function getBatchSyncStorage(defaults) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaults, resolve)
  })
}

function getDatePart(timestamp) {
  return timestamp ? timestamp.split('T')[0] : ''
}

function formatClonedBody(body, options) {
  if (!body) {
    return ''
  }

  return options.addBlockquote ? addBlockQuote(body) : body
}

function applyBatchCloneTextOptions(text, options) {
  let updatedText = text

  if (options.preventMentions) {
    updatedText = preventMentions(updatedText)
  }

  if (options.preventReferences) {
    updatedText = preventReferences(updatedText)
  }

  return updatedText
}

// create the cloned GitHub issue
async function createGithubIssue(repo, oldIssue, closeOriginal) {
  const { currentRepo, error, organization } = populateUrlMetadata(document.location.href)

  if (error) {
    return
  }

  const options = await getBatchSyncStorage({
    addBlockquote: true,
    preventMentions: false,
    preventReferences: false,
  })
  const clonedBody = formatClonedBody(oldIssue.body, options)
  const createdAt = getDatePart(oldIssue.created_at)
  const attribution = `**[<img src="https://avatars.githubusercontent.com/u/${oldIssue.user.id}?s=17&v=4" width="17" height="17"> ${oldIssue.user.login}](${oldIssue.user.html_url})** cloned issue [${organization}/${currentRepo}#${oldIssue.number}](${oldIssue.html_url}) on ${createdAt}:`
  const newIssueBody = `${attribution}${clonedBody ? ` \n\n${clonedBody}` : ''}`

  const newIssue = {
    title: oldIssue.title,
    body: applyBatchCloneTextOptions(newIssueBody, options),
    labels: oldIssue.labels,
  }
  const response = await ajaxRequest('POST', newIssue, `${batchGithubApiUrl}repos/${repo}/issues`)

  await cloneOldIssueComments(
    response.data.number,
    repo,
    `${batchGithubApiUrl}repos/${organization}/${currentRepo}/issues/${oldIssue.number}/comments?per_page=100`,
  )

  await commentOnIssue(repo, oldIssue, response.data, closeOriginal)

  return response
}

async function cloneOldIssueComments(newIssue, repo, url) {
  const options = await getBatchSyncStorage({
    addBlockquote: true,
    cloneComments: false,
    preventMentions: false,
    preventReferences: false,
  })

  if (!options.cloneComments) {
    return null
  }

  const comments = await ajaxRequest('GET', '', url)

  if (!comments || !comments.data || comments.data.length === 0) {
    return comments
  }

  for (const current of comments.data) {
    const clonedBody = formatClonedBody(current.body, options)
    const createdAt = getDatePart(current.created_at)
    const attribution = `**[<img src="https://avatars.githubusercontent.com/u/${current.user.id}?s=17&v=4" width="17" height="17"> ${current.user.login}](${current.user.html_url})** commented [on ${createdAt}](${current.html_url}):`
    const newCommentBody = `${attribution}${clonedBody ? ` \n\n${clonedBody}` : ''}`
    const comment = {
      body: applyBatchCloneTextOptions(newCommentBody, options),
    }

    await ajaxRequest('POST', comment, `${batchGithubApiUrl}repos/${repo}/issues/${newIssue}/comments`)
  }

  return comments
}

async function closeGithubIssue(oldIssue) {
  const issueToClose = {
    state: 'closed',
  }

  const urlObj = populateUrlMetadata(document.location.href)

  updateMessageText(`Closing issue #${oldIssue.number}`)
  await ajaxRequest(
    'PATCH',
    issueToClose,
    `${batchGithubApiUrl}repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${oldIssue.number}`,
  )
  updateMessageText(`Issue #${oldIssue.number} closed`)
}

async function commentOnIssue(repo, oldIssue, newIssue, closeOriginal) {
  const urlObj = populateUrlMetadata(document.location.href)
  const newIssueLink = `[${repo}](${newIssue.html_url})`
  const comment = {
    body: closeOriginal
      ? `Kamino closed and cloned this issue to ${newIssueLink}`
      : `Kamino cloned this issue to ${newIssueLink}`,
  }

  const item = await getBatchSyncStorage({
    disableCommentsOnOriginal: false,
  })

  if (!item.disableCommentsOnOriginal) {
    await ajaxRequest(
      'POST',
      comment,
      `${batchGithubApiUrl}repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${oldIssue.number}/comments`,
    )
  }

  if (closeOriginal) {
    await closeGithubIssue(oldIssue)
  }
}

function ajaxRequest(type, data, url) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(
      {
        githubToken: '',
      },
      (item) => {
        batchToken = item.githubToken
        $.ajax({
          type: type,
          beforeSend: (request) => {
            request.setRequestHeader('Authorization', `token ${batchToken}`)
            request.setRequestHeader('Content-Type', 'application/json')
          },
          data: JSON.stringify(data),
          url: url,
        }).done((data, status, header) => {
          resolve({
            data: data,
            status: status,
            header: header,
          })
        })
      },
    )
  })
}

function addIssueToList(issueTitle, issueNumber) {
  $('.batchIssuesContainer').append(
    `<div style='padding: 5px;'>
      <input type='checkbox' id='${issueNumber}' name='${issueTitle}'>
      <label for='issue-${issueNumber}'>#${issueNumber} - ${issueTitle}</label
    </div>`,
  )
}

function addRepoToList(repoFullName, section) {
  // add the repo to the list
  const periodReplace = repoFullName.replace(/\./g, '_').replace(/\//g, '_')

  // determine where the item needs to go
  if (section === 'used') {
    if ($(`#${periodReplace}`).length === 0) {
      $('.dropdown-header-rest').before(
        `<option data-toggle="modal" id="${periodReplace}" data-target="#batchModal"><a class="repoItem" href="#" title="${repoFullName}">${repoFullName}</a></option>`,
      )
    }
  } else {
    $('.repoDropdown').append(
      `<option data-toggle="modal" id="${periodReplace}" data-target="#batchModal"><a class="repoItem" href="#" title="${repoFullName}">${repoFullName}</a></option>`,
    )
  }
}

function closeBatchModal() {
  $('#batchModal').removeClass('in')
  $('#batchModal').css('display', '')
}

function openBatchModal() {
  $('#batchModal').addClass('in')
  $('#batchModal').css('display', 'block')
}
