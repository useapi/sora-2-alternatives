// One shot, four Sora 2 replacements — Seedance 2.5, Omni 1.1 Flash, MiniMax H3, Kling v3.
// Each model generates the clip that names it. Prints the real cost per clip.
//   node clips.mjs <API_TOKEN> [model]
// Full walkthrough: https://useapi.net/docs/articles/sora-2-api-alternatives
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const TOKEN = process.argv[2]
const ONLY = process.argv[3]
if (!TOKEN) {
  console.error('usage: node clips.mjs <API_TOKEN> [seedance|omni|h3|kling]')
  console.error('get a token at https://useapi.net/docs/start-here/setup-useapi')
  process.exit(1)
}

const CFG = JSON.parse(readFileSync(join(HERE, 'prompts.json'), 'utf8'))
const OUT = join(HERE, 'output')
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
const H = { authorization: `Bearer ${TOKEN}` }
const JSONH = { ...H, 'content-type': 'application/json' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const save = async (url, name) => {
  const b = Buffer.from(await (await fetch(url)).arrayBuffer())
  writeFileSync(join(OUT, name), b)
  return (b.length / 1048576).toFixed(2)
}

// ---------------------------------------------------------------- PixVerse
// Seedance 2.5 and MiniMax H3. Both reject an `audio` field — native audio is
// always on — and both require `duration` and `quality`.
async function pixverse({ key, model, quality, duration, prompt, frame }) {
  const img = readFileSync(join(HERE, '..', 'frames', 'output', frame))
  const up = await fetch(
    `https://api.useapi.net/v2/pixverse/files/?email=${encodeURIComponent(CFG.accounts.pixverse)}`,
    { method: 'POST', headers: { ...H, 'content-type': 'image/jpeg' }, body: img })
  const path = (await up.json()).result?.[0]?.path
  if (!path) throw new Error(`${key}: upload failed`)

  const r = await fetch('https://api.useapi.net/v2/pixverse/videos/create-v4', {
    method: 'POST', headers: JSONH,
    body: JSON.stringify({ email: CFG.accounts.pixverse, model, prompt, duration, quality, first_frame_path: path }),
  })
  const created = await r.json()
  if (!created.video_id) throw new Error(`${key}: ${JSON.stringify(created).slice(0, 200)}`)
  console.log(`  ${key}: queued, ${created.cost_credits} credits`)

  for (let i = 0; i < 80; i++) {
    await sleep(15000)
    // NOTE: pass the id raw — PixVerse rejects the percent-encoded form with a 400
    const j = await (await fetch(`https://api.useapi.net/v2/pixverse/videos/${created.video_id}`, { headers: H })).json()
    if (j.video_status === 1 && j.output_width > 0 && j.url)
      return { credits: created.cost_credits, mb: await save(j.url, `${key}.mp4`) }
    if (j.video_status === 7 || j.video_status === 8) throw new Error(`${key}: generation failed`)
  }
  throw new Error(`${key}: timed out`)
}

// ------------------------------------------------------------- Google Flow
// Omni 1.1 Flash. aspectRatio defaults to `landscape` and the start frame does
// NOT override it, so portrait must be passed explicitly.
async function googleFlow({ key, duration, prompt, startImage }) {
  const r = await fetch('https://api.useapi.net/v1/google-flow/videos', {
    method: 'POST', headers: JSONH,
    body: JSON.stringify({
      email: CFG.accounts.googleFlow, model: 'omni-flash', prompt,
      startImage, duration, resolution: '720p', aspectRatio: 'portrait',
    }),
  })
  const created = await r.json()
  const jobId = (Array.isArray(created) ? created[0] : created).jobId
  if (!jobId) throw new Error(`${key}: ${JSON.stringify(created).slice(0, 200)}`)
  console.log(`  ${key}: queued`)

  for (let i = 0; i < 60; i++) {
    await sleep(15000)
    const t = await (await fetch(`https://api.useapi.net/v1/google-flow/jobs/${jobId}`, { headers: JSONH })).text()
    const status = (Array.isArray(JSON.parse(t)) ? JSON.parse(t)[0] : JSON.parse(t)).status
    if (status === 'completed') {
      const m = t.match(/https:\/\/flow-content\.google\/video\/[^"]+/)
      if (!m) throw new Error(`${key}: completed but no video url`)
      return { credits: CFG.models[key].credits, mb: await save(m[0].replace(/\\u0026/g, '&'), `${key}.mp4`) }
    }
    if (/fail|error/i.test(String(status))) throw new Error(`${key}: ${status}`)
  }
  throw new Error(`${key}: timed out`)
}

// -------------------------------------------------------------------- Kling
// v3 rejects aspect_ratio and derives it from the frame. Audio is on by default.
async function kling({ key, duration, prompt, frame }) {
  const img = readFileSync(join(HERE, '..', 'frames', 'output', frame))
  const up = await fetch(
    `https://api.useapi.net/v1/kling/assets/?email=${encodeURIComponent(CFG.accounts.kling)}`,
    { method: 'POST', headers: { ...H, 'content-type': 'image/jpeg' }, body: img })
  const imageUrl = (await up.json()).url
  if (!imageUrl) throw new Error(`${key}: upload failed`)

  const r = await fetch('https://api.useapi.net/v1/kling/videos/image2video-frames', {
    method: 'POST', headers: JSONH,
    body: JSON.stringify({
      email: CFG.accounts.kling, image: imageUrl, prompt,
      model_name: 'kling-v3-0', duration, mode: 'pro',
    }),
  })
  const created = await r.json()
  const taskId = created.task?.id
  if (!taskId) throw new Error(`${key}: ${JSON.stringify(created).slice(0, 200)}`)
  console.log(`  ${key}: queued, task ${taskId}`)

  for (let i = 0; i < 80; i++) {
    await sleep(15000)
    // NOTE: ?email= is required here — without it the lookup 400s
    const t = await (await fetch(
      `https://api.useapi.net/v1/kling/tasks/${taskId}?email=${encodeURIComponent(CFG.accounts.kling)}`,
      { headers: H })).text()
    const m = t.match(/https:\/\/[^"]+-output\.mp4[^"]*/)
    if (m) return { credits: CFG.models[key].credits, mb: await save(m[0].replace(/\\u0026/g, '&'), `${key}.mp4`) }
  }
  throw new Error(`${key}: timed out`)
}

const RUNNERS = { seedance: pixverse, h3: pixverse, omni: googleFlow, kling }

const targets = ONLY ? [ONLY] : Object.keys(CFG.models)
const results = []
for (const key of targets) {
  const m = CFG.models[key]
  if (!m) { console.error(`unknown model "${key}" — pick from ${Object.keys(CFG.models).join(', ')}`); process.exit(1) }
  console.log(`\n${m.label}`)
  try {
    const r = await RUNNERS[key]({ key, ...m })
    results.push({ key, label: m.label, usd: m.usd, ...r })
    console.log(`  saved output/${key}.mp4  ${r.mb} MB`)
  } catch (e) {
    console.error(`  ${e.message}`)
  }
}

console.log('\n' + 'model'.padEnd(18) + 'credits'.padStart(9) + 'approx $'.padStart(11))
for (const r of results) console.log(r.label.padEnd(18) + String(r.credits).padStart(9) + `$${r.usd.toFixed(2)}`.padStart(11))
if (results.length) console.log('total'.padEnd(18) + ''.padStart(9) + `$${results.reduce((a, b) => a + b.usd, 0).toFixed(2)}`.padStart(11))
