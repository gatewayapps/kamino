// Saves options to chrome.storage
function save_options() {
  var token = document.getElementById('github-pat').value;
  var goToList = document.getElementById('go-to-issue-list').checked;
  var createTab = document.getElementById('create-tab').checked;

  chrome.storage.sync.set({
    githubToken: token,
    goToList: goToList,
    createTab: createTab
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Settings saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function paypal_donate() {
  window.open('https://www.paypal.me/johnmurphy01', '_blank');
}

// Restores options
function restore_options() {
  chrome.storage.sync.get({
    githubToken: '',
    goToList: false,
    createTab: true
  }, function(items) {
    document.getElementById('github-pat').value = items.githubToken;
    document.getElementById('go-to-issue-list').checked = items.goToList;
    document.getElementById('create-tab').checked = items.createTab;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveButton').addEventListener('click',
    save_options);
document.getElementById('paypal-button').addEventListener('click',
    paypal_donate);