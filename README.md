# Kamino - The Github issue cloning tool
Kamino is a Chrome(and hopefully soon to be Edge) Extension that creates a button on Github issue pages. This button can be used to clone an issue to any other repository in which you, the user, are a contributor or member.

## How do I use it?
In your Google Chrome browser, simply look for Kamino in the Chrome Extensions store and install. Once the extension is installed, go to `chrome://extensions` and click the `Options` link to enter your Github Personal Access Token(PAT). When creating your PAT, make sure to check the following:
- `repo - all`

If you don't know how to create a PAT or need help, check out Creating a token section [here](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)

Once you have your PAT, enter it on the Options screen for Kamino and click `Save`. After that is done, go to any Github issue page in which you are a member and you should see a button labeled `Clone issue to`.

# Features

## Normal operations
Clicking this button will display a dropdown list of repos. Selecting a repo will ask for confirmation about cloning the issue. If you then click `Yes`, the issue will be cloned to the new repository and the original issue will be closed.

## Last used
Kamino will remember the last 5 repositories you cloned to so that it will be easy for you to find. If you are someone that is a member of a lot of repos, this should be very handy!

## Quick clone
Kamino now supports a quick clone feature. The last repository you cloned to will be shown on a button next to the dropdown. Rather than having to pick the item from the repo list, you can simply click the button to clone to your last used repository!

### How does it work?
Kamino leverages the Github API to gather information about the issue you are on. Kamino uses a Chrome Extension utilizing content scripts to create a button on specific web pages.

### Wait a minute, something's not working! Or I'd like to leave feedback
If you find an issue, feel free to create an issue here. If you think of a way Kamino can be enhanced, also create an issue outlining your feature.

### Privacy stuff
Outside of the use of your Personal Access Token used by Kamino to perform its core function, we do not have the ability to view or retrieve your token. We do not transmit any information stored by Kamino and it is all stored via the `chrome.storage` object provided by Google in the development of Chrome extensions. We do not collect or track any personal information such as addresses, IP address, name, emails, credit card numbers, etc... Any analytics package that may be installed will only be used to track number of uses as well as the way Kamino is being used. Any analytics package will NOT store or track repo names, tokens, issue numbers or names or anything else related to the Github data used by Kamino.
