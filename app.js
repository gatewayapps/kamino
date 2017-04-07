var token = ''

// the button
var btn = $('<div class="dropdown"><button class="btn btn-primary dropdown-toggle repoButton" type="button" data-toggle="dropdown">Clone issue to<span class="caret"></span></button><ul class="dropdown-menu repoDropdown"></ul></div>');

// get url
var url = document.location.href;

// get the current github issue info
var urlArray = url.split('/');
var issueNumber = urlArray[urlArray.length - 1].replace('#', '');
var organization = urlArray[urlArray.length - 4];
var currentRepo = urlArray[urlArray.length - 3];

// grab the PAT
chrome.storage.sync.get({
  githubToken: ''
}, (item) => {
  token = item.githubToken
  loadRepos();
});

// append button to DOM
$('.gh-header-meta').append(btn);

// get all repos for the user
function loadRepos() {
  if (!token || token === '') {
    $(".repoButton").prop('disabled', true);
  }

  $.ajax({
    type: 'GET',
    beforeSend: (request) => {
      request.setRequestHeader("Authorization", "token " + token)
      request.setRequestHeader('Content-Type', 'application/json')
    },
    url: 'https://api.github.com/user/repos?per_page=1000',
    success: (repos) => {
      // sort the repo
      repos = repos.sort((a, b) => a.full_name.localeCompare(b.full_name));

      // remove the repo you're currently on
      repos = repos.filter((item) => {
        return item.full_name !== currentRepo;
      })

      repos.forEach((repo) => {
        $('.repoDropdown').append('<li><a id="' + repo.name + '" class="repoItem" href="#">' + repo.full_name + '</a></li>')
        $('#' + repo.name).bind('click', () => { itemClick(repo.full_name) });
      });
    },
    error: (error) => {
      $(".repoButton").prop('disabled', true);
    }
  })
}

function itemClick(repo) {
  if (confirm('Are you sure you want to move this issue to another repository?')) {
    // get the issue JSON from Github API
    getGithubIssue(repo);
  }
}

function getGithubIssue(repo) {
  $.ajax({
    type: 'GET',
    beforeSend: (request) => {
      request.setRequestHeader("Authorization", "token " + token)
      request.setRequestHeader('Content-Type', 'application/json')
    },
    url: 'https://api.github.com/repos/' + organization + '/' + currentRepo + '/issues/' + issueNumber,
    success: (issue) => {
      // build new issue
      var newIssue = {
        title: issue.title,
        body: 'From ' + currentRepo + ': ' + organization + '/' + currentRepo + '#' + issueNumber + "  \n\n" + issue.body,
        milestone: issue.milestone,
        labels: issue.labels,
        assignees: issue.assignees
      }

      createGithubIssue(newIssue, repo, issue);
    },
    error: (error) => {
      console.log(error);
    }
  })
}

// create the cloned GitHub issue
function createGithubIssue(newIssue, repo, oldIssue) {
  $.ajax({
    type: 'POST',
    beforeSend: (request) => {
      request.setRequestHeader("Authorization", "token " + token)
      request.setRequestHeader('Content-Type', 'application/json')
    },
    data: JSON.stringify(newIssue),
    url: 'https://api.github.com/repos/' + repo + '/issues',
    success: (response) => {
      // add a comment to the closed issue
      commentOnIssue(organization, repo);

      // if success, close the existing issue and open new in a new tab
      closeGithubIssue(oldIssue);
      window.open('https://github.com/' + repo + '/issues/' + response.number, "_blank");
    },
    error: (error) => {
      console.log(error);
    }
  })
}

function closeGithubIssue(oldIssue) {
  var issueToClose = {
    state: 'closed'
  };

  $.ajax({
    type: 'PATCH',
    beforeSend: (request) => {
      request.setRequestHeader("Authorization", "token " + token)
      request.setRequestHeader('Content-Type', 'application/json')
    },
    data: JSON.stringify(issueToClose),
    url: 'https://api.github.com/repos/' + organization + '/' + currentRepo + '/issues/' + issueNumber,
    success: (response) => {
    },
    error: (error) => {
      console.log(error);
    }
  })
}

function commentOnIssue(org, repo) {
  var comment = {
    body: 'Issue closed and cloned to ' + org + '/' + repo
  };

  $.ajax({
    type: 'POST',
    beforeSend: (request) => {
      request.setRequestHeader("Authorization", "token " + token)
      request.setRequestHeader('Content-Type', 'application/json')
    },
    data: JSON.stringify(comment),
    url: 'https://api.github.com/repos/' + currentRepo + '/issues/' + issueNumber + '/comments',
    success: (response) => {
    },
    error: (error) => {
      console.log(error);
    }
  })
}