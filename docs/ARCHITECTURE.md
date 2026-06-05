# Architecture

## Projects

### Public website

Path:

```text
C:\Users\Vladimir\Documents\CelloCoolClub
```

Responsibility:

- public archive,
- card pages,
- audio player,
- visual experience,
- static assets needed by the site.

### Engine

Path:

```text
C:\Users\Vladimir\Documents\CelloCoolClubEngine
```

Responsibility:

- editorial database,
- drafts,
- card validation,
- image generation,
- Suno prompt preparation,
- social publishing,
- scheduling,
- export to the public website.

## Data source

MVP:

```text
data/cards.json
```

Later:

- Supabase for production data,
- Cloudflare D1 if we want to stay fully inside Cloudflare,
- Airtable if editorial comfort matters more than code ownership.

## Deployment target

Recommended:

- Cloudflare Pages for the public archive,
- Cloudflare R2 for larger media files,
- Cloudflare Workers Cron for scheduled publishing.

Fast MVP alternative:

- static local export,
- manual upload/deploy,
- Bluesky test publishing from local script.

## Publishing adapters

Implement platform adapters separately:

```text
scripts/platforms/bluesky
scripts/platforms/threads
scripts/platforms/instagram
scripts/platforms/tiktok
```

Priority:

1. Bluesky for first automated proof.
2. Threads as main planned channel.
3. Instagram after Meta setup.
4. TikTok after video teaser generation exists.

## Release dry run

Before real API publishing, the engine has a dry-run release layer:

- `next-release` selects the next `approved` or due `scheduled` card,
- `prepare-social` writes text and JSON post drafts,
- no script posts to a platform until a dedicated adapter is added.

This keeps the publishing ritual testable without risking accidental posts.

## Bluesky publishing

`publish-bluesky` is confirmation-gated:

- without `--confirm`, it prints the post text, target PDS, and image path,
- with `--confirm`, it creates a Bluesky session, uploads the card image as a blob, and creates an `app.bsky.feed.post` record,
- credentials stay in `.env` or environment variables,
- the resulting post URL is written back to `postedUrls.bluesky`.

## Three-day scheduler

`run-release` enforces the release ritual:

- release time defaults to 07:30 `Asia/Jerusalem`,
- cadence defaults to every 3 days after the last posted card,
- only cards with `status: approved` can be released,
- without `--confirm`, the command is a dry run,
- with `--confirm`, the selected card moves to `posted`, `publishAt` is recorded, a release social draft is written, and the public website is exported.

## Deploy readiness

`check-site` validates the public static output before deployment:

- homepage exists,
- archive index exists,
- public `data/cards.json` parses,
- each public card has a generated page,
- image and audio assets exist,
- private engine-only fields have not leaked into the public JSON.

## Draft previews

`preview-card` creates local-only preview pages under the public website's `preview/` folder.

Preview pages:

- do not add the card to the public archive,
- do not change card status,
- can render draft cards before final image or audio exists,
- show a visible preview badge.

## Card state machine

```text
idea
draft
image_ready
music_needed
ready_for_review
approved
scheduled
posted
```

Only `approved` cards can be scheduled or posted.

## Export contract

The engine should export clean public data into the website project. The website should not need to know about private notes, prompts, tokens, logs, or failed generations.

Public export fields:

- id
- number
- slug
- title
- season
- language
- poemText
- image
- audio
- altText
- publishAt
- archiveUrl

Private engine-only fields:

- imagePrompt
- sunoPrompt
- musicNotes
- platform draft captions
- internal notes
- generation logs
- API job ids

## Image generation

`generate-image` is confirmation-gated:

- without `--confirm`, it prints the model, output paths, and final prompt,
- with `--confirm`, it calls the OpenAI Images API,
- generated files are saved to the engine and copied into the public website assets,
- the card image path is updated in `data/cards.json`,
- a `draft` card moves to `image_ready` after successful generation.

## Suno workflow

The engine does not call unofficial Suno APIs.

Instead:

- `export-suno` writes a style prompt, lyrics text, and markdown packet,
- the creator uses Suno manually and chooses the final track,
- `attach-audio` copies the selected audio into engine assets and public website assets,
- the card `audio` path is updated in `data/cards.json`,
- a card with image and audio can move to `ready_for_review`.
