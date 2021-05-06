var batchToken = ''
var issueList = []
var batchRepoList = []
var batchIntervalIds = []

$(window).on('unload', () => {
  batchIntervalIds.forEach(clearInterval)
  return
})

// don't try to re initialize the extension if there's a token in memory
if (batchToken === '') {
  // load jquery via JS
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js', () => {
    batchIntervalIds.push(setInterval(() => {
      initializeBatchExtension()
    }, 1000))
  })
}

function initializeBatchExtension() {
  if($('.kaminoButton').length > 0 || $('.batchButton').length > 0) {
    batchIntervalIds.forEach(clearInterval)
    return
  }

  batchIntervalIds.forEach(clearInterval)

  const newBtn = $(Handlebars.templates.batchButton().replace(/(\r\n|\n|\r)/gm, ''))
  const popup = $(Handlebars.templates.batchModal().replace(/(\r\n|\n|\r)/gm, ''))
  const urlObj = populateUrlMetadata()

  if(urlObj.url.indexOf(`${urlObj.organization}/${urlObj.currentRepo}/issues`) > -1 && urlObj.url.split('/').length < 7) {
    // append button and modal to DOM
    $(newBtn).insertBefore($('div').find(`[id=filters-select-menu]`))
    $(popup).insertBefore($('div').find(`[id=filters-select-menu]`))
 
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
      }
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
}

function updateMessageText(message) {
  if(message === 'Done!') {
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
        if(!item.pull_request) {
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
        if(!item.pull_request) {
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
  getIssues(`https://api.github.com/repos/${urlObj.organization}/${urlObj.currentRepo}/issues?per_page=100`).then(() => {})
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
  $('.repoDropdown').append('<option class="dropdown-header dropdown-header-used">Last Used</option>')
  $('.repoDropdown').append('<option class="dropdown-header dropdown-header-rest">The Rest</option>')

  getRepos('https://api.github.com/user/repos?per_page=100').then(() => {})
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
    }
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

async function getGithubIssue(destinationRepo, issueNumber, closeOriginal) {
  const urlObj = populateUrlMetadata()

  const issue = await ajaxRequest(
    'GET',
    '',
    `https://api.github.com/repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${issueNumber}`
  )

  // build new issue
  const newIssue = {
    title: issue.data.title,
    body: `From ${urlObj.currentRepo} created by [${issue.data.user.login}](${issue.data.user.html_url}): ${urlObj.organization}/${urlObj.currentRepo}#${issueNumber}  \n\n${issue.data.body}`,
    labels: issue.data.labels,
  }
  updateMessageText(`Creating issue #${issueNumber} at ${destinationRepo}`)

  await createGithubIssue(newIssue, destinationRepo, issue.data, closeOriginal)
}

// create the cloned GitHub issue
async function createGithubIssue(newIssue, repo, oldIssue, closeOriginal) {
  const urlObj = populateUrlMetadata()

  const response = await ajaxRequest('POST', newIssue, `https://api.github.com/repos/${repo}/issues`)

  // clone comments from old issue to new issue
  await cloneOldIssueComments(
  response.data.number,
  repo,
  `https://api.github.com/repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${oldIssue.number}/comments?per_page=100`
  )
  
  // add a comment to the closed issue
  commentOnIssue(repo, oldIssue, response.data, closeOriginal)
}

async function cloneOldIssueComments(newIssue, repo, url) {
  const comments = await ajaxRequest('GET', '', url)

  chrome.storage.sync.get(
    {
      cloneComments: false,
    },
    async (item) => {
      if (!item.cloneComments) {
        return null
      }

      if (!comments || !comments.data || comments.data.length === 0) {
        return null
      }

      for (var comment of comments.data) {
        const c = {
          body: comment.body,
        }

        await ajaxRequest('POST', c, `https://api.github.com/repos/${repo}/issues/${newIssue}/comments`)
      }
    }
  )
}

async function closeGithubIssue(oldIssue) {
  const issueToClose = {
    state: 'closed',
  }

  const urlObj = populateUrlMetadata()

  updateMessageText(`Closing issue #${oldIssue.number}`)
  await ajaxRequest(
    'PATCH',
    issueToClose,
    `https://api.github.com/repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${oldIssue.number}`
  )
  updateMessageText(`Issue #${oldIssue.number} closed`)
}

async function commentOnIssue(repo, oldIssue, newIssue, closeOriginal) {
  const urlObj = populateUrlMetadata()
  const newIssueLink = `[${repo}](${newIssue.html_url})`
  const comment = {
    body: closeOriginal
      ? `Kamino closed and cloned this issue to ${newIssueLink}`
      : `Kamino cloned this issue to ${newIssueLink}`,
  }

  chrome.storage.sync.get(
    {
      disableCommentsOnOriginal: false,
    },
    async (item) => {
      if (item.disableCommentsOnOriginal) {
        if (closeOriginal) {
          // if success, close the existing issue
          await closeGithubIssue(oldIssue)
        }
      } else {
        await ajaxRequest(
          'POST',
          comment,
          `https://api.github.com/repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${oldIssue.number}/comments`
        )
          if (closeOriginal) {
            // if success, close the existing issue
            await closeGithubIssue(oldIssue)
          }
      }
    }
  )
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
      }
    )
  })
}

function addIssueToList(issueTitle, issueNumber) {
  $('.batchIssuesContainer').append(
    `<div style='padding: 5px;'>
      <input type='checkbox' id='${issueNumber}' name='${issueTitle}'>
      <label for='issue-${issueNumber}'>#${issueNumber} - ${issueTitle}</label
    </div>`
  )
}

function addRepoToList(repoFullName, section) {
  // add the repo to the list
  const periodReplace = repoFullName.replace(/\./g, '_').replace(/\//g, '_')

  // determine where the item needs to go
  if (section === 'used') {
    if ($(`#${periodReplace}`).length === 0) {
      $('.dropdown-header-rest').before(
        `<option data-toggle="modal" id="${periodReplace}" data-target="#batchModal"><a class="repoItem" href="#" title="${repoFullName}">${repoFullName}</a></option>`
      )
    }
  } else {
    $('.repoDropdown').append(
      `<option data-toggle="modal" id="${periodReplace}" data-target="#batchModal"><a class="repoItem" href="#" title="${repoFullName}">${repoFullName}</a></option>`
    )
  }
}

function populateUrlMetadata() {
  var url = document.location.href
  const urlArray = url.split('/')
  const currentRepo = urlArray[4]
  const organization = urlArray[3]

  const urlObject = {
    url: url,
    currentRepo: currentRepo,
    organization: organization
  }

  return urlObject
}

function closeBatchModal() {
  $('#batchModal').removeClass('in')
  $('#batchModal').css('display', '')
}

function openBatchModal() {
  $('#batchModal').addClass('in')
  $('#batchModal').css('display', 'block')
}
