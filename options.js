// Saves options to chrome.storage
function save_options() {
  var token = document.getElementById('github-pat').value;
  chrome.storage.sync.set({
    githubToken: token
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
    githubToken: ''
  }, function(items) {
    document.getElementById('github-pat').value = items.githubToken;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveButton').addEventListener('click',
    save_options);