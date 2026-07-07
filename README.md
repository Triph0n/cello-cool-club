# Cello Cool Club Engine

This project is the content and automation engine for Cello Cool Club.

The public website stays in:

```text
C:\Users\Vladimir\Documents\CelloCoolClub
```

This engine project owns:

- card data,
- original source texts,
- clean poem source files,
- image prompts,
- Suno prompts,
- generated image assets,
- publication scheduling,
- social post preparation,
- future API integrations.

## Why separate project

The website should remain simple, stable, and public-facing.

The engine can change faster. It can hold scripts, drafts, automation logic, platform adapters, logs, and private workflow files without making the website messy.

## Proposed flow

1. Draft card ideas in `data/cards.json`.
2. Validate that a card has the required fields.
3. Generate or attach artwork.
4. Prepare the Suno prompt.
5. Add selected audio manually.
6. Approve the card.
7. Export public files to the website project.
8. Publish the social post.
9. Store the published URL back in the data.

## Folder structure

```text
CelloCoolClubEngine/
  assets/
    audio/
    generated-images/
  data/
    clean-sources/
    inbox/
    cards.json
    cards.example.json
  docs/
    ARCHITECTURE.md
    ROADMAP.md
  scripts/
```

## Setup

Install dependencies once (sharp is used to resize images for Bluesky):

```text
npm install
```

A detailed step-by-step guide (in Czech) lives in `docs/NAVOD.md`.

The current product brief lives in `docs/PRD.md`.

## Commands

Start the local editorial admin panel:

```text
npm run admin
```

Then open:

```text
http://127.0.0.1:5174/
```

Create a new draft card:

```text
npm run new-card -- --title "The Lantern"
```

Check which approved or scheduled card would be released next:

```text
npm run next-release
```

Preview image generation for a card without calling the API:

```text
npm run generate-image -- 002
```

Actually generate and save the image:

```text
npm run generate-image -- 002 --confirm
```

Rebuild the image prompt from the poem (motif-based artistic prompt):

```text
npm run generate-image -- 002 --rebuild-prompt
```

Attach an already chosen image file:

```text
npm run attach-image -- 002 "C:\path\to\image.png"
```

Export the Suno prompt and lyrics packet:

```text
npm run export-suno -- 002
```

Attach the selected audio file after choosing the final track:

```text
npm run attach-audio -- 002 "C:\path\to\selected-audio.mp3"
```

Approve a reviewed card:

```text
npm run approve-card -- 002
```

Prepare a social post draft for a specific card:

```text
npm run prepare-social -- 001
```

Prepare a social post draft for the next releasable card:

```text
npm run prepare-social -- --next
```

Generate a local-only preview page for a draft card:

```text
npm run preview-card -- 002
```

Preview a Bluesky post without publishing:

```text
npm run publish-bluesky -- 001
```

Publish to Bluesky after credentials are configured:

```text
npm run publish-bluesky -- 001 --confirm
```

Check the three-day release schedule:

```text
npm run run-release
```

Simulate a specific release time:

```text
npm run run-release -- 2026-06-07T05:00:00Z
```

Confirm a due local release:

```text
npm run run-release -- --confirm
```

Check that the public static website is deploy-ready:

```text
npm run check-site
```

Validate card data:

```text
npm run validate
```

Run unit tests only:

```text
npm run test:unit
```

Export public archive files to the website project:

```text
npm run export
```

Run both:

```text
npm run build
```

The export currently writes:

```text
C:\Users\Vladimir\Documents\CelloCoolClub\index.html
C:\Users\Vladimir\Documents\CelloCoolClub\data\cards.json
C:\Users\Vladimir\Documents\CelloCoolClub\cards\index.html
C:\Users\Vladimir\Documents\CelloCoolClub\cards\001-the-clock\index.html
```

Social post drafts are written to:

```text
exports\social\
```

They are generated files and are intentionally ignored by git.

Suno prompt packets are written to:

```text
exports\suno\
```

## First milestone

Build the "First 12 Cards Engine":

- 12 draft card records,
- one validated card schema,
- export of card data into the public website,
- manual image/audio attachment,
- social post caption generation,
- first test post on Bluesky,
- Threads integration prepared but not blocking MVP.

## Boundaries

Do not store API keys in this project.

Use environment variables or local ignored files for credentials once integrations are added.
