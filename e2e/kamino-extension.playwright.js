const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const { chromium, expect, test } = require('@playwright/test')

const extensionPath = path.resolve(__dirname, '..')

const contentScriptFiles = [
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
]

const appContentScriptFiles = contentScriptFiles.filter((file) => file !== 'batch.js')

const repos = [
  { full_name: 'gatewayapps/kamino' },
  { full_name: 'gatewayapps/target-repo' },
]

const issues = [
  {
    body: 'Issue body',
    created_at: '2026-01-01T00:00:00Z',
    html_url: 'https://github.com/gatewayapps/kamino/issues/123',
    labels: [],
    number: 123,
    pull_request: undefined,
    title: 'Issue 123',
    user: {
      html_url: 'https://github.com/octocat',
      id: 583231,
      login: 'octocat',
    },
  },
]

function githubPageHtml({ includeIssueSidebar = false, includeIssueToolbar = true } = {}) {
  return `<!doctype html>
    <html>
      <head><title>Mock GitHub</title></head>
      <body>
        <main>
          ${includeIssueToolbar ? '<div id="filters-select-menu"></div><div data-testid="issue-pr-toolbar"></div>' : ''}
          ${includeIssueSidebar ? '<div class="sidebar-assignee"></div>' : ''}
        </main>
      </body>
    </html>`
}

async function jsonResponse(route, body) {
  await route.fulfill({
    contentType: 'application/json',
    headers: {
      Link: '',
    },
    json: body,
  })
}

async function installMocks(context) {
  await context.route('https://api.github.com/user/repos?**', (route) => jsonResponse(route, repos))
  await context.route('https://api.github.com/repos/gatewayapps/kamino/issues?**', (route) => jsonResponse(route, issues))
  await context.route('https://api.github.com/repos/gatewayapps/kamino/issues/123', (route) => jsonResponse(route, issues[0]))
  await context.route('https://api.github.com/repos/**', (route) => jsonResponse(route, {}))

  await context.route('https://github.com/**', (route) => {
    const url = new URL(route.request().url())
    const isIssueDetail = url.pathname === '/gatewayapps/kamino/issues/123'

    return route.fulfill({
      contentType: 'text/html',
      body: githubPageHtml({
        includeIssueSidebar: isIssueDetail,
        includeIssueToolbar: !isIssueDetail,
      }),
    })
  })
}

async function launchExtension(testInfo) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `kamino-${testInfo.testId}-`))
  const launchOptions = {
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      '--disable-crash-reporter',
      '--disable-crashpad',
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  }

  if (process.env.KAMINO_E2E_CHANNEL) {
    launchOptions.channel = process.env.KAMINO_E2E_CHANNEL
  }

  const context = await chromium.launchPersistentContext(userDataDir, launchOptions)
  context.kaminoUserDataDir = userDataDir

  await installMocks(context)

  return context
}

async function openMockRepoPage(page) {
  await page.goto('https://github.com/gatewayapps/kamino')
}

async function softNavigate(page, path, bodyHtml) {
  await page.evaluate(
    ({ bodyHtml, path }) => {
      if (bodyHtml) {
        document.body.innerHTML = bodyHtml
      }

      history.pushState({}, '', path)
    },
    { bodyHtml, path }
  )
}

async function injectKaminoContentScripts(context, targetUrl, files = contentScriptFiles) {
  const serviceWorker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'))

  await serviceWorker.evaluate(async ({ files, targetUrl }) => {
    const tabs = await chrome.tabs.query({})
    const tab = tabs.find((candidate) => candidate.url === targetUrl) || tabs.find((candidate) => candidate.active)

    await chrome.scripting.executeScript({
      files,
      target: { tabId: tab.id },
    })
    await chrome.scripting.insertCSS({
      files: ['./css/style.css'],
      target: { tabId: tab.id },
    })
  }, { files, targetUrl })
}

test.describe('Kamino extension smoke tests', () => {
  let context
  let page

  test.afterEach(async () => {
    const userDataDir = context?.kaminoUserDataDir
    await context?.close()

    if (userDataDir) {
      fs.rmSync(userDataDir, { force: true, recursive: true })
    }
  })

  test('shows batch cloning on filtered issue lists', async ({}, testInfo) => {
    context = await launchExtension(testInfo)
    page = await context.newPage()

    await openMockRepoPage(page)
    await softNavigate(page, '/gatewayapps/kamino/issues?q=is%3Aclosed+is%3Aissue')

    await expect(page.locator('.batchButton')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Batch Clone' })).toBeEnabled()
  })

  test('shows issue cloning on issue detail pages only', async ({}, testInfo) => {
    context = await launchExtension(testInfo)
    page = await context.newPage()

    await page.goto('https://github.com/gatewayapps/kamino/issues/123')
    await page.bringToFront()
    await injectKaminoContentScripts(context, page.url(), appContentScriptFiles)

    await expect(page.locator('.sidebar-kamino')).toBeVisible()
    await expect(page.locator('.batchButton')).toHaveCount(0)
  })

  test('recovers batch cloning after GitHub redraws the issue toolbar', async ({}, testInfo) => {
    context = await launchExtension(testInfo)
    page = await context.newPage()

    await openMockRepoPage(page)
    await expect(page.locator('.batchButton')).toHaveCount(0)

    await softNavigate(page, '/gatewayapps/kamino/issues?q=is%3Aopen+is%3Aissue')

    await expect(page.locator('.batchButton')).toBeVisible()

    await page.locator('.batchButton').evaluate((element) => element.remove())
    await page.locator('#batchModal').evaluate((element) => element.remove())

    await expect(page.locator('.batchButton')).toBeVisible()
  })
})
