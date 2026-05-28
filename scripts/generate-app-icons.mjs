import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const iconsDir = path.join(projectRoot, 'public', 'icons')
const background = '#050505'
const sourceCandidates = [
  'source-app-icon.png',
  'source-app-icon.jpg',
  'source-app-icon.jpeg',
  'source-app-icon.webp',
].map((filename) => path.join(iconsDir, filename))

const sourcePath = sourceCandidates.find((candidate) => existsSync(candidate))

if (!sourcePath) {
  console.warn(
    [
      '[icons] No source app icon found.',
      'Place a source image at public/icons/source-app-icon.png, .jpg, .jpeg, or .webp.',
      'Existing icons were left unchanged.',
    ].join(' '),
  )
  process.exit(0)
}

await mkdir(iconsDir, { recursive: true })

async function generateSquareIcon(filename, size, options = {}) {
  const outputPath = path.join(iconsDir, filename)
  let image = sharp(sourcePath).resize(size, size, {
    fit: 'cover',
    position: 'centre',
  })

  if (options.flatten) {
    image = image.flatten({ background })
  }

  await image.png().toFile(outputPath)
  console.log(`[icons] Generated ${path.relative(projectRoot, outputPath)}`)
}

async function generateMaskableIcon(filename, size) {
  const outputPath = path.join(iconsDir, filename)
  const innerSize = Math.round(size * 0.74)
  const artwork = await sharp(sourcePath)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: artwork, gravity: 'centre' }])
    .png()
    .toFile(outputPath)

  console.log(`[icons] Generated ${path.relative(projectRoot, outputPath)}`)
}

console.log(`[icons] Using source ${path.relative(projectRoot, sourcePath)}`)

await Promise.all([
  generateSquareIcon('icon-192.png', 192),
  generateSquareIcon('icon-512.png', 512),
  generateMaskableIcon('maskable-icon-192.png', 192),
  generateMaskableIcon('maskable-icon-512.png', 512),
  generateSquareIcon('apple-touch-icon.png', 180, { flatten: true }),
  generateSquareIcon('favicon-32.png', 32, { flatten: true }),
  generateSquareIcon('favicon-16.png', 16, { flatten: true }),
])

console.log('[icons] App icon generation complete.')
