chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    chrome.tabs.executeScript(null, { file: "jquery/jquery-3.2.0.min.js", runAt: 'document_end' }, (j) => {
        chrome.tabs.executeScript(null, { file: 'bootstrap/js/bootstrap.min.js', runAt: 'document_end' }, (b) => {
            chrome.tabs.executeScript(null, { file: "app.js", runAt: 'document_end' }, (a) => {
                chrome.tabs.insertCSS(null, { file: "css/style.css", runAt: 'document_end' });
            });
        })
    });
})