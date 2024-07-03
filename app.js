var token = ''
var repoList = []
var intervalIds = []
var githubApiUrl = 'https://api.github.com/'

$(window).on('unload', () => {
  intervalIds.forEach(clearInterval)
  return
})

// don't try to re initialize the extension if there's a token in memory
if (token === '') {
  intervalIds.push(
    setInterval(() => {
      initializeExtension()
    }, 1000)
  )
}

function initializeExtension() {
  const { currentRepo, error, issueNumber, organization, url } = populateUrlMetadata(document.location.href)

  if (error) {
    return
  }

  // if the page is a pull request page(view or create)
  // or the page is a new issue page
  // or there is a Kamino button in the DOM, exit
  if (
    url.indexOf(`${organization}/${currentRepo}/compare/`) > -1 ||
    url.indexOf(`${organization}/${currentRepo}/pull/`) > -1 ||
    url.indexOf(`${organization}/${currentRepo}/issues/new`) > -1 ||
    $('.kaminoButton').length > 0 ||
    $('.batchButton').length > 0
  ) {
    intervalIds.forEach(clearInterval)
    return
  }

  intervalIds.forEach(clearInterval)
  saveAppliedFilters({ currentRepo, issueNumber, organization, url })

  const kaminoButton = $(Handlebars.templates.button().replace(/(\r\n|\n|\r)/gm, ''))
  const modalContext = {
    confirmText:
      'Are you sure you want to clone this issue to another repository? Choose whether to clone and close or clone and keep the original issue open.',
  }
  const modal = $(Handlebars.templates.modal(modalContext).replace(/(\r\n|\n|\r)/gm, ''))

  $(kaminoButton).insertBefore($('.sidebar-assignee'))
  $(modal).insertBefore($('.sidebar-assignee'))

  const kaminoButtonExists = $('.kaminoButton').length > 0
  $('.btn-group').removeClass('open')

  chrome.storage.sync.get(
    {
      githubToken: '',
    },
    (item) => {
      token = item.githubToken

      if (kaminoButtonExists) {
        loadRepos()
      }
    }
  )

  $('.kaminoButton').click(() => {
    openDropdown()
  })

  $('.quickClone').click(() => {
    if ($('.quickClone').attr('data-repo') === undefined) {
      openDropdown()
    } else {
      itemClick($('.quickClone').attr('data-repo'))
    }
  })

  $('.cloneAndClose').click(async () => {
    toggleModal(false)
    await getGithubIssue($('.cloneAndClose').attr('data-repo'), true)
  })

  $('.cloneAndKeepOpen').click(async () => {
    toggleModal(false)
    await getGithubIssue($('.cloneAndKeepOpen').attr('data-repo'), false)
  })

  $('.close').click(() => {
    toggleModal(false)
  })

  $('.noClone').click(() => {
    toggleModal(false)
  })
}

function saveAppliedFilters(urlMetadata) {
  const { currentRepo, issueNumber, organization, url } = urlMetadata

  // url should have /issues and should not track any url that has an issue number at the end
  if (url.indexOf('/issues') > 0 && isNaN(issueNumber)) {
    const querystring = url.substring(url.indexOf('/issues'))

    var newFilter = {
      filter: querystring,
      organization,
      currentRepo,
    }

    chrome.storage.sync.get(
      {
        filters: [],
      },
      (item) => {
        const { filters, changed } = createFilters(newFilter, item)

        // only save if changed, otherwise the max quota per minute will be exceeded throwing errors
        if (changed) {
          chrome.storage.sync.set({
            filters,
          })
        }
      }
    )
  }
}

async function getRepos(url) {
  const response = await ajaxRequest('GET', '', url)

  repoList = repoList.concat(response.data)

  const linkValue = response.header.getResponseHeader('Link')
  if (linkValue) {
    let nextLink
    const links = linkValue.split(',')

    links.forEach((link) => {
      if (link.indexOf('rel="next"') > -1) {
        const re = /\<(.*?)\>/
        nextLink = link.match(re)[1]
      }
    })

    compileRepositoryList(response.data)

    if (nextLink) {
      return await getRepos(nextLink)
    } else {
      return null
    }
  } else {
    compileRepositoryList(response.data)
    return null
  }
}

