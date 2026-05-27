const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const manifest = require(path.join(rootDir, 'manifest.json'))

const tokenUrl = 'https://oauth2.googleapis.com/token'
const apiBaseUrl = 'https://chromewebstore.googleapis.com'

function stripQuotes(value) {
  const trimmed = value.trim()
  const quote = trimmed[0]

  if (
    (quote === '"' || quote === "'") &&
    trimmed[trimmed.length - 1] === quote
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

function loadDotEnv() {
  const dotEnvPath = path.join(rootDir, '.env')

  if (!fs.existsSync(dotEnvPath)) {
    return
  }

  const lines = fs.readFileSync(dotEnvPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const normalizedLine = trimmed.startsWith('export ')
      ? trimmed.slice('export '.length)
      : trimmed
    const separatorIndex = normalizedLine.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = normalizedLine.slice(0, separatorIndex).trim()
    const value = normalizedLine.slice(separatorIndex + 1)

    if (key && process.env[key] === undefined) {
      process.env[key] = stripQuotes(value)
    }
  }
}

function getEnv(...names) {
  for (const name of names) {
    if (process.env[name]) {
      return process.env[name]
    }
  }

  return undefined
}

function parseArgs(argv) {
  const options = {
    deployPercentage: undefined,
    dryRun: false,
    publish: false,
    skipReview: false,
    staged: false,
    zipPath: path.join(rootDir, 'dist', `kamino-v${manifest.version}.zip`),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--deploy-percentage') {
      options.deployPercentage = Number(argv[index + 1])
      index += 1
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--publish') {
      options.publish = true
    } else if (arg === '--skip-review') {
      options.skipReview = true
    } else if (arg === '--staged') {
      options.staged = true
    } else if (arg === '--zip') {
      options.zipPath = path.resolve(rootDir, argv[index + 1])
      index += 1
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (
    options.deployPercentage !== undefined &&
    (!Number.isInteger(options.deployPercentage) ||
      options.deployPercentage < 0 ||
      options.deployPercentage > 100)
  ) {
    throw new Error('--deploy-percentage must be an integer between 0 and 100')
  }

  if (options.skipReview && !options.publish) {
    throw new Error('--skip-review can only be used with --publish')
  }

  if (options.staged && !options.publish) {
    throw new Error('--staged can only be used with --publish')
  }

  return options
}

function getConfig({ required = true } = {}) {
  const config = {
    clientId: getEnv('CWS_CLIENT_ID', 'CHROME_WEB_STORE_CLIENT_ID'),
    clientSecret: getEnv('CWS_CLIENT_SECRET', 'CHROME_WEB_STORE_CLIENT_SECRET'),
    extensionId: getEnv('CWS_EXTENSION_ID', 'CHROME_WEB_STORE_EXTENSION_ID'),
    publisherId: getEnv('CWS_PUBLISHER_ID', 'CHROME_WEB_STORE_PUBLISHER_ID'),
    refreshToken: getEnv('CWS_REFRESH_TOKEN', 'CHROME_WEB_STORE_REFRESH_TOKEN'),
  }

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (required && missing.length > 0) {
    throw new Error(
      `Missing Chrome Web Store configuration: ${missing.join(', ')}`
    )
  }

  return config
}

async function readJsonResponse(response) {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function requestJson(url, options) {
  const response = await fetch(url, options)
  const body = await readJsonResponse(response)

  if (!response.ok) {
    const details = JSON.stringify(body, null, 2)
    throw new Error(`${response.status} ${response.statusText}\n${details}`)
  }

  return body
}

async function getAccessToken(config) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: config.refreshToken,
  })

  const response = await requestJson(tokenUrl, {
    body,
    method: 'POST',
  })

  if (!response.access_token) {
    throw new Error('Token response did not include an access_token')
  }

  return response.access_token
}

async function uploadPackage({ accessToken, config, zipPath }) {
  const uploadUrl = `${apiBaseUrl}/upload/v2/publishers/${config.publisherId}/items/${config.extensionId}:upload`
  const zipBuffer = fs.readFileSync(zipPath)

  return requestJson(uploadUrl, {
    body: zipBuffer,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/zip',
    },
    method: 'POST',
  })
}

async function fetchStatus({ accessToken, config }) {
  const statusUrl = `${apiBaseUrl}/v2/publishers/${config.publisherId}/items/${config.extensionId}:fetchStatus`

  return requestJson(statusUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'GET',
  })
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function waitForUpload({ accessToken, config }) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const status = await fetchStatus({ accessToken, config })
    if (status.uploadState !== 'UPLOAD_IN_PROGRESS') {
      return status
    }

    console.log(`Upload still processing; checking again in 5s (${attempt}/12)`)
    await wait(5000)
  }

  throw new Error('Upload was still processing after 60 seconds')
}

async function publishPackage({ accessToken, config, options }) {
  const publishUrl = `${apiBaseUrl}/v2/publishers/${config.publisherId}/items/${config.extensionId}:publish`
  const body = {}

  if (options.staged) {
    body.publishType = 'STAGED_PUBLISH'
  }

  if (options.skipReview) {
    body.skipReview = true
  }

  if (options.deployPercentage !== undefined) {
    body.deployInfos = [{ deployPercentage: options.deployPercentage }]
  }

  return requestJson(publishUrl, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
}

async function main() {
  loadDotEnv()

  const options = parseArgs(process.argv.slice(2))

  if (!fs.existsSync(options.zipPath)) {
    throw new Error(
      `Package not found: ${options.zipPath}\nRun "yarn build" first.`
    )
  }

  const config = getConfig({ required: !options.dryRun })
  const relativeZipPath = path.relative(rootDir, options.zipPath)

  console.log(`Chrome Web Store item: ${config.extensionId || '(not configured)'}`)
  console.log(`Package: ${relativeZipPath}`)

  if (options.dryRun) {
    console.log('Dry run complete; no upload was attempted.')
    return
  }

  const accessToken = await getAccessToken(config)
  const upload = await uploadPackage({
    accessToken,
    config,
    zipPath: options.zipPath,
  })

  console.log(`Upload state: ${upload.uploadState}`)
  if (upload.crxVersion) {
    console.log(`Uploaded version: ${upload.crxVersion}`)
  }

  const uploadStatus =
    upload.uploadState === 'UPLOAD_IN_PROGRESS'
      ? await waitForUpload({ accessToken, config })
      : upload

  if (
    uploadStatus.uploadState &&
    uploadStatus.uploadState !== 'UPLOAD_COMPLETE'
  ) {
    throw new Error(`Upload did not complete: ${uploadStatus.uploadState}`)
  }

  if (!options.publish) {
    console.log('Uploaded package. Publish was not requested.')
    return
  }

  const publish = await publishPackage({ accessToken, config, options })
  console.log(`Publish state: ${publish.state}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
