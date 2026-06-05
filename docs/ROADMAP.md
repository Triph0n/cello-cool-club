# Roadmap

## Phase 1: Local editorial engine

Goal:

Turn the current single card into structured data and make the next cards easy to prepare.

Tasks:

- create real `data/cards.json`,
- add The Clock as card 001,
- add placeholders for 11 more cards,
- define required fields,
- create validation script,
- create export script.

Definition of done:

- one command can validate the card database,
- one command can export public card data for the website.

## Phase 2: Public archive integration

Goal:

Make the website use exported card data.

Tasks:

- generate card pages,
- generate archive index,
- preserve the current visual style,
- add next/previous card navigation,
- add social preview metadata.

Definition of done:

- The Clock exists as `/cards/001-the-clock/`,
- homepage shows latest card,
- archive lists all published cards.

## Phase 3: Creative automation

Goal:

Partly automate card creation while keeping human approval.

Tasks:

- generate image from `imagePrompt`,
- store generated image asset,
- generate alt text draft,
- prepare Suno prompt export,
- generate social caption drafts.

Definition of done:

- a draft card can move from `draft` to `ready_for_review` with generated helper assets.

## Phase 4: Social proof

Goal:

Test real automated publishing on the easiest platform first.

Tasks:

- add Bluesky credentials through environment variables,
- publish one test post,
- write post URL back to data,
- log success or failure.

Definition of done:

- one approved card can be posted to Bluesky without manual copy-paste.

## Phase 5: Main platform

Goal:

Prepare Threads as the primary public channel.

Tasks:

- create Meta developer app,
- verify required permissions,
- implement Threads adapter,
- test media container creation and publish flow,
- store published URL.

Definition of done:

- one approved card can be posted to Threads from the engine.

## Phase 6: Three-day ritual

Goal:

Automate the release rhythm.

Tasks:

- scheduler checks every morning,
- publishes only every third day or when a scheduled date matches,
- selects next `approved` card,
- exports website update,
- posts social update,
- records status.

Definition of done:

- the system can release a new card every three days with no manual HTML editing.
