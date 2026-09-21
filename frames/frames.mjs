// One character, then a start frame per model — all free on Google Flow.
// Nano Banana Pro images cost nothing, so iterate here before spending a credit on video.
//   node frames.mjs <API_TOKEN>
// Full walkthrough: https://useapi.net/docs/articles/sora-2-api-alternatives
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const TOKEN = process.argv[2]
if (!TOKEN) {
  console.error('usage: node frames.mjs <API_TOKEN>')
  console.error('get a token at https://useapi.net/docs/start-here/setup-useapi')
  process.exit(1)
}

const CFG = JSON.parse(readFileSync(join(HERE, 'prompts.json'), 'utf8'))
const OUT = join(HERE, 'output')
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
const H = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }

async function images(prompt, { reference, count = 4 } = {}) {
  const body = { email: CFG.account, model: 'nano-banana-pro', prompt, aspectRatio: '9:16', count }
  if (reference) body.reference_1 = reference
  const r = await fetch('https://api.useapi.net/v1/google-flow/images', {
    method: 'POST', headers: H, body: JSON.stringify(body),
  })
  const t = await r.text()
  if (r.status !== 200) throw new Error(`images ${r.status}: ${t.slice(0, 200)}`)
  return ((Array.isArray(JSON.parse(t)) ? JSON.parse(t)[0] : JSON.parse(t)).media || [])
    .map((m) => m.image.generatedImage)
}

const download = async (gi, name) => {
  const buf = gi.fifeUrl
    ? Buffer.from(await (await fetch(gi.fifeUrl)).arrayBuffer())
    : Buffer.from(gi.encodedImage, 'base64')
  writeFileSync(join(OUT, name), buf)
  return (buf.length / 1024).toFixed(0)
}

// 1. the character — pick one variant and reuse it everywhere
console.log('character (4 variants, free)')
const chars = await images(CFG.character)
for (let i = 0; i < chars.length; i++)
  console.log(`  character-${i + 1}.jpg  ${await download(chars[i], `character-${i + 1}.jpg`)} KB`)

const pick = Number(process.env.CHARACTER || 1) - 1
const reference = chars[pick].mediaGenerationId
writeFileSync(join(OUT, 'character.jpg'), readFileSync(join(OUT, `character-${pick + 1}.jpg`)))
console.log(`  using variant ${pick + 1} as the reference (set CHARACTER=n to change)`)

// 2. one start frame per model, same wording, only the sign changes
const ids = { character: reference }
for (const [key, sign] of Object.entries(CFG.signs)) {
  console.log(`\n${key} start frame — "${sign.text}", ${sign.colour} (4 variants, free)`)
  const prompt = CFG.frameTemplate
    .replace('{{TEXT}}', sign.text)
    .replace('{{COLOUR}}', sign.colour)
  const variants = await images(prompt, { reference })
  for (let i = 0; i < variants.length; i++)
    console.log(`  ${key}-${i + 1}.jpg  ${await download(variants[i], `${key}-${i + 1}.jpg`)} KB`)
  // default to variant 1 — review them and copy the best over <key>.jpg
  writeFileSync(join(OUT, `${key}.jpg`), readFileSync(join(OUT, `${key}-1.jpg`)))
  ids[key] = variants[0].mediaGenerationId
}

writeFileSync(join(OUT, 'ids.json'), JSON.stringify(ids, null, 2))
console.log('\nwrote output/ids.json — put the omni id into clips/prompts.json as startImage')
console.log('review the variants, then copy your pick over output/<model>.jpg before generating clips')
