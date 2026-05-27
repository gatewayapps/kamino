if (typeof importScripts === 'function') {
  importScripts('lib/populateUrlMetadata.js')
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true }
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions)
  return tab
}

function canRunKaminoOnUrl(url) {
  if (!url) {
    return false
  }

  return !populateUrlMetadata(url).error
}

function getGithubOrigin(request) {
  return request.githubOrigin || 'https://github.com'
}

// used when Github uses push state.
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0 || !canRunKaminoOnUrl(details.url)) {
    return
  }

  try {
    chrome.scripting.executeScript({
      files: [
        'jquery/jquery-3.6.0.min.js',
        'handlebars.runtime.min-v4.7.7.js',
        'template.js',
        'lib/populateUrlMetadata.js',
        'lib/createFilters.js',
        'lib/addBlockQuote.js',
        'lib/preventReferences.js',
        'lib/preventMentions.js',
        'batch.js',
        'app.js',
      ],
      target: { tabId: details.tabId },
    })
    chrome.scripting.insertCSS({ files: ['./css/style.css'], target: { tabId: details.tabId } })
  } catch (ex) {
    console.error(ex)
  }
})

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'installed') {
    chrome.tabs.create({ url: 'https://github.com/gatewayapps/kamino' }, () => {
      console.log('Kamino Github page launched')
    })
  }
})

chrome.runtime.onMessage.addListener((request) => {
  if (request.action && request.action === 'goToOptions') {
    chrome.tabs.create({ url: `chrome-extension://${chrome.runtime.id}/options.html`, selected: true })
  } else {
    const githubOrigin = getGithubOrigin(request)

    chrome.storage.sync.get(
      {
        goToList: false,
        createTab: true,
        filters: '',
      },
      async (item) => {
        if (item.goToList) {
          const tabQuery = { currentWindow: true, active: true }
          const tabs = await chrome.tabs.query(tabQuery)
          const filterList = typeof item.filters === 'string' ? [] : item.filters

          var f = filterList.filter((i) => {
            return (
              (i.githubOrigin || 'https://github.com') === githubOrigin &&
              i.organization === request.organization &&
              i.currentRepo === request.oldRepo
            )
          })

          var filter = {
            filter: '',
          }
          if (f && f.length > 0) {
            filter = f[0]
          }

          setTimeout(async () => {
            if (item.createTab) {
              await chrome.tabs.create({
                url: `${githubOrigin}/${request.repo}/issues/${request.issueNumber}`,
                selected: false,
              })
            }
            await chrome.tabs.update(tabs[0].id, {
              url: `${githubOrigin}/${request.organization}/${request.oldRepo}${filter.filter}`,
              selected: true,
            })
          }, 1000)
        } else {
          if (item.createTab) {
            setTimeout(async () => {
              await chrome.tabs.create({
                url: `${githubOrigin}/${request.repo}/issues/${request.issueNumber}`,
                selected: true,
              })
            }, 1000)
          }
        }
      }
    )
  }
})
