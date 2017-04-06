# Kamino - The Github issue cloning tool
Kamino is a Chrome(and hopefully soon to be Edge) Extension that creates a button on Github issue pages. This button can be used to clone an issue to any other repository in which you, the user, are a contributor or member.

## How do I use it?
In your Google Chrome browser, simply look for Kamino in the Chrome Extensions store and install. Once the extension is installed, go to `chrome://extensions` and click the `Options` link to enter your Github Personal Access Token(PAT). When creating your PAT, make sure to check the following:
- `repo - all`
- `admin:org - read:org`
- `user - read:user`
- `user - read:email`

If you don't know how to create a PAT or need help, check out Creating a token section [here](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)

Once you have your PAT, enter it on the Options screen for Kamino and click `Save`. After that is done, go to any Github issue page in which you are a member and you should see a button labeled `Clone issue to`.

Clicking this button will display a dropdown list of repos. Selecting a repo will ask for confirmation about cloning the issue. If you then click `Okay`, the issue will be cloned to the new repository and the original issue will be closed. Simple as that!

### How does it work?
Kamino leverages the Github API to gather information about the issue you are on. Kamino uses a Chrome Extension utilizing content scripts to create a button on specific web pages.

### Wait a minute, something's not working! Or I'd like to leave feedback
If you find an issue, feel free to create an issue here. If you think of a way Kamino can be enhanced, also create an issue outlining your feature.