async function loadRepos() {
  let lastValue = ''

  $('.repoSearch').on('change keyup paste mouseup', function () {
    if ($(this).val() != lastValue) {
      lastValue = $(this).val()
      searchRepositories(lastValue)
    }
  })

  $('.kamino-heading').click(() => {
    chrome.runtime.sendMessage({ action: 'goToOptions' }, () => {})
  })

  if (token === '') {
    console.warn(
      'disabling button because there is no Personal Access Token for authentication with GitHub. Please check your Kamino settings to make sure there is a stored Access Token'
    )
    $('.kaminoButton').prop('disabled', true)
    $('.quickClone').prop('disabled', true)
  }

  repoList = []

  $('.repoDropdown').empty()
  $('.repoDropdown').append('<li class="dropdown-header dropdown-header-used">Last Used</li>')
  $('.repoDropdown').append('<li class="dropdown-header dropdown-header-rest">The Rest</li>')

  await getRepos(`${githubApiUrl}user/repos?per_page=100`)
}

function compileRepositoryList(mainRepoList, searchTerm) {
  chrome.storage.sync.get(
    {
      mostUsed: [],
    },
    (item) => {
      if (item.mostUsed && item.mostUsed.length > 0) {
        $('.quickClone').attr('data-repo', item.mostUsed[0])
        $('.quickClone').text(`Clone to ${item.mostUsed[0].substring(item.mostUsed[0].indexOf('/') + 1)}`)
        $('.dropdown-header-used').addClass('active')

        let mostUsed = item.mostUsed

        if (searchTerm && searchTerm !== '') {
          mostUsed = item.mostUsed.filter((item) => {
            return item.indexOf(searchTerm) > -1
          })
        }

        if (!mostUsed || mostUsed.length === 0) {
          $('.dropdown-header-used').removeClass('active')
        }

        mostUsed.forEach((fullRepositoryName) => {
          addRepoToList(fullRepositoryName, 'used')

          mainRepoList = mainRepoList.filter((i) => {
            return i.full_name !== fullRepositoryName
          })
        })
      } else {
        $('.dropdown-header-used').removeClass('active')
        $('.quickClone').text('Clone to')
      }

      if (!mainRepoList || mainRepoList.length === 0) {
        $('.dropdown-header-rest').removeClass('active')
      } else {
        $('.dropdown-header-rest').addClass('active')
      }

      mainRepoList.forEach((repo) => {
        addRepoToList(repo.full_name)
      })
    }
  )
}

function searchRepositories(searchTerm) {
  var repositoryMatches = repoList.filter((item) => {
    return item.full_name.indexOf(searchTerm) > -1
  })

  $('.repoDropdown :not(.dropdown-header)').remove()
  $('.dropdown-header-used').removeClass('active')
  $('.dropdown-header-rest').removeClass('active')

  compileRepositoryList(repositoryMatches, searchTerm)
}

async function getGithubIssue(repo, closeOriginal) {
  const { currentRepo, error, issueNumber, organization } = populateUrlMetadata(document.location.href)

  if (error) {
    return
  }

  const repoName = repo.split('/')[1]

  // Make the assumption that if users are using Kamino, then enable issues for the repo.
  // Otherwise Kamino will not function
  await ajaxRequest('PATCH', { has_issues: true, name: repoName }, `${githubApiUrl}repos/${repo}`)

  const issue = await ajaxRequest(
    'GET',
    '',
    `${githubApiUrl}repos/${organization}/${currentRepo}/issues/${issueNumber}`
  )

  await createGithubIssue(repo, issue.data, closeOriginal)
}

async function createGithubIssue(repo, oldIssue, closeOriginal) {
  const { currentRepo, error, issueNumber, organization } = populateUrlMetadata(document.location.href)

  if (error) {
    return
  }

  chrome.storage.sync.get({ preventReferences: false }, async (item) => {
    const blockQuoteOldBody = addBlockQuote(oldIssue.body)
    const createdAt = oldIssue.created_at.split('T')[0]
    const newIssueBody = `**[<img src="https://avatars.githubusercontent.com/u/${oldIssue.user.id}?s=17&v=4" width="17" height="17"> @${oldIssue.user.login}](${oldIssue.user.html_url})** cloned issue [${organization}/${currentRepo}#${issueNumber}](${oldIssue.html_url}) on ${createdAt}: \n\n${blockQuoteOldBody}`

    const newIssue = {
      title: oldIssue.title,
      body: item.preventReferences ? preventReferences(newIssueBody) : newIssueBody,
      labels: oldIssue.labels,
    }
    const response = await ajaxRequest('POST', newIssue, `${githubApiUrl}repos/${repo}/issues`)
    await cloneOldIssueComments(
      response.data.number,
      repo,
      `${githubApiUrl}repos/${organization}/${currentRepo}/issues/${issueNumber}/comments?per_page=100`
    )

    await commentOnIssue(repo, response.data, closeOriginal)
  })
}

