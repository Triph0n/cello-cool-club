# Admin Panel Implementation Tasks

Goal: build a local editorial panel for Cello Cool Club Engine so new cards can be created, previewed, given assets, and approved without social publishing.

## Checklist

- [x] Create source poem parser for `data/inbox/*.txt`
- [x] Create reusable card workflow service
- [x] Add local admin server with JSON API
- [x] Add admin panel HTML/CSS/JS
- [x] Show existing cards and statuses
- [x] Show imported poems with FR/CZ/EN text
- [x] Create a new draft card from a selected poem and language
- [x] Attach local image path to a card
- [x] Attach local audio path to a card
- [x] Generate preview page from the panel
- [x] Approve a reviewed card from the panel
- [x] Add npm command to start the admin panel
- [x] Verify parser, server, UI assets, and existing build/check-site

## Non-goals for this pass

- No automatic social posting.
- No public deployment.
- No real authentication.
- No automatic image generation from the panel yet.
