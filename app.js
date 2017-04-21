var token = ''

// the backdrop
var backdrop = $('<div class="kamino-backdrop fade in"></div>');

// don't try to re initialize the extension if there's a token in memory
if (token === '') {
  // load jquery via JS
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.0/jquery.min.js', () => {
    setInterval(() => { initializeExtension() }, 1000)
  })
}

function initializeExtension() {
  // if there's already a button on the screen, exit
  if ($('.kaminoButton').length > 0) {
    return
  }

  // the button
  const newBtn = $('<div class="TableObject-item btn-group"><button type="button" class="btn btn-sm btn-primary quickClone">Clone to ims-shared-core</button><button type="button" class="btn btn-sm btn-primary dropdown-toggle kaminoButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu repoDropdown"></ul></div>')
  const btn = $('<div class="dropdown"><button class="btn btn-sm btn-primary dropdown-toggle kaminoButton" type="button" data-toggle="dropdown">Clone issue to<span class="caret"></span></button><ul class="dropdown-menu repoDropdown"></ul></div>')
  // the modal
  const popup = $('<div id="kaminoModal" class="modal fade" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal">&times;</button><h4 class="modal-title">Kamino - Confirm Clone</h4></div><div class="modal-body"><p class="confirmText">Are you sure you want to clone this issue to another repository? The original issue will be closed.</p></div><div class="modal-footer"><button type="button" class="btn btn-primary cloneNow" style="margin-right:20px;" data-dismiss="modal" data-repo="">Yes</button><button type="button" class="btn btn-info noClone" data-dismiss="modal">No</button></div></div></div></div>')

  // get url
  const urlObj = populateUrlMetadata()

  // if the page is not a pull request page and there is no Kamino button in the DOM, proceed
  if (urlObj.url.indexOf('/pull/') < 0 && $('.kaminoButton').length === 0) {
    // append button and modal to DOM
    $('.gh-header-meta').append(newBtn)
    $('.gh-header-meta').append(popup)

    // load the token
    chrome.storage.sync.get({
      githubToken: ''
    }, (item) => {
      token = item.githubToken
      // grab the PAT
      if ($('.kaminoButton').length > 0) {
        loadRepos()
      }
    })

    $('.kaminoButton').click(() => {
      // make sure the bootstrap dropdown opens and closes properly
      if ($('.btn-group').hasClass('open')) {
        $('.btn-group').removeClass('open')
      }
      else {
        $('.btn-group').addClass('open')
      }
    })

    $('.cloneNow').click(() => {
      closeModal()
      getGithubIssue($('.cloneNow').attr('data-repo'))
    })

    $('.close').click(() => {
      closeModal()
    })

    $('.noClone').click(() => {
      closeModal()
    })
  }
}

function loadRepos() {
  // if there's no personal access token, disable the button
  if (token === '') {
    console.log('disabling button because there is no Personal Access Token for authentication with Github')
    $(".kaminoButton").prop('disabled', true)
    $(".quickClone").prop('disabled', true)
  }

  // get a list of repos for the user
  ajaxRequest('GET', '', 'https://api.github.com/user/repos?per_page=1000',
    (repos) => {
      // get the current github issue info from the url
      const urlObj = populateUrlMetadata()

      // sort the repo
      repos = repos.sort((a, b) => a.full_name.localeCompare(b.full_name))

      // remove the repo you're currently on
      repos = repos.filter((item) => {
        return item.full_name !== urlObj.currentRepo
      })

      // clear the list each time to avoid duplicates
      $('.repoDropdown').empty()

      repos.forEach((repo) => {
        $('.repoDropdown').append('<li data-toggle="modal" id="' + repo.name + '" data-target="#kaminoModal"><a class="repoItem" href="#">' + repo.full_name + '</a></li>')
        $('#' + repo.name).bind('click', () => { itemClick(repo.full_name) })
      })
    },
    (error) => {
      console.error('disabling because get repository request failed')
      console.error(error)
      $(".kaminoButton").prop('disabled', true)
      $(".quickClone").prop('disabled', true)
    })
}

