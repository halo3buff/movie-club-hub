# Roadmap

## Done

- [x] **Rate Limiting** — Per-IP + per-user rate limiting on auth and search endpoints
- [x] **Fix Invite Code System** — One persistent code per group, visible in admin panel with regenerate button
- [x] **Profile Images** — Upload profile photo stored in GCP Cloud Storage
- [x] **Review Reactions** — Emoji reactions on reviews (e.g. "sleeper pick", "harsh")
- [x] **Add Tests (Backend)** — Go backend test suite
- [x] **Profile Pages** — Per-user page showing photo, reviews, ratings, and Letterboxd link
- [x] **Movie Title Links** — Click movie title to open Letterboxd (or IMDB via user preference)

## P0 — Critical

- [ ] **GCP Dev Environment** — Staging URL with auto-deploy on push to dev branch

## P1 — High

- [ ] **Rating Slider Gating** — Hide rating UI until movie is marked watched; restore rating if re-watched
- [ ] **Settings Consolidation** — move user settings into profile page and remove standalone settings

## P2 — Medium

- [ ] **Review Replies** — Nested replies one level deep
- [ ] **Add Logo** — Design and implement brand identity
- [ ] **Add Tests (Frontend)** — Vitest test suite for frontend
- [ ] **Letterboxd Sync** — sync watched history and ratings from Letterboxd profiles (username already stored)

## P3 — Low

- [ ] **Refactor Large Components** — Break up group-detail.tsx and group-admin.tsx (see REFACTORING_PLAN.md)