async function cloneOldIssueComments(newIssue, repo, url) {
  const response = await ajaxRequest('GET', '', url)

  chrome.storage.sync.get(
    {
      cloneComments: false,
      preventReferences: false,
    },
    (item) => {
      if (!item.cloneComments) {
        return null
      }

      if (!response || !response.data || response.data.length === 0) {
        return null
      }

      response.data.reduce(async (previous, current) => {
        await previous
        const blockQuoteOldBody = addBlockQuote(current.body)
        const createdAt = current.created_at.split('T')[0]
        const newCommentBody = `**[<img src="https://avatars.githubusercontent.com/u/${current.user.id}?s=17&v=4" width="17" height="17"> @${current.user.login}](${current.user.html_url})** [commented](${current.html_url}) on ${createdAt}: \n\n${blockQuoteOldBody}`
        const comment = {
          body: item.preventReferences ? preventReferences(newCommentBody) : newCommentBody,
        }
        return ajaxRequest('POST', comment, `${githubApiUrl}repos/${repo}/issues/${newIssue}/comments`)
      }, Promise.resolve())
    }
  )

  return response
}

async function closeGithubIssue() {
  const issueToClose = {
    state: 'closed',
  }

  const { currentRepo, error, issueNumber, organization } = populateUrlMetadata(document.location.href)

  if (error) {
    return
  }

  await ajaxRequest('PATCH', issueToClose, `${githubApiUrl}repos/${organization}/${currentRepo}/issues/${issueNumber}`)
}

async function commentOnIssue(repo, newIssue, closeOriginal) {
  const { currentRepo, error, issueNumber, organization } = populateUrlMetadata(document.location.href)

  if (error) {
    return
  }

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
          await closeGithubIssue()
        }
        goToIssueList(repo, newIssue.number, organization, currentRepo)
      } else {
        await ajaxRequest(
          'POST',
          comment,
          `${githubApiUrl}repos/${organization}/${currentRepo}/issues/${issueNumber}/comments`
        )

        if (closeOriginal) {
          await closeGithubIssue()
        }
        goToIssueList(repo, newIssue.number, organization, currentRepo)
      }
    }
  )
}

function goToIssueList(repo, issueNumber, org, oldRepo) {
  chrome.runtime.sendMessage({ repo: repo, issueNumber: issueNumber, organization: org, oldRepo: oldRepo }, () => {})
}

async function ajaxRequest(type, data, url) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        githubToken: '',
      },
      (item) => {
        token = item.githubToken
        $.ajax({
          type: type,
          beforeSend: (request) => {
            request.setRequestHeader('Authorization', `token ${token}`)
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

function addRepoToList(repoFullName, section) {
  // replace slashes and periods because they aren't valid HTML ids
  const periodReplace = repoFullName.replace(/\./g, '_').replace(/\//g, '_')
  const listItem = `<li data-toggle="modal" id="${periodReplace}" data-target="#kaminoModal"><a class="repoItem" href="#" title="${repoFullName}">${repoFullName}</a></li>`

  if (section === 'used') {
    if ($(`#${periodReplace}`).length === 0) {
      $('.dropdown-header-rest').before(listItem)
    }
  } else {
    $('.repoDropdown').append(listItem)
  }

  $(`#${periodReplace}`).bind('click', () => {
    itemClick(repoFullName)
  })
}

function addToMostUsed(repo) {
  chrome.storage.sync.get(
    {
      mostUsed: [],
    },
    (item) => {
      if (
        item.mostUsed.find((e) => {
          return e === repo
        })
      ) {
        const index = item.mostUsed.indexOf(repo)

        item.mostUsed.splice(index, 1)
        item.mostUsed.unshift(repo)

        if (item.mostUsed.length > 5) {
          item.mostUsed.pop()
        }
      } else {
        item.mostUsed.unshift(repo)

        if (item.mostUsed.length > 5) {
          item.mostUsed.pop()
        }
      }

      chrome.storage.sync.set({
        mostUsed: item.mostUsed,
      })
    }
  )
}

function openDropdown() {
  if ($('.btn-group').hasClass('open')) {
    $('.btn-group').removeClass('open')
  } else {
    $('.btn-group').addClass('open')
  }
}

function itemClick(repo) {
  addToMostUsed(repo)

  $('.cloneAndClose').attr('data-repo', repo)
  $('.cloneAndKeepOpen').attr('data-repo', repo)
  $('.confirmText').text(
    `Are you sure you want to clone this issue to ${repo}? Choose whether to clone and close or clone and keep the original issue open.`
  )
  toggleModal(true)
}

function toggleModal(open) {
  if (open) {
    $('#kaminoModal').addClass('in')
    $('#kaminoModal').css('display', 'block')
  } else {
    $('#kaminoModal').removeClass('in')
    $('#kaminoModal').css('display', '')
  }
}
