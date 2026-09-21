# The same shot, four Sora 2 replacements

📖 Full walkthrough: [Sora 2 API Alternatives Compared, With Code](https://useapi.net/docs/articles/sora-2-api-alternatives)

`clips.mjs` sends each start frame to the model whose name is on the sign, polls until the clip is ready, downloads it, and prints the credit cost the API actually returned.

```bash
node clips.mjs <API_TOKEN>            # all four
node clips.mjs <API_TOKEN> seedance   # or one of: seedance, omni, h3, kling
```

Run `../frames/frames.mjs` first. Clips land in `output/`.

Three API details worth knowing, each of which returns an unhelpful error if you get it wrong:

- PixVerse rejects a percent-encoded `video_id` when you poll — pass the raw `user:…-video:…` string.
- Kling's task lookup requires `?email=`.
- Google Flow's `aspectRatio` defaults to `landscape`, and a portrait `startImage` does not change that.

`seedance-2.5` and `minimax-h3` both reject an `audio` field — native audio is always on — and both require `duration` and `quality`, which are optional only on PixVerse's own models. Kling v3 rejects `aspect_ratio` and derives it from the frame.

Every create call also accepts `replyUrl` if you would rather be called back than poll. Edit the prompts, durations and account emails in `prompts.json`.
