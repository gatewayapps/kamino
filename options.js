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

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    githubToken: ''
  }, function(items) {
    document.getElementById('github-pat').value = items.githubToken;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveButton').addEventListener('click',
    save_options);