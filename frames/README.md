# One character, four signs — all free

📖 Full walkthrough: [Sora 2 API Alternatives Compared, With Code](https://useapi.net/docs/articles/sora-2-api-alternatives)

`frames.mjs` generates the character once with [Nano Banana Pro](https://useapi.net/docs/api-google-flow-v1/post-google-flow-images), then passes it as `reference_1` to four more image requests that change only the sign's text and colour. That reference is the only thing keeping the same face, room and bench across clips made by three different vendors.

```bash
node frames.mjs <API_TOKEN>
CHARACTER=3 node frames.mjs <API_TOKEN>   # use variant 3 as the reference instead
```

Images are free on Google Flow — Nano Banana Pro is $0.134 an image on the official Gemini API and included here — so iterate as long as you like before spending a credit on video.

Each sign gets four variants. Review them and copy your pick over `output/<model>.jpg`. Pick the one where the whole sign sits inside the frame rather than running off the edge, because anything near the border clips out of shot once the clip animates. Long sign text is the fragile part: twelve characters (`SEEDANCE 2.5`) rendered cleanly, and that is close to where image models start mangling glyphs.

`output/ids.json` holds every `mediaGenerationId`. The `omni` one goes into `../clips/prompts.json` as `startImage` — Omni 1.1 Flash takes the Google Flow id directly, while PixVerse and Kling need the file uploaded to them first.

Edit the prompts in `prompts.json`.
