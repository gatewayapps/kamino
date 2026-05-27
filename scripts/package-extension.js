const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const manifestPath = path.join(rootDir, 'manifest.json')

const includedFiles = [
  'app.js',
  'background.js',
  'batch.js',
  'handlebars.runtime.min-v4.7.7.js',
  'manifest.json',
  'options.html',
  'options.js',
  'template.js',
]

const includedDirectories = [
  'assets',
  'bootstrap',
  'css',
  'icons',
  'jquery',
  'lib',
  'templates',
]

const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i += 1) {
  let crc = i
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  }
  crcTable[i] = crc >>> 0
}

function getCrc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function getDosTimestamp(date = new Date('2024-01-01T00:00:00Z')) {
  const year = Math.max(date.getUTCFullYear(), 1980)
  const dosTime =
    (date.getUTCHours() << 11) |
    (date.getUTCMinutes() << 5) |
    Math.floor(date.getUTCSeconds() / 2)
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getUTCMonth() + 1) << 5) |
    date.getUTCDate()

  return { dosDate, dosTime }
}

function addUint16(buffer, value, offset) {
  buffer.writeUInt16LE(value, offset)
  return offset + 2
}

function addUint32(buffer, value, offset) {
  buffer.writeUInt32LE(value >>> 0, offset)
  return offset + 4
}

function walkDirectory(directory) {
  const entries = fs.readdirSync(path.join(rootDir, directory), {
    withFileTypes: true,
  })

  return entries.flatMap((entry) => {
    const relativePath = path.posix.join(directory, entry.name)
    const fullPath = path.join(rootDir, relativePath)

    if (entry.isDirectory()) {
      return walkDirectory(relativePath)
    }

    if (!entry.isFile()) {
      return []
    }

    return relativePath
  })
}

function getExtensionFiles() {
  const files = [
    ...includedFiles,
    ...includedDirectories.flatMap((directory) => walkDirectory(directory)),
  ]

  return [...new Set(files)].sort()
}

function validatePackageInputs(files) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (!manifest.manifest_version || !manifest.name || !manifest.version) {
    throw new Error('manifest.json must include manifest_version, name, and version')
  }

  const missingFiles = files.filter((file) => !fs.existsSync(path.join(rootDir, file)))
  if (missingFiles.length > 0) {
    throw new Error(`Missing package files:\n${missingFiles.join('\n')}`)
  }

  return manifest
}

function createZip(entries) {
  const localFileRecords = []
  const centralDirectoryRecords = []
  const { dosDate, dosTime } = getDosTimestamp()
  let offset = 0

  for (const entry of entries) {
    const filename = Buffer.from(entry.name)
    const data = entry.data
    const crc32 = getCrc32(data)

    const localHeader = Buffer.alloc(30 + filename.length)
    let localOffset = 0
    localOffset = addUint32(localHeader, 0x04034b50, localOffset)
    localOffset = addUint16(localHeader, 20, localOffset)
    localOffset = addUint16(localHeader, 0, localOffset)
    localOffset = addUint16(localHeader, 0, localOffset)
    localOffset = addUint16(localHeader, dosTime, localOffset)
    localOffset = addUint16(localHeader, dosDate, localOffset)
    localOffset = addUint32(localHeader, crc32, localOffset)
    localOffset = addUint32(localHeader, data.length, localOffset)
    localOffset = addUint32(localHeader, data.length, localOffset)
    localOffset = addUint16(localHeader, filename.length, localOffset)
    localOffset = addUint16(localHeader, 0, localOffset)
    filename.copy(localHeader, localOffset)

    localFileRecords.push(localHeader, data)

    const centralHeader = Buffer.alloc(46 + filename.length)
    let centralOffset = 0
    centralOffset = addUint32(centralHeader, 0x02014b50, centralOffset)
    centralOffset = addUint16(centralHeader, 20, centralOffset)
    centralOffset = addUint16(centralHeader, 20, centralOffset)
    centralOffset = addUint16(centralHeader, 0, centralOffset)
    centralOffset = addUint16(centralHeader, 0, centralOffset)
    centralOffset = addUint16(centralHeader, dosTime, centralOffset)
    centralOffset = addUint16(centralHeader, dosDate, centralOffset)
    centralOffset = addUint32(centralHeader, crc32, centralOffset)
    centralOffset = addUint32(centralHeader, data.length, centralOffset)
    centralOffset = addUint32(centralHeader, data.length, centralOffset)
    centralOffset = addUint16(centralHeader, filename.length, centralOffset)
    centralOffset = addUint16(centralHeader, 0, centralOffset)
    centralOffset = addUint16(centralHeader, 0, centralOffset)
    centralOffset = addUint16(centralHeader, 0, centralOffset)
    centralOffset = addUint16(centralHeader, 0, centralOffset)
    centralOffset = addUint32(centralHeader, 0, centralOffset)
    centralOffset = addUint32(centralHeader, offset, centralOffset)
    filename.copy(centralHeader, centralOffset)

    centralDirectoryRecords.push(centralHeader)
    offset += localHeader.length + data.length
  }

  const centralDirectory = Buffer.concat(centralDirectoryRecords)
  const endRecord = Buffer.alloc(22)
  let endOffset = 0
  endOffset = addUint32(endRecord, 0x06054b50, endOffset)
  endOffset = addUint16(endRecord, 0, endOffset)
  endOffset = addUint16(endRecord, 0, endOffset)
  endOffset = addUint16(endRecord, entries.length, endOffset)
  endOffset = addUint16(endRecord, entries.length, endOffset)
  endOffset = addUint32(endRecord, centralDirectory.length, endOffset)
  endOffset = addUint32(endRecord, offset, endOffset)
  addUint16(endRecord, 0, endOffset)

  return Buffer.concat([...localFileRecords, centralDirectory, endRecord])
}

function main() {
  const files = getExtensionFiles()
  const manifest = validatePackageInputs(files)
  const outputPath = path.join(distDir, `kamino-v${manifest.version}.zip`)
  const entries = files.map((file) => ({
    name: file,
    data: fs.readFileSync(path.join(rootDir, file)),
  }))

  fs.mkdirSync(distDir, { recursive: true })
  fs.writeFileSync(outputPath, createZip(entries))

  const size = fs.statSync(outputPath).size
  console.log(`Created ${path.relative(rootDir, outputPath)}`)
  console.log(`Packaged ${entries.length} files for Kamino ${manifest.version}`)
  console.log(`Size: ${Math.round(size / 1024)} KB`)
}

main()
