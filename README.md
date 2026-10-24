# Sora 2 API alternatives — the same shot on four replacements (useapi.net)

OpenAI removed `sora-2`, `sora-2-pro` and the Videos API on September 24, 2026, and its [deprecations table](https://developers.openai.com/api/docs/deprecations) names no replacement. Sora 2 is no longer available through useapi.net either. These are runnable examples for the four that do the same job, all through one [useapi.net](https://useapi.net/?utm_source=github.com&utm_medium=referral&utm_campaign=sora-2-alternatives) token — [Seedance 2.5](https://useapi.net/docs/api-pixverse-v2), [Omni 1.1 Flash](https://useapi.net/docs/api-google-flow-v1), [MiniMax H3](https://useapi.net/docs/api-pixverse-v2) and [Kling v3](https://useapi.net/docs/api-kling-v1).

Full write-up with the pricing math, the curl for every route and five real clips: **[Sora 2 API Alternatives Compared, With Code](https://useapi.net/docs/articles/sora-2-api-alternatives)**

The five clips side by side on YouTube: [Sora 2 API Alternatives Compared, With Code: Seedance 2.5, Omni Flash, MiniMax H3, Kling v3](https://youtube.com/shorts/W5vXcM2cCJs). The reel opens with a Sora 2 farewell clip, generated before OpenAI shut down Sora 2 on September 24, 2026. Sora 2 is no longer available.

## The short version (six-second clip, verified September 2026)

| Model | Route | Cost | Note |
|---|---|---:|---|
| **Omni 1.1 Flash** | Google Flow | **$0.08** | 360p or 720p, free upscale to 1080p |
| Kling v3 | Kling | $0.44 | up to 4K, derives aspect from the frame |
| MiniMax H3 | PixVerse | $0.72 | 768p or 1440p, no 720p tier |
| Seedance 2.5 | PixVerse | $1.80 | reference audio and video, via create-fusion |

Twenty-two times between the cheapest and the most expensive, for the same brief. Best per-credit rate on each route, monthly billing — see the [article](https://useapi.net/docs/articles/sora-2-api-alternatives#pricing) for the plan behind each figure.

| Example | What it does | Docs |
|---|---|---|
| [`frames/`](./frames) | Generate one character, then a start frame per model — same wording, only the sign changes. Free on Google Flow | [POST /images](https://useapi.net/docs/api-google-flow-v1/post-google-flow-images) |
| [`clips/`](./clips) | Send each start frame to the model whose name is on the sign, poll, download, and print the cost per clip | [PixVerse](https://useapi.net/docs/api-pixverse-v2/post-pixverse-videos-create-v4) · [Google Flow](https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos) · [Kling](https://useapi.net/docs/api-kling-v1/post-kling-videos-image2video-frames) |

## Quick start

You need [Node.js](https://nodejs.org) v21 or newer (no dependencies to install) and a useapi.net [API token](https://useapi.net/docs/start-here/setup-useapi?utm_source=github.com&utm_medium=referral&utm_campaign=sora-2-alternatives).

```bash
git clone https://github.com/useapi/sora-2-alternatives.git
cd sora-2-alternatives
```

Put your account emails into `frames/prompts.json` and `clips/prompts.json`, then generate the frames — this stage is free, so iterate as long as you like:

```bash
cd frames
node frames.mjs <API_TOKEN>
```

Review the four variants per sign and copy your pick over `output/<model>.jpg`. Take the `omni` id out of `output/ids.json` and put it into `clips/prompts.json` as `startImage`, since Omni takes the Google Flow id directly while the others need the file uploaded. Then generate:

```bash
cd ../clips
node clips.mjs <API_TOKEN>          # all four
node clips.mjs <API_TOKEN> omni     # or just the cheap one, $0.08
```

Clips land in `clips/output/` and the script prints the real credit cost the API returned. Generating all four needs [PixVerse](https://useapi.net/docs/start-here/setup-pixverse), [Google Flow](https://useapi.net/docs/start-here/setup-google-flow) and [Kling](https://useapi.net/docs/start-here/setup-kling) accounts, all covered by one [$15/month subscription](https://useapi.net/docs/subscription?utm_source=github.com&utm_medium=referral&utm_campaign=sora-2-alternatives).

## The Sora 2 farewell clip (no longer runs, kept for reference)

The reel's opening shot, the sign maker boxing up a SORA 2 sign, was made on `sora-2` through the [PixVerse API](https://useapi.net/docs/api-pixverse-v2?utm_source=github.com&utm_medium=referral&utm_campaign=sora-2-alternatives) before the shutdown: [watch the farewell clip](https://demo.useapi.net/discord-cdn-proxy/?https://cdn.discordapp.com/attachments/1239264794394234985/1551387331196362762/sora2-alt-clip-1-sora-2-farewell-pixverse-720p.mp4) (720p, eight seconds). Generated before OpenAI shut down Sora 2 on September 24, 2026. Sora 2 is no longer available, but the clip stays here as a comparison point.

That call no longer runs: the API now answers `400` to `sora-2` and `sora-2-pro`. The scripts in this repo never call Sora 2, so a fresh run of `frames/` and `clips/` works as is. The original request is kept for reference in the [article](https://useapi.net/docs/articles/sora-2-api-alternatives#step-3-the-farewell-clip-on-sora-2-itself).

## Three things that will bite you

- **Duration grids differ.** Sora 2 took 4, 8 or 12 seconds. Omni 1.1 Flash takes 4/6/8/10, MiniMax H3 5–15, Kling v3 3–15, Seedance 2.5 4–30. A hard-coded value will not port.
- **Resolutions are not uniform.** Omni tops out at 720p natively, H3 skips 720p entirely (768p or 1440p), Seedance reaches 1080p, Kling goes to 4K. Pick your finishing size before you shoot.
- **Google Flow defaults to landscape.** `aspectRatio` is `landscape` unless you say otherwise, and a portrait start frame does **not** override it. PixVerse and Kling both derive the aspect from the frame.

## About useapi.net

[useapi.net](https://useapi.net/?utm_source=github.com&utm_medium=referral&utm_campaign=sora-2-alternatives) is a third-party REST API for AI services. These routes run on your [PixVerse](https://pixverse.ai), [Google Flow](https://labs.google/flow) and [Kling](https://klingai.com) subscriptions, so you spend those platforms' credits instead of metered developer-API pricing. One token reaches every service — the only thing that changes between the four models is the path and the model name. See the [model matrix](https://useapi.net/model-matrix?utm_source=github.com&utm_medium=referral&utm_campaign=sora-2-alternatives) for every API that carries a given model.

Visit our [Discord Server](https://discord.gg/w28uK3cnmF) or [Telegram Channel](https://t.me/use_api) for support. Guides and demos on the [YouTube Channel](https://www.youtube.com/@useapi-net).

*Prices were verified 2026-09-21 and vendors change promotions without notice — re-check before relying on any figure.*

## License

The example code in this repository is released under the [MIT License](./LICENSE). It covers the example scripts only, not the useapi.net service or API.