function getGithubIssue(repo) {
  const urlObj = populateUrlMetadata()

  ajaxRequest('GET', '', 'https://api.github.com/repos/' + urlObj.organization + '/' + urlObj.currentRepo + '/issues/' + urlObj.issueNumber,
    (issue) => {
      // build new issue
      const newIssue = {
        title: issue.title,
        body: 'From ' + urlObj.currentRepo + ': ' + urlObj.organization + '/' + urlObj.currentRepo + '#' + urlObj.issueNumber + "  \n\n" + issue.body,
        milestone: issue.milestone,
        labels: issue.labels
      }
      createGithubIssue(newIssue, repo, issue)
    },
    (error) => {
      console.error(error)
    })
}

// create the cloned GitHub issue
function createGithubIssue(newIssue, repo, oldIssue) {
  ajaxRequest('POST', newIssue, 'https://api.github.com/repos/' + repo + '/issues',
    (response) => {
      // add a comment to the closed issue
      commentOnIssue(repo, oldIssue, response)
    },
    (error) => {
      console.error(error)
    })
}

function closeGithubIssue(oldIssue) {
  const issueToClose = {
    state: 'closed'
  }

  const urlObj = populateUrlMetadata()

  ajaxRequest('PATCH', issueToClose, 'https://api.github.com/repos/' + urlObj.organization + '/' + urlObj.currentRepo + '/issues/' + urlObj.issueNumber,
    (response) => {
    },
    (error) => {
      console.error(error)
    })
}

function commentOnIssue(repo, oldIssue, newIssue) {
  const urlObj = populateUrlMetadata()

  const comment = {
    body: 'Kamino closed and cloned this issue to ' + urlObj.organization + '/' + repo
  }

  ajaxRequest('POST', comment, 'https://api.github.com/repos/' + urlObj.organization + '/' + urlObj.currentRepo + '/issues/' + urlObj.issueNumber + '/comments',
    (response) => {
      // if success, close the existing issue and open new in a new tab
      closeGithubIssue(oldIssue)
      window.open('https://github.com/' + repo + '/issues/' + newIssue.number, "_blank")
    },
    (error) => {
      console.error(error)
    })
}

function ajaxRequest(type, data, url, successCallback, errorCallback) {
  chrome.storage.sync.get({
    githubToken: ''
  }, (item) => {
    token = item.githubToken
    $.ajax({
      type: type,
      beforeSend: (request) => {
        request.setRequestHeader('Authorization', 'token ' + token)
        request.setRequestHeader('Content-Type', 'application/json')
      },
      data: JSON.stringify(data),
      url: url,
      success: (response) => {
        successCallback(response)
      },
      error: (err) => {
        errorCallback(err)
      }
    })
  })
}

function populateUrlMetadata() {
  var url = document.location.href
  const urlArray = url.split('/')
  const currentRepo = urlArray[urlArray.length - 3]
  const organization = urlArray[urlArray.length - 4]
  const issueNumber = urlArray[urlArray.length - 1].replace('#', '')

  const urlObject = {
    url: url,
    currentRepo: currentRepo,
    organization: organization,
    issueNumber: issueNumber
  }

  return urlObject
}

function itemClick(repo) {
  $('.cloneNow').attr('data-repo', repo)
  $('.confirmText').text('Are you sure you want to clone this issue to ' + repo + '? The original issue will be closed.')
  openModal()
}

function closeModal() {
  // make sure the modal closes properly
  $('.kamino-backdrop').remove();
  $('#kaminoModal').removeClass('in')
  $('#kaminoModal').css('display', '')
}

function openModal() {
  $('#kaminoModal').addClass('in')
  $('#kaminoModal').css('display', 'block')
  $('#js-repo-pjax-container').append(backdrop);
}