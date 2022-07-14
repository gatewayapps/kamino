var token = ''

// repo list
var repoList = []

var intervalIds = []

$(window).on('unload', () => {
  intervalIds.forEach(clearInterval)
  return
})

// don't try to re initialize the extension if there's a token in memory
if (token === '') {
  // load jquery via JS
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js', () => {
    intervalIds.push(setInterval(() => {
      initializeExtension()
    }, 1000))
  })
}

function initializeExtension() {
  // if there's already a button on the screen, exit
  if ($('.kaminoButton').length > 0 || $('.batchButton').length > 0) {
    intervalIds.forEach(clearInterval)
    return
  }

  intervalIds.forEach(clearInterval)

  // the button
  const newBtn = $(Handlebars.templates.button().replace(/(\r\n|\n|\r)/gm, ''))

  // the modal
  const context = {
    confirmText:
      'Are you sure you want to clone this issue to another repository? Choose whether to clone and close or clone and keep the original issue open.',
  }
  const popup = $(Handlebars.templates.modal(context).replace(/(\r\n|\n|\r)/gm, ''))

  // get url
  const urlObj = populateUrlMetadata()

  // if the page is not a pull request page(view or create)
  // and the page is not a new issue page
  // and there is no Kamino button in the DOM, proceed
  if (
    urlObj.url.indexOf(`${urlObj.organization}/${urlObj.currentRepo}/compare/`) < 0 &&
    urlObj.url.indexOf(`${urlObj.organization}/${urlObj.currentRepo}/pull/`) < 0 &&
    urlObj.url.indexOf(`${urlObj.organization}/${urlObj.currentRepo}/issues/new`) < 0 &&
    $('.kaminoButton').length === 0 &&
    $('.batchButton').length === 0
  ) {
    // look for any applied issue filters
    saveAppliedFilters(urlObj)

    // append button and modal to DOM
    $(newBtn).insertBefore($('.sidebar-assignee'))
    $(popup).insertBefore($('.sidebar-assignee'))

    // remove the open class just to be sure
    $('.btn-group').removeClass('open')

    // load the token
    chrome.storage.sync.get(
      {
        githubToken: '',
      },
      (item) => {
        token = item.githubToken
        // grab the PAT
        if ($('.kaminoButton').length > 0) {
          loadRepos()
        }
      }
    )

    $('.kaminoButton').click(() => {
      // make sure the bootstrap dropdown opens and closes properly
      openDropdown()
    })

    $('.quickClone').click(() => {
      if ($('.quickClone').attr('data-repo') === undefined) {
        openDropdown()
      } else {
        itemClick($('.quickClone').attr('data-repo'))
      }
    })

    $('.cloneAndClose').click(() => {
      closeModal()
      getGithubIssue($('.cloneAndClose').attr('data-repo'), true)
    })

    $('.cloneAndKeepOpen').click(() => {
      closeModal()
      getGithubIssue($('.cloneAndKeepOpen').attr('data-repo'), false)
    })

    $('.close').click(() => {
      closeModal()
    })

    $('.noClone').click(() => {
      closeModal()
    })
  } 
}

function saveAppliedFilters(urlObj) {
  // check for the appropriate url
  // url should have /issues and should not track any url that has an issue number at the end
  if (urlObj.url.indexOf('/issues') > 0 && isNaN(urlObj.issueNumber)) {
    // save the filter querystring for when/if we navigate back
    var url = urlObj.url
    var querystring = url.substring(url.indexOf('/issues'))

    // filter object stores the querystring, the organization and the repo
    var filter = {
      filter: querystring,
      organization: urlObj.organization,
      currentRepo: urlObj.currentRepo,
    }

    chrome.storage.sync.get(
      {
        filters: [],
      },
      (item) => {
        var exists = false
        var changed = false

        // convert the string to an empty array for existing users
        if (typeof item.filters === 'string') {
          item.filters = []
        }

        item.filters.forEach((f) => {
          // if the storage array contains the org and repo, then set exists flag
          if (f.organization === filter.organization && f.currentRepo === filter.currentRepo) {
            exists = true

            // if the querystring value has changed, set the changed flag and update the filter
            if (f.filter !== filter.filter) {
              changed = true
              f.filter = filter.filter
            }
          }
        })

        // if the filter doesn't exist, push to the array and set changed
        if (!exists) {
          changed = true
          item.filters.push(filter)
        }

        // only save if changed, otherwise the max quota per minute will be exceeded throwing errors
        if (changed) {
          chrome.storage.sync.set(
            {
              filters: item.filters,
            },
            () => {}
          )
        }
      }
    )
  }
}

