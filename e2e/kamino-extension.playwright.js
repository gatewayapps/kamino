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
const githubOrigin = 'https://github.com'
const githubApiOrigin = 'https://api.github.com'
const enterpriseOrigin = 'https://github.mycompany.com'
const enterpriseApiOrigin = `${enterpriseOrigin}/api/v3`
const nonGithubOrigin = 'https://example.com'

const repos = [
  { full_name: 'gatewayapps/kamino' },
  { full_name: 'gatewayapps/target-repo' },
]

const sourceIssueBody = ['## Template', '', '- [ ] Step one', '- [ ] Step two'].join('\n')

const issues = [
  {
    body: sourceIssueBody,
    created_at: '2026-01-01T00:00:00Z',
    html_url: `${githubOrigin}/gatewayapps/kamino/issues/123`,
    labels: [],
    number: 123,
    pull_request: undefined,
    title: 'Issue 123',
    user: {
      html_url: `${githubOrigin}/octocat`,
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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function installApiMocks(context, apiOrigin) {
  await context.route(`${apiOrigin}/repos/**`, (route) => jsonResponse(route, {}))
  await context.route(`${apiOrigin}/user/repos?**`, (route) => jsonResponse(route, repos))
  await context.route(new RegExp(`${escapeRegex(apiOrigin)}/repos/gatewayapps/kamino/issues\\?.*`), (route) =>
    jsonResponse(route, issues)
  )
  await context.route(
    new RegExp(`${escapeRegex(apiOrigin)}/repos/gatewayapps/kamino/issues/123(?:\\?.*)?$`),
    (route) => jsonResponse(route, issues[0])
  )
}

async function installGithubPageMocks(context, githubOrigin) {
  await context.route(`${githubOrigin}/**`, (route) => {
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

async function installMocks(context) {
  await installGithubPageMocks(context, githubOrigin)
  await installGithubPageMocks(context, enterpriseOrigin)
  await installGithubPageMocks(context, nonGithubOrigin)
  await installApiMocks(context, githubApiOrigin)
  await installApiMocks(context, enterpriseApiOrigin)
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

async function openMockRepoPage(page, origin = githubOrigin) {
  await page.goto(`${origin}/gatewayapps/kamino`)
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

async function setExtensionStorage(context, values) {
  const serviceWorker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'))

  await serviceWorker.evaluate((values) => {
    return new Promise((resolve) => {
      chrome.storage.sync.set(values, resolve)
    })
  }, values)
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

    await page.goto(`${githubOrigin}/gatewayapps/kamino/issues/123`)
    await page.bringToFront()
    await injectKaminoContentScripts(context, page.url(), appContentScriptFiles)

    await expect(page.locator('.sidebar-kamino')).toBeVisible()
    await expect(page.locator('.batchButton')).toHaveCount(0)
  })

  test('does not render on non-github hosts with github-like issue paths', async ({}, testInfo) => {
    context = await launchExtension(testInfo)
    page = await context.newPage()

    await page.goto(`${nonGithubOrigin}/gatewayapps/kamino/issues/123`)
    await page.bringToFront()
    await injectKaminoContentScripts(context, page.url(), appContentScriptFiles)

    await expect(page.locator('.sidebar-kamino')).toHaveCount(0)
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

  test('shows batch cloning on github enterprise issue lists', async ({}, testInfo) => {
    context = await launchExtension(testInfo)
    page = await context.newPage()

    await openMockRepoPage(page, enterpriseOrigin)
    await softNavigate(page, '/gatewayapps/kamino/issues?q=is%3Aclosed+is%3Aissue')

    await expect(page.locator('.batchButton')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Batch Clone' })).toBeEnabled()
  })

  test('preserves source markdown when source attribution and blockquotes are disabled', async ({}, testInfo) => {
    context = await launchExtension(testInfo)

    await setExtensionStorage(context, {
      addBlockquote: false,
      cloneComments: false,
      createTab: false,
      disableCommentsOnOriginal: true,
      githubToken: 'token',
      mostUsed: ['gatewayapps/target-repo'],
    })

    let resolveCreateIssueRequest
    const createIssueRequest = new Promise((resolve) => {
      resolveCreateIssueRequest = resolve
    })
    await context.route(`${githubApiOrigin}/repos/gatewayapps/target-repo/issues`, async (route) => {
      if (route.request().method() === 'POST') {
        const createIssuePayload = route.request().postDataJSON()
        resolveCreateIssueRequest(createIssuePayload)

        await jsonResponse(route, {
          html_url: `${githubOrigin}/gatewayapps/target-repo/issues/456`,
          number: 456,
        })
        return
      }

      await jsonResponse(route, {})
    })

    page = await context.newPage()
    await page.goto(`${githubOrigin}/gatewayapps/kamino/issues/123`)
    await page.bringToFront()
    await injectKaminoContentScripts(context, page.url(), appContentScriptFiles)

    await expect(page.locator('.quickClone[data-repo="gatewayapps/target-repo"]')).toBeVisible()
    await page.locator('.quickClone').click()
    await page.locator('.cloneAndKeepOpen').click()

    const createIssuePayload = await createIssueRequest

    expect(createIssuePayload.body).toBe(sourceIssueBody)
  })

  test('uses the enterprise api when cloning enterprise issues', async ({}, testInfo) => {
    context = await launchExtension(testInfo)

    await setExtensionStorage(context, {
      addBlockquote: false,
      cloneComments: false,
      createTab: false,
      disableCommentsOnOriginal: true,
      githubToken: 'token',
      mostUsed: ['gatewayapps/target-repo'],
    })

    let resolveCreateIssueRequest
    const createIssueRequest = new Promise((resolve) => {
      resolveCreateIssueRequest = resolve
    })
    await context.route(`${enterpriseApiOrigin}/repos/gatewayapps/target-repo/issues`, async (route) => {
      if (route.request().method() === 'POST') {
        const createIssuePayload = route.request().postDataJSON()
        resolveCreateIssueRequest({ payload: createIssuePayload, url: route.request().url() })

        await jsonResponse(route, {
          html_url: `${enterpriseOrigin}/gatewayapps/target-repo/issues/456`,
          number: 456,
        })
        return
      }

      await jsonResponse(route, {})
    })

    page = await context.newPage()
    await page.goto(`${enterpriseOrigin}/gatewayapps/kamino/issues/123`)
    await page.bringToFront()
    await injectKaminoContentScripts(context, page.url(), appContentScriptFiles)

    await expect(page.locator('.quickClone[data-repo="gatewayapps/target-repo"]')).toBeVisible()
    await page.locator('.quickClone').click()
    await page.locator('.cloneAndKeepOpen').click()

    const createIssuePayload = await createIssueRequest

    expect(createIssuePayload.url).toBe(`${enterpriseApiOrigin}/repos/gatewayapps/target-repo/issues`)
    expect(createIssuePayload.payload.body).toBe(sourceIssueBody)
  })
})
