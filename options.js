// Saves options to chrome.storage
function save_options() {
  var token = document.getElementById('github-pat').value;
  var goToList = document.getElementById('go-to-issue-list').checked;

  chrome.storage.sync.set({
    githubToken: token,
    goToList: goToList
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Settings saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores options
function restore_options() {
  chrome.storage.sync.get({
    githubToken: '',
    goToList: false
  }, function(items) {
    document.getElementById('github-pat').value = items.githubToken;
    document.getElementById('go-to-issue-list').checked = items.goToList;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveButton').addEventListener('click',
    save_options);