# Kamino - The GitHub issue cloning tool

[![All Contributors](https://img.shields.io/badge/all_contributors-15-orange.svg?style=flat-square)](#contributors)

Kamino is a Chrome and Edge Extension that creates a button on GitHub issue pages. This button can be used to clone an issue to any other repository in which you, the user, are a contributor or member.

## How do I use it?

In your Google Chrome browser, simply look for Kamino in the Chrome Extensions store and install. Once the extension is installed, go to `chrome://extensions` and click the `Options` link to enter your GitHub Personal Access Token(PAT). When creating your PAT, make sure to check the following:

- `repo - all`

If you don't know how to create a PAT or need help, check out Creating a token section [here](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)

Once you have your PAT, enter it on the Options screen for Kamino and click `Save`. After that is done, go to any GitHub issue page in which you are a member and you should see a button labeled `Clone to`.

# Features

## Settings

- `Go to original repo's issue list after cloning` will navigate to the issue list for the repo from which the cloning was done
- `Create tab for cloned issue` will open a new tab and navigate to the newly cloned issue
- `Copy comments when cloning issue` will copy all comments when the issue is cloned
- `Disable Kamino automatic comments on original issue` will disable automatic comments on the original issue by Kamino

## Normal operations

Clicking this button will display a dropdown list of repos. Selecting a repo will ask you to perform one of the following actions:

- `Clone and Close` will clone the issue and automatically close the original issue
- `Just Clone` will clone the issue and keep the original issue open. This is useful if you've got shared code bases across repos and the issue is similar or the same across repos.
- `Nevermind` will close the modal and no action will be performed

## Last used

Kamino will remember the last 5 repositories you cloned to so that it will be easy for you to find. If you are someone that is a member of a lot of repos, this should be very handy!

## Quick clone

Kamino now supports a quick clone feature. The last repository you cloned to will be shown on a button next to the dropdown. Rather than having to pick the item from the repo list, you can simply click the button to clone to your last used repository!

## Search a Repository

For those who have a large number of repositories, Kamino has now introduced a search feature. This can be used to filter the list of repositories quickly. Thanks to [@CamSoper](https://github.com/CamSoper) for the request!

### How does it work?

Kamino leverages the GitHub API to gather information about the issue you are on. Kamino is a chrome extension utilizing content scripts to create a button on specific web pages, specifically GitHub issue pages.

### Wait a minute, something's not working! Or I'd like to leave feedback

If you find an issue, feel free to create an issue here. If you think of a way Kamino can be enhanced, also create an issue outlining your feature.

### Privacy stuff

Outside of the use of your Personal Access Token used by Kamino to perform its core function, we do not have the ability to view or retrieve your token. We do not transmit any information stored by Kamino and it is all stored via the `chrome.storage` object provided by Google in the development of Chrome extensions. We do not collect or track any personal information such as addresses, IP address, name, emails, credit card numbers, etc... Any analytics package that may be installed will only be used to track number of uses as well as the way Kamino is being used. Any analytics package will NOT store or track repo names, tokens, issue numbers or names or anything else related to the GitHub data used by Kamino.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/johnmurphy01"><img src="https://avatars2.githubusercontent.com/u/2939548?v=4?s=100" width="100px;" alt=""/><br /><sub><b>John Murphy</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/commits?author=johnmurphy01" title="Code">💻</a> <a href="#design-johnmurphy01" title="Design">🎨</a> <a href="https://github.com/gatewayapps/kamino/commits?author=johnmurphy01" title="Documentation">📖</a> <a href="#ideas-johnmurphy01" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-johnmurphy01" title="Maintenance">🚧</a> <a href="#projectManagement-johnmurphy01" title="Project Management">📆</a></td>
    <td align="center"><a href="https://github.com/danielgary"><img src="https://avatars2.githubusercontent.com/u/5438098?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Daniel Gary</b></sub></a><br /><a href="#ideas-danielgary" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/gatewayapps/kamino/commits?author=danielgary" title="Code">💻</a> <a href="https://github.com/gatewayapps/kamino/issues?q=author%3Adanielgary" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://www.linkedin.com/in/mossadeqzia"><img src="https://avatars3.githubusercontent.com/u/3779697?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mossadeq Zia</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/issues?q=author%3Amzia" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/demianmnave"><img src="https://avatars3.githubusercontent.com/u/1405982?v=4?s=100" width="100px;" alt=""/><br /><sub><b>demianmnave</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/issues?q=author%3Ademianmnave" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/eswsalesapgcgemea"><img src="https://avatars3.githubusercontent.com/u/37366579?v=4?s=100" width="100px;" alt=""/><br /><sub><b>eswsalesapgcgemea</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/issues?q=author%3Aeswsalesapgcgemea" title="Bug reports">🐛</a> <a href="#ideas-eswsalesapgcgemea" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://about.me/camthegeek"><img src="https://avatars0.githubusercontent.com/u/137648?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Cam Soper</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/issues?q=author%3ACamSoper" title="Bug reports">🐛</a> <a href="#ideas-CamSoper" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/adamperlin"><img src="https://avatars3.githubusercontent.com/u/10533886?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Adam Perlin</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/commits?author=adamperlin" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://hazelnotes.org"><img src="https://avatars1.githubusercontent.com/u/158141?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ryan Betts</b></sub></a><br /><a href="#ideas-rbetts" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://jamieW.io"><img src="https://avatars2.githubusercontent.com/u/30516128?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jamie Woodmancy</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/commits?author=jamie29w" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/eragon512"><img src="https://avatars2.githubusercontent.com/u/9765685?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Anirud Samala</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/commits?author=eragon512" title="Code">💻</a></td>
    <td align="center"><a href="http://www.paulvogel.me"><img src="https://avatars3.githubusercontent.com/u/4786628?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Paul Vogel</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/issues?q=author%3Apavog" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/justinneff"><img src="https://avatars3.githubusercontent.com/u/8649832?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Justin Neff</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/pulls?q=is%3Apr+reviewed-by%3Ajustinneff" title="Reviewed Pull Requests">👀</a> <a href="#ideas-justinneff" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/mcnewbk"><img src="https://avatars1.githubusercontent.com/u/4582269?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brandon McNew</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/pulls?q=is%3Apr+reviewed-by%3Amcnewbk" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://www.linkedin.com/in/juliawillson/"><img src="https://avatars2.githubusercontent.com/u/1253399?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Julia</b></sub></a><br /><a href="#ideas-fuzzyweapon" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://schouten-lebbing.nl"><img src="https://avatars2.githubusercontent.com/u/7613738?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kjeld Schouten</b></sub></a><br /><a href="#ideas-Ornias1993" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/SteffanoP"><img src="https://avatars1.githubusercontent.com/u/26782009?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Steffano Pereira</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/issues?q=author%3ASteffanoP" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://www.linkedin.com/in/emfinger"><img src="https://avatars0.githubusercontent.com/u/213467?v=4?s=100" width="100px;" alt=""/><br /><sub><b>William Emfinger</b></sub></a><br /><a href="#ideas-finger563" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/jmah-cc"><img src="https://avatars2.githubusercontent.com/u/57732952?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jay Mahendru</b></sub></a><br /><a href="#ideas-jmah-cc" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/sjsaha"><img src="https://avatars0.githubusercontent.com/u/7125423?v=4?s=100" width="100px;" alt=""/><br /><sub><b>sjsaha</b></sub></a><br /><a href="#ideas-sjsaha" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/knutwannheden"><img src="https://avatars3.githubusercontent.com/u/408765?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Knut Wannheden</b></sub></a><br /><a href="#ideas-knutwannheden" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/jlczuk"><img src="https://avatars2.githubusercontent.com/u/8922067?v=4?s=100" width="100px;" alt=""/><br /><sub><b>John L. Czukkermann</b></sub></a><br /><a href="#ideas-jlczuk" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://www.marcoagerosa.com"><img src="https://avatars0.githubusercontent.com/u/1161086?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Marco Aurelio Gerosa</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/commits?author=marcogerosa" title="Documentation">📖</a></td>
    <td align="center"><a href="https://fred.dev"><img src="https://avatars3.githubusercontent.com/u/1170989?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Frédéric Harper</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/issues?q=author%3Afharper" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://maciejwalkowiak.com"><img src="https://avatars.githubusercontent.com/u/1357927?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Maciej Walkowiak</b></sub></a><br /><a href="https://github.com/gatewayapps/kamino/commits?author=maciejwalkowiak" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
