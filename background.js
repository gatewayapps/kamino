async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true }
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions)
  return tab
}

// used when Github uses push state.
chrome.webNavigation.onHistoryStateUpdated.addListener(async () => {
  const tab = await getCurrentTab()

  try {
    chrome.scripting.executeScript({
      files: ['jquery/jquery-3.6.0.min.js', 'handlebars.runtime.min-v4.7.7.js', 'template.js', 'app.js'],
      target: { tabId: tab.id },
    })
    chrome.scripting.insertCSS({ files: ['./css/style.css'], target: { tabId: tab.id } })
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
    chrome.storage.sync.get(
      {
        goToList: false,
        createTab: true,
        filters: '',
      },
      (item) => {
        if (item.goToList) {
          chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
            const filterList = typeof item.filters === 'string' ? [] : item.filters

            var f = filterList.filter((i) => {
              return i.organization === request.organization && i.currentRepo === request.oldRepo
            })

            var filter = {
              filter: '',
            }
            if (f && f.length > 0) {
              filter = f[0]
            }

            setTimeout(() => {
              if (item.createTab) {
                chrome.tabs.create({
                  url: `https://github.com/${request.repo}/issues/${request.issueNumber}`,
                  selected: false,
                })
              }
              chrome.tabs.update(tabs[0].id, {
                url: `https://github.com/${request.organization}/${request.oldRepo}${filter.filter}`,
                selected: true,
              })
            }, 1000)
          })
        } else {
          if (item.createTab) {
            setTimeout(() => {
              chrome.tabs.create({
                url: `https://github.com/${request.repo}/issues/${request.issueNumber}`,
                selected: true,
              })
            }, 1000)
          }
        }
      }
    )
  }
})