function getRepos(url) {
  return ajaxRequest('GET', '', url).then((repos) => {
    repoList = repoList.concat(repos.data)
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

function loadRepos() {
  // wire up search value change events
  var lastValue = ''
  $('.repoSearch').on('change keyup paste mouseup', function () {
    if ($(this).val() != lastValue) {
      lastValue = $(this).val()
      searchRepositories(lastValue)
    }
  })

  // create a way to go to options without using the extension context menu
  $('.kamino-heading').click(() => {
    chrome.runtime.sendMessage({ action: 'goToOptions' }, (response) => {})
  })

  // if there's no personal access token, disable the button
  if (token === '') {
    console.warn('disabling button because there is no Personal Access Token for authentication with Github')
    $('.kaminoButton').prop('disabled', true)
    $('.quickClone').prop('disabled', true)
  }

  repoList = []
  const urlObj = populateUrlMetadata()

  // clear the list each time to avoid duplicates
  $('.repoDropdown').empty()

  // add separator headers
  $('.repoDropdown').append('<li class="dropdown-header dropdown-header-used">Last Used</li>')
  $('.repoDropdown').append('<li class="dropdown-header dropdown-header-rest">The Rest</li>')

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
        $('.quickClone').attr('data-repo', item.mostUsed[0])
        $('.quickClone').text(`Clone to ${item.mostUsed[0].substring(item.mostUsed[0].indexOf('/') + 1)}`)

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
        $('.quickClone').text('Clone to')
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
  var matches = repoList.filter((item, index) => {
    return item.full_name.indexOf(searchTerm) > -1
  })

  // remove all items that are not a dropdown header
  // and hide headers
  $('.repoDropdown :not(.dropdown-header)').remove()
  $('.dropdown-header-used').removeClass('active')
  $('.dropdown-header-rest').removeClass('active')

  compileRepositoryList(matches, searchTerm)
}

function getGithubIssue(repo, closeOriginal) {
  const urlObj = populateUrlMetadata()

  ajaxRequest(
    'GET',
    '',
    `https://api.github.com/repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${urlObj.issueNumber}`
  ).then((issue) => {
    // build new issue
    const newIssue = {
      title: issue.data.title,
      body: `From ${urlObj.currentRepo} created by [${issue.data.user.login}](${issue.data.user.html_url}): ${urlObj.organization}/${urlObj.currentRepo}#${urlObj.issueNumber}  \n\n${issue.data.body}`,
      labels: issue.data.labels,
    }

    createGithubIssue(newIssue, repo, issue.data, closeOriginal)
  })
}

// create the cloned GitHub issue
function createGithubIssue(newIssue, repo, oldIssue, closeOriginal) {
  const urlObj = populateUrlMetadata()

  ajaxRequest('POST', newIssue, `https://api.github.com/repos/${repo}/issues`).then((response) => {
    // clone comments from old issue to new issue
    cloneOldIssueComments(
      response.data.number,
      repo,
      `https://api.github.com/repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${urlObj.issueNumber}/comments?per_page=100`
    ).then((res) => {
      // add a comment to the closed issue
      commentOnIssue(repo, oldIssue, response.data, closeOriginal)
    })
  })
}

function cloneOldIssueComments(newIssue, repo, url) {
  return ajaxRequest('GET', '', url).then((comments) => {
    chrome.storage.sync.get(
      {
        cloneComments: false,
      },
      (item) => {
        if (!item.cloneComments) {
          return Promise.resolve(null)
        }

        if (!comments || !comments.data || comments.data.length === 0) {
          return Promise.resolve(null)
        }

        comments.data.reduce(
          (p, comment) => p.then(_ => {
            const c = {
              body: comment.body,
            }
            return ajaxRequest('POST', c, `https://api.github.com/repos/${repo}/issues/${newIssue}/comments`)
          }),
          Promise.resolve()
        ).then((res) => { 
            return Promise.resolve({})
        })
      }
    )
  })
}

function closeGithubIssue(oldIssue) {
  const issueToClose = {
    state: 'closed',
  }

  const urlObj = populateUrlMetadata()

  ajaxRequest(
    'PATCH',
    issueToClose,
    `https://api.github.com/repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${urlObj.issueNumber}`
  ).then((done) => {})
}

function commentOnIssue(repo, oldIssue, newIssue, closeOriginal) {
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
    (item) => {
      if (item.disableCommentsOnOriginal) {
        if (closeOriginal) {
          // if success, close the existing issue and open new in a new tab
          closeGithubIssue(oldIssue)
        }
        goToIssueList(repo, newIssue.number, urlObj.organization, urlObj.currentRepo)
      } else {
        ajaxRequest(
          'POST',
          comment,
          `https://api.github.com/repos/${urlObj.organization}/${urlObj.currentRepo}/issues/${urlObj.issueNumber}/comments`
        ).then((response) => {
          if (closeOriginal) {
            // if success, close the existing issue and open new in a new tab
            closeGithubIssue(oldIssue)
          }
          goToIssueList(repo, newIssue.number, urlObj.organization, urlObj.currentRepo)
        })
      }
    }
  )
}

function goToIssueList(repo, issueNumber, org, oldRepo) {
  // based on user settings, determines if the issues list will open after a clone or not
  chrome.runtime.sendMessage(
    { repo: repo, issueNumber: issueNumber, organization: org, oldRepo: oldRepo },
    (response) => {}
  )
}

function ajaxRequest(type, data, url) {
  return new Promise((resolve, reject) => {
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
  // add the repo to the list
  const periodReplace = repoFullName.replace(/\./g, '_').replace(/\//g, '_')

  // determine where the item needs to go
  if (section === 'used') {
    if ($(`#${periodReplace}`).length === 0) {
      $('.dropdown-header-rest').before(
        `<li data-toggle="modal" id="${periodReplace}" data-target="#kaminoModal"><a class="repoItem" href="#" title="${repoFullName}">${repoFullName}</a></li>`
      )
    }
  } else {
    $('.repoDropdown').append(
      `<li data-toggle="modal" id="${periodReplace}" data-target="#kaminoModal"><a class="repoItem" href="#" title="${repoFullName}">${repoFullName}</a></li>`
    )
  }

  $(`#${periodReplace}`).bind('click', () => {
    itemClick(repoFullName)
  })
}

function populateUrlMetadata() {
  var url = document.location.href
  const urlArray = url.split('/')
  const currentRepo = urlArray[4]
  const organization = urlArray[3]
  const issueNumber = urlArray[urlArray.length - 1].replace('#', '')

  const urlObject = {
    url: url,
    currentRepo: currentRepo,
    organization: organization,
    issueNumber: issueNumber,
  }

  return urlObject
}

function addToMostUsed(repo) {
  // get
  chrome.storage.sync.get(
    {
      mostUsed: [],
    },
    (item) => {
      // find the item
      if (
        item.mostUsed.find((e) => {
          return e === repo
        }) !== undefined
      ) {
        // if exists, get index
        var index = item.mostUsed.indexOf(repo)

        // remove
        item.mostUsed.splice(index, 1)

        // add to top
        item.mostUsed.unshift(repo)

        // pop the last if item count is more than 5
        if (item.mostUsed.length > 5) {
          item.mostUsed.pop()
        }
      } else {
        // add to top
        item.mostUsed.unshift(repo)

        // pop the last if item count is more than 5
        if (item.mostUsed.length > 5) {
          item.mostUsed.pop()
        }
      }

      // save
      chrome.storage.sync.set(
        {
          mostUsed: item.mostUsed,
        },
        (done) => {}
      )
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
  // add the item to the most used list
  addToMostUsed(repo)

  $('.cloneAndClose').attr('data-repo', repo)
  $('.cloneAndKeepOpen').attr('data-repo', repo)
  $('.confirmText').text(
    `Are you sure you want to clone this issue to ${repo}? Choose whether to clone and close or clone and keep the original issue open.`
  )
  openModal()
}

function closeModal() {
  // make sure the modal closes properly
  $('#kaminoModal').removeClass('in')
  $('#kaminoModal').css('display', '')
}

function openModal() {
  $('#kaminoModal').addClass('in')
  $('#kaminoModal').css('display', 'block')
}
