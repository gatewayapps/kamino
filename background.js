// used when Github uses push state.
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    chrome.tabs.executeScript(null, { file: "jquery/jquery-3.2.0.min.js", runAt: 'document_end' }, (j) => {
        chrome.tabs.executeScript(null, { file: "app.js", runAt: 'document_end' }, (a) => {
            chrome.tabs.insertCSS(null, { file: "css/style.css", runAt: 'document_end' });
        });
    })
})

// open the Kamino Github page on installed
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'installed') {
        chrome.tabs.create({ url: 'https://github.com/gatewayapps/kamino' }, (tab) => {
            console.log("Kamino Github page launched")
        })
    }
})