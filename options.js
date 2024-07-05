// Saves options to chrome.storage
function save_options() {
  const token = document.getElementById('github-pat').value
  const goToList = document.getElementById('go-to-issue-list').checked
  const createTab = document.getElementById('create-tab').checked
  const cloneComments = document.getElementById('clone-comments').checked
  const disableCommentsOnOriginal = document.getElementById('disable-comment-on-original').checked
  const preventReferences = document.getElementById('prevent-references').checked
  const preventMentions = document.getElementById('prevent-mentions').checked

  chrome.storage.sync.set(
    {
      githubToken: token,
      goToList,
      createTab,
      cloneComments,
      disableCommentsOnOriginal,
      preventReferences,
      preventMentions,
    },
    function () {
      // Update status to let user know options were saved.
      const status = document.getElementById('status')
      status.textContent = 'Settings saved.'
      setTimeout(function () {
        status.textContent = ''
      }, 750)
    }
  )
}

function paypal_donate() {
  window.open('https://www.paypal.me/johnmurphy01', '_blank')
}

// Restores options
function restore_options() {
  chrome.storage.sync.get(
    {
      githubToken: '',
      goToList: false,
      createTab: true,
      cloneComments: false,
      disableCommentsOnOriginal: false,
      preventReferences: false,
      preventMentions: false,
    },
    function (items) {
      document.getElementById('github-pat').value = items.githubToken
      document.getElementById('go-to-issue-list').checked = items.goToList
      document.getElementById('create-tab').checked = items.createTab
      document.getElementById('clone-comments').checked = items.cloneComments
      document.getElementById('disable-comment-on-original').checked = items.disableCommentsOnOriginal
      document.getElementById('prevent-references').checked = items.preventReferences
      document.getElementById('prevent-mentions').checked = items.preventMentions
    }
  )
}

document.addEventListener('DOMContentLoaded', restore_options)
document.getElementById('saveButton').addEventListener('click', save_options)
document.getElementById('paypal-button').addEventListener('click', paypal_donate)
