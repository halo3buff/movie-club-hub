# Letterboxd Integration — Production Port

> **Context:** The original plan at `docs/superpowers/plans/2026-05-01-letterboxd-integration.md` was implemented partly in `FE-Design/` (a Figma Make export, not the production frontend) and partly in the production backend. This spec ports the user-facing pieces to the actual served frontend (`artifacts/movie-club/`) and trims scope to what backend currently supports.

## Goal

Ship the Letterboxd link + movie-link preference toggle through the real production code path, so users see them in the deployed app. Defer the stats/activity public profile page (backend already supports it) for a follow-up.

## Already Done (no change)

- Backend in `go-api/`: migrations 000014/000015, profile service, handlers, routes (`GET /users/:userId/profile`, `PATCH /me/profile`, `PATCH /me/settings`), `userResponse` includes `letterboxdUsername` + `movieLinkPreference`.
- `artifacts/movie-club/src/lib/letterboxd.ts` has `toLetterboxdSlug` + `getLetterboxdUrl`.
- `CurrentTurnMovie.tsx` already links to Letterboxd (hardcoded, needs preference wiring).

## In Scope

### 1. OpenAPI + generated client (`lib/api-spec/openapi.yaml`)

Additions:

- `User` schema: add `letterboxdUsername: string | null`, `movieLinkPreference: "letterboxd" | "imdb"` (enum).
- `PATCH /me/profile` — body `{ letterboxdUsername: string }` (empty string clears) → 200 `{ message }`.
- `PATCH /me/settings` — body `{ movieLinkPreference: "letterboxd" | "imdb" }` → 200 `{ message }`.
- Skip `GET /users/{userId}/profile` (deferred along with the UI that consumes it).

Regenerate `lib/api-client-react/src/generated/` via the existing orval pipeline.

### 2. `artifacts/movie-club/src/lib/letterboxd.ts`

Add:

```ts
export function getImdbUrl(imdbId: string): string {
  return `https://www.imdb.com/title/${imdbId}/`;
}

export function getMovieUrl(
  title: string,
  imdbId: string | null | undefined,
  preference: "letterboxd" | "imdb"
): string {
  if (preference === "imdb" && imdbId) return getImdbUrl(imdbId);
  return getLetterboxdUrl(title);
}
```

### 3. `artifacts/movie-club/src/pages/profile.tsx`

Existing page is account settings (avatar / username / password). Add two new sections, following the existing card pattern:

- **Letterboxd account**: text input, regex-validated `^[a-zA-Z0-9_]{0,50}$`, empty allowed, save calls `PATCH /me/profile`. Show current value if present + small "View on Letterboxd ↗" link.
- **Movie links**: radio group (Letterboxd / IMDB). Save calls `PATCH /me/settings`. Default Letterboxd. Helper text: "Where movie titles open when clicked."

Both forms follow the project's existing form pattern (see `UsernameForm`, `PasswordForm` in `domains/auth/components/`) — react-hook-form + zod + sonner toast on success/error + tanstack-query mutation that invalidates `useGetMe`.

### 4. Movie-title link sites — preference-aware

Update `domains/movies/components/CurrentTurnMovie.tsx` (and any other place that links to Letterboxd) to use `getMovieUrl(title, imdbId, me?.movieLinkPreference ?? "letterboxd")`. The current movie object's IMDB ID source: TBD when wiring — if not present in the existing type, fall back to Letterboxd (which `getMovieUrl` already handles).

### 5. Cleanup

Delete `FE-Design/` directory. Verified beforehand that:

- It's not in `pnpm-workspace.yaml`.
- No reference in `Makefile`, `Dockerfile`, `docker-compose.yml`, root `package.json`.
- Nothing imports from it.

## Out of Scope (Deferred)

### Public profile page `/users/:userId` (Phase 1 of original plan)

Backend endpoint `GET /users/:userId/profile` exists and works. The frontend component is what's deferred. When we pick this up, here is the design we'll follow so it doesn't get lost:

**Route:** `/users/:userId` (wouter), adjacent to the existing `/profile` (which stays as account settings).

**Layout:** Two-column on desktop, stacked on mobile. Left column: identity card. Right column: recent activity feed.

**Identity card:**

- Large avatar.
- Username (display).
- Letterboxd badge — if `letterboxdUsername` set, render an outbound chip linking to `https://letterboxd.com/<username>/` with the Letterboxd brand color.
- Stats trio: Avg Rating, Watched count, Reviews count.
- Top genres (up to 3, bolded chips, derived from backend response).

**Recent activity (right column):**

- Up to 10 items: poster + title + year + star rating + truncated review.
- For non-self viewers, list is filtered by the backend to clubs shared with the viewer (already implemented).
- Empty state: "No activity yet."

**Access control:** Backend returns 403 if viewer doesn't share a club with target. Frontend shows a "You don't have access to this profile" empty state.

**Cross-app linking (UserLink):** Once the page exists, replace static avatars in `ClubView`, `TurnResults`, the schedule sidebar, and nominator chips with a `UserLink` component that wraps the avatar + name in a `<Link to={\`/users/\${id}\`}>`. Until then, avatars stay non-clickable — the original FE-Design `UserLink` component is **not** ported because there is nowhere meaningful to navigate to yet.

**Style note:** Adapt to the production app's shadcn/serif aesthetic — do **not** port the FE-Design VHS/brutalist treatment.

### `/settings` route

Original plan had a standalone `/settings` page for the movie-link toggle. Roadmap item "Settings Consolidation" already calls for merging settings into `/profile`, so we're skipping the standalone route from the start.

### `UserLink` component

Tied to the deferred public profile page above. Skip until that ships.

## Test Plan

- `pnpm --filter movie-club typecheck` after each edit.
- `cd go-api && go test ./...` — should still pass; backend untouched.
- `make build` round-trip.
- Manual: visit `/profile`, set Letterboxd username; verify it persists across reload (`useGetMe`). Toggle preference to IMDB; click a movie title in `CurrentTurnMovie` and confirm it routes to IMDB (or falls back to Letterboxd if no IMDB ID).

## Risks

- Adding `movieLinkPreference` as a non-optional field in the `User` schema means existing sessions returning `me` must include it. Backend already returns it (commit `a504e8e`), so this is additive but will fail typecheck if any seed/test fixture stubs `User` without the field — sweep for that during implementation.
- Orval regen output may diff in unrelated ways (formatting). Commit only the intentional changes.
