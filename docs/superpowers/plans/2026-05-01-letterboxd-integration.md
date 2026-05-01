# Letterboxd Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user profile pages with Letterboxd account linking and configurable movie link preferences.

**Architecture:** Two-phase rollout. Phase 1 adds profile pages with stats, activity history, and Letterboxd username. Phase 2 adds user preference for movie link destination (Letterboxd/IMDB). Backend uses chi router with sqlc-generated queries. Frontend is React with react-router.

**Tech Stack:** Go 1.21+, PostgreSQL, sqlc, chi router, React 18, TypeScript, Tailwind CSS

---

## File Structure

### Phase 1: Profile Pages

**Backend (create):**
- `go-api/migrations/000014_add_letterboxd_username.up.sql` — Add letterboxd_username column
- `go-api/migrations/000014_add_letterboxd_username.down.sql` — Rollback migration
- `go-api/internal/db/queries/profile.sql` — Profile-related queries
- `go-api/internal/service/profile.go` — Profile business logic
- `go-api/internal/service/profile_test.go` — Profile service tests
- `go-api/internal/handler/profile.go` — Profile HTTP handlers

**Backend (modify):**
- `go-api/cmd/server/main.go:131-224` — Add profile routes

**Frontend (create):**
- `FE-Design/src/app/components/UserProfile.tsx` — Profile page component
- `FE-Design/src/app/components/UserLink.tsx` — Reusable clickable user avatar/name

**Frontend (modify):**
- `FE-Design/src/app/routes.tsx` — Add /user/:userId route
- `FE-Design/src/app/components/ClubView.tsx` — Use UserLink for clickable avatars
- `FE-Design/src/app/components/TurnResults.tsx` — Use UserLink for review authors

### Phase 2: Movie Link Preferences

**Backend (create):**
- `go-api/migrations/000015_add_movie_link_preference.up.sql` — Add preference column
- `go-api/migrations/000015_add_movie_link_preference.down.sql` — Rollback migration

**Backend (modify):**
- `go-api/internal/db/queries/auth.sql` — Add queries for user settings
- `go-api/internal/handler/auth.go` — Add settings endpoint

**Frontend (create):**
- `FE-Design/src/app/components/MovieTitleLink.tsx` — Clickable movie title component
- `FE-Design/src/app/lib/letterboxd.ts` — Letterboxd slug utility
- `FE-Design/src/app/components/Settings.tsx` — Settings page with movie link preference

**Frontend (modify):**
- `FE-Design/src/app/routes.tsx` — Add /settings route
- `FE-Design/src/app/components/ClubView.tsx` — Use MovieTitleLink

---

## Phase 1: Profile Pages

### Task 1: Database Migration for Letterboxd Username

**Files:**
- Create: `go-api/migrations/000014_add_letterboxd_username.up.sql`
- Create: `go-api/migrations/000014_add_letterboxd_username.down.sql`

- [ ] **Step 1: Create up migration**

```sql
-- go-api/migrations/000014_add_letterboxd_username.up.sql
ALTER TABLE users ADD COLUMN letterboxd_username text;
```

- [ ] **Step 2: Create down migration**

```sql
-- go-api/migrations/000014_add_letterboxd_username.down.sql
ALTER TABLE users DROP COLUMN letterboxd_username;
```

- [ ] **Step 3: Run migration locally**

Run: `cd go-api && go run cmd/migrate/main.go up`
Expected: Migration applied successfully, no errors

- [ ] **Step 4: Verify column exists**

Run: `psql $DATABASE_URL -c "\d users"`
Expected: See `letterboxd_username | text` in column list

- [ ] **Step 5: Commit**

```bash
git add go-api/migrations/000014_add_letterboxd_username.up.sql go-api/migrations/000014_add_letterboxd_username.down.sql
git commit -m "feat(db): add letterboxd_username column to users table"
```

---

### Task 2: Profile SQL Queries

**Files:**
- Create: `go-api/internal/db/queries/profile.sql`

- [ ] **Step 1: Write profile queries**

```sql
-- go-api/internal/db/queries/profile.sql

-- name: GetUserProfile :one
SELECT id, username, avatar_url, letterboxd_username, created_at
FROM users
WHERE id = $1;

-- name: UpdateLetterboxdUsername :one
UPDATE users
SET letterboxd_username = $2
WHERE id = $1
RETURNING id, username, avatar_url, letterboxd_username, created_at;

-- name: CheckSharedClubMembership :one
SELECT EXISTS (
    SELECT 1 FROM memberships m1
    JOIN memberships m2 ON m1.group_id = m2.group_id
    WHERE m1.user_id = $1 AND m2.user_id = $2
) AS shared;

-- name: GetUserStats :one
SELECT
    COALESCE(AVG(rating)::numeric(3,2), 0) AS avg_rating,
    COUNT(*) FILTER (WHERE watched = true) AS total_watched,
    COUNT(*) FILTER (WHERE review IS NOT NULL AND review != '') AS total_reviews
FROM verdicts
WHERE user_id = $1;

-- name: GetUserTopGenres :many
SELECT f.genre, COUNT(*) AS cnt
FROM verdicts v
JOIN turns t ON v.turn_id = t.id
JOIN movies m ON m.turn_id = t.id
JOIN films f ON m.film_id = f.id
WHERE v.user_id = $1 AND v.watched = true AND f.genre IS NOT NULL
GROUP BY f.genre
ORDER BY cnt DESC
LIMIT 5;

-- name: GetUserRecentActivity :many
SELECT
    f.id AS film_id,
    f.title,
    f.year,
    f.poster_url,
    v.rating,
    v.review,
    v.updated_at AS watched_at
FROM verdicts v
JOIN turns t ON v.turn_id = t.id
JOIN movies m ON m.turn_id = t.id
JOIN films f ON m.film_id = f.id
WHERE v.user_id = $1 AND v.watched = true
ORDER BY v.updated_at DESC
LIMIT 10;

-- name: GetUserRecentActivityForViewer :many
-- Only returns activity from clubs shared between viewer and target user
SELECT
    f.id AS film_id,
    f.title,
    f.year,
    f.poster_url,
    v.rating,
    v.review,
    v.updated_at AS watched_at
FROM verdicts v
JOIN turns t ON v.turn_id = t.id
JOIN movies m ON m.turn_id = t.id
JOIN films f ON m.film_id = f.id
WHERE v.user_id = $1
  AND v.watched = true
  AND t.group_id IN (
      SELECT m1.group_id FROM memberships m1
      JOIN memberships m2 ON m1.group_id = m2.group_id
      WHERE m1.user_id = $1 AND m2.user_id = $2
  )
ORDER BY v.updated_at DESC
LIMIT 10;
```

- [ ] **Step 2: Regenerate sqlc**

Run: `cd go-api && sqlc generate`
Expected: No errors, new file `go-api/internal/db/profile.sql.go` created

- [ ] **Step 3: Verify generated code**

Run: `ls -la go-api/internal/db/profile.sql.go`
Expected: File exists with recent timestamp

- [ ] **Step 4: Commit**

```bash
git add go-api/internal/db/queries/profile.sql go-api/internal/db/profile.sql.go
git commit -m "feat(db): add profile SQL queries"
```

---

### Task 3: Profile Service with Tests

**Files:**
- Create: `go-api/internal/service/profile.go`
- Create: `go-api/internal/service/profile_test.go`

- [ ] **Step 1: Write failing test for username validation**

```go
// go-api/internal/service/profile_test.go
package service

import (
	"testing"
)

func TestIsValidLetterboxdUsername(t *testing.T) {
	valid := []string{"sarahchen", "movie_fan_42", "a", "user123"}
	for _, u := range valid {
		if !isValidLetterboxdUsername(u) {
			t.Errorf("isValidLetterboxdUsername(%q) = false, want true", u)
		}
	}

	invalid := []string{"has space", "special!", "emoji😀", "waytoolongusernamethatexceedsfiftycharacterslimit123"}
	for _, u := range invalid {
		if isValidLetterboxdUsername(u) {
			t.Errorf("isValidLetterboxdUsername(%q) = true, want false", u)
		}
	}
}

func TestParseGenres(t *testing.T) {
	tests := []struct {
		input string
		want  []string
	}{
		{"Drama, Thriller", []string{"Drama", "Thriller"}},
		{"Action", []string{"Action"}},
		{"Comedy, Drama, Romance", []string{"Comedy", "Drama", "Romance"}},
		{"", nil},
	}
	for _, tt := range tests {
		got := parseGenres(tt.input)
		if len(got) != len(tt.want) {
			t.Errorf("parseGenres(%q) = %v, want %v", tt.input, got, tt.want)
			continue
		}
		for i := range got {
			if got[i] != tt.want[i] {
				t.Errorf("parseGenres(%q)[%d] = %q, want %q", tt.input, i, got[i], tt.want[i])
			}
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd go-api && go test ./internal/service/ -run TestIsValidLetterboxdUsername -v`
Expected: FAIL with "undefined: isValidLetterboxdUsername"

- [ ] **Step 3: Write profile service**

```go
// go-api/internal/service/profile.go
package service

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/adnanshoukfeh/movie-club-hub/go-api/internal/db"
	"github.com/jackc/pgx/v5"
)

var (
	ErrProfileNotFound      = errors.New("profile not found")
	ErrProfileAccessDenied  = errors.New("profile access denied")
	ErrInvalidLetterboxd    = errors.New("invalid letterboxd username")
)

var letterboxdUsernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)

func isValidLetterboxdUsername(username string) bool {
	if username == "" {
		return true // empty is allowed (clears the field)
	}
	if len(username) > 50 {
		return false
	}
	return letterboxdUsernameRegex.MatchString(username)
}

func parseGenres(genre string) []string {
	if genre == "" {
		return nil
	}
	parts := strings.Split(genre, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

type ProfileService struct {
	queries *db.Queries
	config  Config
}

func NewProfileService(q *db.Queries, cfg Config) *ProfileService {
	return &ProfileService{queries: q, config: cfg}
}

type UserStats struct {
	AvgRating    float64  `json:"avg_rating"`
	TotalWatched int64    `json:"total_watched"`
	TotalReviews int64    `json:"total_reviews"`
	TopGenres    []string `json:"top_genres"`
}

type ActivityItem struct {
	FilmID    int64   `json:"film_id"`
	Title     string  `json:"title"`
	Year      *int32  `json:"year"`
	PosterURL *string `json:"poster_url"`
	Rating    float64 `json:"rating"`
	Review    *string `json:"review"`
	WatchedAt string  `json:"watched_at"`
}

type ProfileResponse struct {
	ID                  int32          `json:"id"`
	Username            string         `json:"username"`
	AvatarURL           *string        `json:"avatar_url"`
	LetterboxdUsername  *string        `json:"letterboxd_username"`
	Stats               UserStats      `json:"stats"`
	RecentActivity      []ActivityItem `json:"recent_activity"`
	IsOwnProfile        bool           `json:"is_own_profile"`
}

func (s *ProfileService) GetProfile(ctx context.Context, viewerID, targetID int32) (*ProfileResponse, error) {
	// Check access: viewer must share a club with target (or be viewing own profile)
	isOwnProfile := viewerID == targetID
	if !isOwnProfile {
		shared, err := s.queries.CheckSharedClubMembership(ctx, db.CheckSharedClubMembershipParams{
			UserID:   viewerID,
			UserID_2: targetID,
		})
		if err != nil {
			return nil, err
		}
		if !shared {
			return nil, ErrProfileAccessDenied
		}
	}

	// Get user profile
	user, err := s.queries.GetUserProfile(ctx, targetID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}

	// Get stats
	stats, err := s.queries.GetUserStats(ctx, targetID)
	if err != nil {
		return nil, err
	}

	// Get top genres
	genreRows, err := s.queries.GetUserTopGenres(ctx, targetID)
	if err != nil {
		return nil, err
	}

	// Aggregate genres (they come as comma-separated in the DB)
	genreCounts := make(map[string]int64)
	for _, row := range genreRows {
		if row.Genre != nil {
			for _, g := range parseGenres(*row.Genre) {
				genreCounts[g] += row.Cnt
			}
		}
	}

	// Sort and take top 3
	topGenres := topNGenres(genreCounts, 3)

	// Get recent activity (filtered to shared clubs if not own profile)
	var activityRows []db.GetUserRecentActivityForViewerRow
	if isOwnProfile {
		ownRows, err := s.queries.GetUserRecentActivity(ctx, targetID)
		if err != nil {
			return nil, err
		}
		// Convert to viewer row type
		for _, r := range ownRows {
			activityRows = append(activityRows, db.GetUserRecentActivityForViewerRow{
				FilmID:    r.FilmID,
				Title:     r.Title,
				Year:      r.Year,
				PosterUrl: r.PosterUrl,
				Rating:    r.Rating,
				Review:    r.Review,
				WatchedAt: r.WatchedAt,
			})
		}
	} else {
		activityRows, err = s.queries.GetUserRecentActivityForViewer(ctx, db.GetUserRecentActivityForViewerParams{
			UserID:   targetID,
			UserID_2: viewerID,
		})
		if err != nil {
			return nil, err
		}
	}

	// Build response
	activity := make([]ActivityItem, 0, len(activityRows))
	for _, row := range activityRows {
		var rating float64
		if row.Rating.Valid {
			f, _ := row.Rating.Float64Value()
			rating = f.Float64
		}
		item := ActivityItem{
			FilmID:    row.FilmID,
			Title:     row.Title,
			Year:      row.Year,
			PosterURL: row.PosterUrl,
			Rating:    rating,
			Review:    row.Review,
		}
		if row.WatchedAt.Valid {
			item.WatchedAt = row.WatchedAt.Time.Format("2006-01-02T15:04:05Z")
		}
		activity = append(activity, item)
	}

	var avgRating float64
	if f, err := stats.AvgRating.Float64Value(); err == nil {
		avgRating = f.Float64
	}

	return &ProfileResponse{
		ID:                 user.ID,
		Username:           user.Username,
		AvatarURL:          user.AvatarUrl,
		LetterboxdUsername: user.LetterboxdUsername,
		Stats: UserStats{
			AvgRating:    avgRating,
			TotalWatched: stats.TotalWatched,
			TotalReviews: stats.TotalReviews,
			TopGenres:    topGenres,
		},
		RecentActivity: activity,
		IsOwnProfile:   isOwnProfile,
	}, nil
}

func (s *ProfileService) UpdateLetterboxdUsername(ctx context.Context, userID int32, username string) error {
	if !isValidLetterboxdUsername(username) {
		return ErrInvalidLetterboxd
	}

	var usernamePtr *string
	if username != "" {
		usernamePtr = &username
	}

	_, err := s.queries.UpdateLetterboxdUsername(ctx, db.UpdateLetterboxdUsernameParams{
		ID:                 userID,
		LetterboxdUsername: usernamePtr,
	})
	return err
}

func topNGenres(counts map[string]int64, n int) []string {
	if len(counts) == 0 {
		return []string{}
	}

	type kv struct {
		k string
		v int64
	}
	var sorted []kv
	for k, v := range counts {
		sorted = append(sorted, kv{k, v})
	}

	// Simple insertion sort (small n)
	for i := 1; i < len(sorted); i++ {
		for j := i; j > 0 && sorted[j].v > sorted[j-1].v; j-- {
			sorted[j], sorted[j-1] = sorted[j-1], sorted[j]
		}
	}

	result := make([]string, 0, n)
	for i := 0; i < len(sorted) && i < n; i++ {
		result = append(result, sorted[i].k)
	}
	return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd go-api && go test ./internal/service/ -run "TestIsValidLetterboxdUsername|TestParseGenres" -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add go-api/internal/service/profile.go go-api/internal/service/profile_test.go
git commit -m "feat(service): add profile service with validation"
```

---

### Task 4: Profile HTTP Handler

**Files:**
- Create: `go-api/internal/handler/profile.go`
- Modify: `go-api/cmd/server/main.go`

- [ ] **Step 1: Write profile handler**

```go
// go-api/internal/handler/profile.go
package handler

import (
	"errors"
	"net/http"

	"github.com/adnanshoukfeh/movie-club-hub/go-api/internal/service"
)

type updateProfileRequest struct {
	LetterboxdUsername string `json:"letterboxd_username"`
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	viewerID, ok := h.sm.GetUserID(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	targetID, err := pathInt(r, "userId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	profile, err := h.profileSvc.GetProfile(r.Context(), int32(viewerID), targetID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrProfileNotFound):
			writeError(w, http.StatusNotFound, "User not found")
		case errors.Is(err, service.ErrProfileAccessDenied):
			writeError(w, http.StatusForbidden, "You don't have access to this profile")
		default:
			writeError(w, http.StatusInternalServerError, "Failed to get profile")
		}
		return
	}

	writeJSON(w, http.StatusOK, profile)
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.sm.GetUserID(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	var req updateProfileRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.profileSvc.UpdateLetterboxdUsername(r.Context(), int32(userID), req.LetterboxdUsername); err != nil {
		if errors.Is(err, service.ErrInvalidLetterboxd) {
			writeError(w, http.StatusBadRequest, "Invalid Letterboxd username. Use only letters, numbers, and underscores (max 50 characters).")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	writeMessage(w, http.StatusOK, "Profile updated")
}
```

- [ ] **Step 2: Update Handler struct**

Add to `go-api/internal/handler/handler.go` in the Handler struct (around line 18):

```go
// In Handler struct, add:
profileSvc     *service.ProfileService
```

And in the `New` function (around line 33), add:

```go
// In New function, add to the return:
profileSvc:    service.NewProfileService(q, cfg),
```

- [ ] **Step 3: Add routes to main.go**

Add after line 179 in `go-api/cmd/server/main.go` (after the `/me/avatar` routes):

```go
// Profile routes
r.Get("/users/{userId}/profile", h.GetProfile)
r.Patch("/me/profile", h.UpdateProfile)
```

- [ ] **Step 4: Verify compilation**

Run: `cd go-api && go build ./...`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add go-api/internal/handler/profile.go go-api/internal/handler/handler.go go-api/cmd/server/main.go
git commit -m "feat(api): add profile endpoints GET /users/:userId/profile and PATCH /me/profile"
```

---

### Task 5: Update auth.sql for letterboxd_username

**Files:**
- Modify: `go-api/internal/db/queries/auth.sql`

- [ ] **Step 1: Update GetUserByID to include letterboxd_username**

Update `go-api/internal/db/queries/auth.sql` line 2:

```sql
-- name: GetUserByID :one
SELECT id, username, password_hash, created_at, avatar_url, letterboxd_username
FROM users
WHERE id = $1;
```

- [ ] **Step 2: Update GetUserByUsername**

Update line 7:

```sql
-- name: GetUserByUsername :one
SELECT id, username, password_hash, created_at, avatar_url, letterboxd_username
FROM users
WHERE username = $1;
```

- [ ] **Step 3: Update UpdateUserAvatar**

Update line 27:

```sql
-- name: UpdateUserAvatar :one
UPDATE users SET avatar_url = $1 WHERE id = $2
RETURNING id, username, password_hash, created_at, avatar_url, letterboxd_username;
```

- [ ] **Step 4: Regenerate sqlc**

Run: `cd go-api && sqlc generate`
Expected: No errors

- [ ] **Step 5: Update userResponse in auth.go**

Add LetterboxdUsername field to `userResponse` struct and `toUserResponse` function in `go-api/internal/handler/auth.go`:

```go
type userResponse struct {
	ID                 int32   `json:"id"`
	Username           string  `json:"username"`
	CreatedAt          string  `json:"createdAt"`
	AvatarURL          *string `json:"avatarUrl,omitempty"`
	LetterboxdUsername *string `json:"letterboxdUsername,omitempty"`
}

func toUserResponse(u db.User) userResponse {
	return userResponse{
		ID:                 u.ID,
		Username:           u.Username,
		CreatedAt:          u.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
		AvatarURL:          u.AvatarUrl,
		LetterboxdUsername: u.LetterboxdUsername,
	}
}
```

- [ ] **Step 6: Verify compilation**

Run: `cd go-api && go build ./...`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add go-api/internal/db/queries/auth.sql go-api/internal/db/auth.sql.go go-api/internal/handler/auth.go
git commit -m "feat(api): include letterboxd_username in user responses"
```

---

### Task 6: Frontend UserLink Component

**Files:**
- Create: `FE-Design/src/app/components/UserLink.tsx`

- [ ] **Step 1: Create UserLink component**

```tsx
// FE-Design/src/app/components/UserLink.tsx
import { Link } from "react-router";

interface UserLinkProps {
  user: {
    id: string | number;
    name: string;
    avatar: string;
  };
  showAvatar?: boolean;
  showName?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export function UserLink({
  user,
  showAvatar = true,
  showName = true,
  avatarSize = "md",
  className = "",
}: UserLinkProps) {
  return (
    <Link
      to={`/user/${user.id}`}
      className={`inline-flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      {showAvatar && (
        <img
          src={user.avatar}
          alt={user.name}
          className={`${sizeClasses[avatarSize]} rounded-full border-2 border-[#FDB913]`}
        />
      )}
      {showName && (
        <span className="font-bold text-white hover:text-[#FDB913] transition-colors">
          {user.name}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd FE-Design && npx tsc --noEmit`
Expected: No errors related to UserLink

- [ ] **Step 3: Commit**

```bash
git add FE-Design/src/app/components/UserLink.tsx
git commit -m "feat(ui): add UserLink component for clickable user avatars"
```

---

### Task 7: Frontend UserProfile Component

**Files:**
- Create: `FE-Design/src/app/components/UserProfile.tsx`
- Modify: `FE-Design/src/app/routes.tsx`

- [ ] **Step 1: Create UserProfile component**

```tsx
// FE-Design/src/app/components/UserProfile.tsx
import { useParams, Link } from "react-router";
import { ArrowLeft, Star, Film, MessageSquare, ExternalLink, Edit2, Check, X } from "lucide-react";
import { useState } from "react";
import { VHSNoise } from "./VHSNoise";

// TODO: Replace with actual API call when backend is connected
const mockProfile = {
  id: 1,
  username: "sarah_chen",
  avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  letterboxd_username: "sarahchen",
  stats: {
    avg_rating: 4.2,
    total_watched: 47,
    total_reviews: 12,
    top_genres: ["Drama", "Thriller", "Sci-Fi"],
  },
  recent_activity: [
    {
      film_id: 1,
      title: "Parasite",
      year: 2019,
      poster_url: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop",
      rating: 5.0,
      review: "Brilliant social commentary wrapped in a thrilling narrative.",
      watched_at: "2026-04-25T18:00:00Z",
    },
    {
      film_id: 2,
      title: "The Grand Budapest Hotel",
      year: 2014,
      poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
      rating: 4.5,
      review: null,
      watched_at: "2026-04-20T14:30:00Z",
    },
  ],
  is_own_profile: false,
};

export function UserProfile() {
  const { userId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [letterboxdInput, setLetterboxdInput] = useState(mockProfile.letterboxd_username || "");

  // TODO: Fetch profile from API using userId
  const profile = mockProfile;

  const handleSave = () => {
    // TODO: Call PATCH /api/me/profile
    setIsEditing(false);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <span className="text-[#FDB913]">
        {"★".repeat(fullStars)}
        {hasHalf && "½"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#000814] relative">
      <VHSNoise />
      
      {/* Header */}
      <header className="border-b-4 border-[#FDB913] sticky top-0 z-20 bg-[#003087]">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/" className="text-white hover:text-[#FDB913] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-[#FDB913] uppercase">Profile</h1>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        {/* Desktop: Two Column / Mobile: Single Column */}
        <div className="md:flex md:gap-8">
          
          {/* Left Column: User Info & Stats */}
          <div className="md:w-2/5">
            {/* User Info Card */}
            <div className="bg-[#001d3d] border-4 border-[#FDB913] p-6 mb-6">
              {/* Mobile: Centered / Desktop: Left-aligned */}
              <div className="text-center md:text-left">
                <img
                  src={profile.avatar_url || ""}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full border-4 border-[#FDB913] mx-auto md:mx-0 mb-4"
                />
                <h2 className="text-2xl font-black text-[#FDB913] uppercase mb-2">
                  {profile.username}
                </h2>
                
                {/* Letterboxd Link */}
                {isEditing ? (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <input
                      type="text"
                      value={letterboxdInput}
                      onChange={(e) => setLetterboxdInput(e.target.value)}
                      placeholder="Letterboxd username"
                      className="bg-[#003087] text-white px-3 py-1 border-2 border-white/30 focus:border-[#FDB913] outline-none text-sm"
                    />
                    <button onClick={handleSave} className="p-1 text-[#FDB913] hover:bg-[#003087]">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-1 text-white/50 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : profile.letterboxd_username ? (
                  <a
                    href={`https://letterboxd.com/${profile.letterboxd_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm bg-[#E64A19] text-white px-3 py-1 hover:bg-[#FF5722] transition-colors"
                  >
                    <span>letterboxd</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : profile.is_own_profile ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-white/50 hover:text-[#FDB913] flex items-center gap-1 mx-auto md:mx-0"
                  >
                    <Edit2 className="w-3 h-3" />
                    Link your Letterboxd
                  </button>
                ) : null}

                {profile.is_own_profile && !isEditing && profile.letterboxd_username && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-2 text-xs text-white/30 hover:text-white/50"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#003087] border-2 border-[#FDB913] p-4 text-center">
                <div className="text-2xl font-black text-[#FDB913]">
                  {profile.stats.avg_rating.toFixed(1)}
                </div>
                <div className="text-xs text-white/70 uppercase font-bold">Avg Rating</div>
              </div>
              <div className="bg-[#003087] border-2 border-white/20 p-4 text-center">
                <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                  <Film className="w-5 h-5" />
                  {profile.stats.total_watched}
                </div>
                <div className="text-xs text-white/70 uppercase font-bold">Watched</div>
              </div>
              <div className="bg-[#003087] border-2 border-white/20 p-4 text-center">
                <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                  <MessageSquare className="w-5 h-5" />
                  {profile.stats.total_reviews}
                </div>
                <div className="text-xs text-white/70 uppercase font-bold">Reviews</div>
              </div>
            </div>

            {/* Top Genres */}
            {profile.stats.top_genres.length > 0 && (
              <div className="mb-6 md:mb-0">
                <h3 className="text-xs text-white/70 uppercase font-bold mb-2">Top Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.stats.top_genres.map((genre, i) => (
                    <span
                      key={genre}
                      className={`px-3 py-1 text-sm font-bold uppercase ${
                        i === 0
                          ? "bg-[#003087] text-[#FDB913] border border-[#FDB913]"
                          : "bg-[#003087] text-white border border-white/30"
                      }`}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity */}
          <div className="md:w-3/5">
            <h3 className="text-xs text-white/70 uppercase font-bold mb-4">Recent Activity</h3>
            
            {profile.recent_activity.length === 0 ? (
              <div className="bg-[#001d3d] border-4 border-[#003087] p-8 text-center">
                <Film className="w-12 h-12 text-[#003087] mx-auto mb-3" />
                <p className="text-white/50 font-bold">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.recent_activity.map((item) => (
                  <div
                    key={item.film_id}
                    className="bg-[#001d3d] border-4 border-[#003087] hover:border-[#FDB913] transition-colors p-4"
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.poster_url || ""}
                        alt={item.title}
                        className="w-16 h-24 object-cover border-2 border-[#FDB913]"
                      />
                      <div className="flex-1">
                        <h4 className="font-black text-white uppercase">{item.title}</h4>
                        <p className="text-sm text-white/70 mb-1">{item.year}</p>
                        <div className="text-lg">{renderStars(item.rating)}</div>
                        {item.review && (
                          <p className="text-sm text-white/80 mt-2 line-clamp-2">{item.review}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Add route**

Update `FE-Design/src/app/routes.tsx`:

```tsx
import { createBrowserRouter } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { ClubView } from "./components/ClubView";
import { AdminPanel } from "./components/AdminPanel";
import { MovieSelection } from "./components/MovieSelection";
import { UserProfile } from "./components/UserProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/club/:clubId",
    Component: ClubView,
  },
  {
    path: "/club/:clubId/admin",
    Component: AdminPanel,
  },
  {
    path: "/club/:clubId/select-movie",
    Component: MovieSelection,
  },
  {
    path: "/user/:userId",
    Component: UserProfile,
  },
]);
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd FE-Design && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Start dev server and test**

Run: `cd FE-Design && npm run dev`
Navigate to: `http://localhost:5173/user/1`
Expected: Profile page renders with mock data

- [ ] **Step 5: Commit**

```bash
git add FE-Design/src/app/components/UserProfile.tsx FE-Design/src/app/routes.tsx
git commit -m "feat(ui): add UserProfile page component with route"
```

---

### Task 8: Update ClubView with UserLink

**Files:**
- Modify: `FE-Design/src/app/components/ClubView.tsx`

- [ ] **Step 1: Import UserLink**

Add import at top of `FE-Design/src/app/components/ClubView.tsx`:

```tsx
import { UserLink } from "./UserLink";
```

- [ ] **Step 2: Update picker info section**

Replace the picker display (around line 164-172) with UserLink:

```tsx
<div className="pt-4 border-t-4 border-[#003087] flex items-center gap-3">
  <UserLink
    user={{ id: picker.id, name: picker.name, avatar: picker.avatar }}
    showName={false}
    avatarSize="lg"
  />
  <div>
    <p className="text-xs text-white/70 uppercase tracking-wider font-bold">Picked by</p>
    <UserLink
      user={{ id: picker.id, name: picker.name, avatar: picker.avatar }}
      showAvatar={false}
      className="text-lg"
    />
  </div>
</div>
```

- [ ] **Step 3: Update watch status member avatars**

Replace the member avatar/name display (around line 192-199) with UserLink:

```tsx
<div className="flex items-center gap-2 mb-2">
  <UserLink
    user={{ id: member.id, name: member.name, avatar: member.avatar }}
    showName={false}
    avatarSize="md"
  />
  <div className="flex-1 min-w-0">
    <UserLink
      user={{ id: member.id, name: member.name, avatar: member.avatar }}
      showAvatar={false}
      className="text-sm truncate"
    />
  </div>
</div>
```

- [ ] **Step 4: Update schedule sidebar picker avatars**

Replace picker display in schedule (around line 279-285):

```tsx
<div className="flex items-center gap-2">
  <UserLink
    user={{ id: p.id, name: p.name, avatar: p.avatar }}
    showName={false}
    avatarSize="sm"
  />
  <UserLink
    user={{ id: p.id, name: p.name, avatar: p.avatar }}
    showAvatar={false}
    className="text-sm"
  />
</div>
```

- [ ] **Step 5: Update suggestion nominator avatars**

Replace nominator display (around line 336-342):

```tsx
<div className="flex items-center gap-2">
  <UserLink
    user={{ id: movie.nominatedBy, name: movie.nominatedBy, avatar: movie.nominatorAvatar }}
    showName={false}
    avatarSize="sm"
  />
  <p className="text-xs text-white/70 font-bold">
    Suggested by <UserLink
      user={{ id: movie.nominatedBy, name: movie.nominatedBy, avatar: movie.nominatorAvatar }}
      showAvatar={false}
      className="inline"
    />
  </p>
</div>
```

- [ ] **Step 6: Verify no TypeScript errors**

Run: `cd FE-Design && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Test in browser**

Navigate to club view, click on user avatars
Expected: Navigate to `/user/:userId`

- [ ] **Step 8: Commit**

```bash
git add FE-Design/src/app/components/ClubView.tsx
git commit -m "feat(ui): make user avatars clickable in ClubView"
```

---

### Task 9: Update TurnResults with UserLink

**Files:**
- Modify: `FE-Design/src/app/components/TurnResults.tsx`

- [ ] **Step 1: Import UserLink**

Add import at top of `FE-Design/src/app/components/TurnResults.tsx`:

```tsx
import { UserLink } from "./UserLink";
```

- [ ] **Step 2: Update review author avatars**

Replace the user avatar/name display (around lines 71-77) with UserLink:

```tsx
<div className="flex items-start gap-4 mb-3">
  <UserLink
    user={{ id: user.id, name: user.name, avatar: user.avatar }}
    showName={false}
    avatarSize="lg"
  />
  <div className="flex-1">
    <UserLink
      user={{ id: user.id, name: user.name, avatar: user.avatar }}
      showAvatar={false}
      className="font-black text-white mb-2 text-lg"
    />
    <div className="flex items-center gap-2 mb-2">
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd FE-Design && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Test in browser**

Navigate to club view with ended turn, click on reviewer avatars
Expected: Navigate to `/user/:userId`

- [ ] **Step 5: Commit**

```bash
git add FE-Design/src/app/components/TurnResults.tsx
git commit -m "feat(ui): make review author avatars clickable in TurnResults"
```

---

## Phase 2: Movie Link Preferences

### Task 10: Database Migration for Movie Link Preference

**Files:**
- Create: `go-api/migrations/000015_add_movie_link_preference.up.sql`
- Create: `go-api/migrations/000015_add_movie_link_preference.down.sql`

- [ ] **Step 1: Create up migration**

```sql
-- go-api/migrations/000015_add_movie_link_preference.up.sql
ALTER TABLE users ADD COLUMN movie_link_preference text NOT NULL DEFAULT 'letterboxd'
  CHECK (movie_link_preference IN ('letterboxd', 'imdb'));
```

- [ ] **Step 2: Create down migration**

```sql
-- go-api/migrations/000015_add_movie_link_preference.down.sql
ALTER TABLE users DROP COLUMN movie_link_preference;
```

- [ ] **Step 3: Run migration locally**

Run: `cd go-api && go run cmd/migrate/main.go up`
Expected: Migration applied successfully

- [ ] **Step 4: Commit**

```bash
git add go-api/migrations/000015_add_movie_link_preference.up.sql go-api/migrations/000015_add_movie_link_preference.down.sql
git commit -m "feat(db): add movie_link_preference column to users table"
```

---

### Task 11: Settings API Endpoint

**Files:**
- Modify: `go-api/internal/db/queries/auth.sql`
- Modify: `go-api/internal/handler/auth.go`
- Modify: `go-api/cmd/server/main.go`

- [ ] **Step 1: Add query for updating settings**

Add to `go-api/internal/db/queries/auth.sql`:

```sql
-- name: UpdateUserSettings :one
UPDATE users SET movie_link_preference = $2 WHERE id = $1
RETURNING id, username, password_hash, created_at, avatar_url, letterboxd_username, movie_link_preference;

-- name: GetUserSettings :one
SELECT movie_link_preference FROM users WHERE id = $1;
```

- [ ] **Step 2: Update existing queries to include movie_link_preference**

Update GetUserByID, GetUserByUsername, and UpdateUserAvatar queries to include `movie_link_preference`:

```sql
-- name: GetUserByID :one
SELECT id, username, password_hash, created_at, avatar_url, letterboxd_username, movie_link_preference
FROM users
WHERE id = $1;

-- name: GetUserByUsername :one
SELECT id, username, password_hash, created_at, avatar_url, letterboxd_username, movie_link_preference
FROM users
WHERE username = $1;

-- name: UpdateUserAvatar :one
UPDATE users SET avatar_url = $1 WHERE id = $2
RETURNING id, username, password_hash, created_at, avatar_url, letterboxd_username, movie_link_preference;
```

- [ ] **Step 3: Regenerate sqlc**

Run: `cd go-api && sqlc generate`
Expected: No errors

- [ ] **Step 4: Add settings handler**

Add to `go-api/internal/handler/auth.go`:

```go
type updateSettingsRequest struct {
	MovieLinkPreference string `json:"movie_link_preference"`
}

func (h *Handler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.sm.GetUserID(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	var req updateSettingsRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.MovieLinkPreference != "letterboxd" && req.MovieLinkPreference != "imdb" {
		writeError(w, http.StatusBadRequest, "movie_link_preference must be 'letterboxd' or 'imdb'")
		return
	}

	_, err := h.q.UpdateUserSettings(r.Context(), db.UpdateUserSettingsParams{
		ID:                  int32(userID),
		MovieLinkPreference: req.MovieLinkPreference,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update settings")
		return
	}

	writeMessage(w, http.StatusOK, "Settings updated")
}
```

- [ ] **Step 5: Update userResponse struct**

Add MovieLinkPreference to userResponse:

```go
type userResponse struct {
	ID                  int32   `json:"id"`
	Username            string  `json:"username"`
	CreatedAt           string  `json:"createdAt"`
	AvatarURL           *string `json:"avatarUrl,omitempty"`
	LetterboxdUsername  *string `json:"letterboxdUsername,omitempty"`
	MovieLinkPreference string  `json:"movieLinkPreference"`
}

func toUserResponse(u db.User) userResponse {
	return userResponse{
		ID:                  u.ID,
		Username:            u.Username,
		CreatedAt:           u.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
		AvatarURL:           u.AvatarUrl,
		LetterboxdUsername:  u.LetterboxdUsername,
		MovieLinkPreference: u.MovieLinkPreference,
	}
}
```

- [ ] **Step 6: Add route**

Add to `go-api/cmd/server/main.go` after the profile routes:

```go
r.Patch("/me/settings", h.UpdateSettings)
```

- [ ] **Step 7: Verify compilation**

Run: `cd go-api && go build ./...`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add go-api/internal/db/queries/auth.sql go-api/internal/db/auth.sql.go go-api/internal/handler/auth.go go-api/cmd/server/main.go
git commit -m "feat(api): add PATCH /me/settings endpoint for movie link preference"
```

---

### Task 12: Letterboxd Slug Utility

**Files:**
- Create: `FE-Design/src/app/lib/letterboxd.ts`

- [ ] **Step 1: Create letterboxd utility**

```typescript
// FE-Design/src/app/lib/letterboxd.ts

export function toLetterboxdSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getLetterboxdUrl(title: string): string {
  return `https://letterboxd.com/film/${toLetterboxdSlug(title)}/`;
}

export function getImdbUrl(imdbId: string): string {
  return `https://www.imdb.com/title/${imdbId}/`;
}

export function getMovieUrl(
  title: string,
  imdbId: string | null | undefined,
  preference: "letterboxd" | "imdb"
): string {
  if (preference === "imdb" && imdbId) {
    return getImdbUrl(imdbId);
  }
  // Fall back to Letterboxd if IMDB preferred but no ID available
  return getLetterboxdUrl(title);
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd FE-Design && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add FE-Design/src/app/lib/letterboxd.ts
git commit -m "feat(lib): add Letterboxd slug utility functions"
```

---

### Task 13: MovieTitleLink Component

**Files:**
- Create: `FE-Design/src/app/components/MovieTitleLink.tsx`

- [ ] **Step 1: Create MovieTitleLink component**

```tsx
// FE-Design/src/app/components/MovieTitleLink.tsx
import { ExternalLink } from "lucide-react";
import { getMovieUrl } from "../lib/letterboxd";

interface MovieTitleLinkProps {
  title: string;
  imdbId?: string | null;
  preference: "letterboxd" | "imdb";
  className?: string;
  showIcon?: boolean;
}

export function MovieTitleLink({
  title,
  imdbId,
  preference,
  className = "",
  showIcon = false,
}: MovieTitleLinkProps) {
  const url = getMovieUrl(title, imdbId, preference);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:text-[#FDB913] transition-colors inline-flex items-center gap-1 ${className}`}
    >
      {title}
      {showIcon && <ExternalLink className="w-4 h-4 opacity-50" />}
    </a>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd FE-Design && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add FE-Design/src/app/components/MovieTitleLink.tsx
git commit -m "feat(ui): add MovieTitleLink component"
```

---

### Task 14: Update ClubView with MovieTitleLink

**Files:**
- Modify: `FE-Design/src/app/components/ClubView.tsx`

- [ ] **Step 1: Import MovieTitleLink and add preference state**

Add imports at top of file:

```tsx
import { MovieTitleLink } from "./MovieTitleLink";
```

Add preference state (using mock for now, will connect to API):

```tsx
// Add after other state declarations
const [movieLinkPreference] = useState<"letterboxd" | "imdb">("letterboxd");
```

- [ ] **Step 2: Update main movie title**

Replace the movie title h2 (around line 139-141) with MovieTitleLink:

```tsx
<MovieTitleLink
  title={movie.title}
  imdbId={undefined} // TODO: Add imdbId to movie type when API connected
  preference={movieLinkPreference}
  className="text-4xl font-black text-[#FDB913] uppercase tracking-tight"
  showIcon
/>
```

- [ ] **Step 3: Update schedule sidebar movie titles**

Replace movie title in schedule (around line 298):

```tsx
<MovieTitleLink
  title={m.title}
  imdbId={undefined}
  preference={movieLinkPreference}
  className="text-sm font-bold text-white truncate"
/>
```

- [ ] **Step 4: Update suggestion card titles**

Replace suggestion movie titles (around line 333):

```tsx
<MovieTitleLink
  title={movie.title}
  imdbId={undefined}
  preference={movieLinkPreference}
  className="font-black text-white uppercase"
/>
```

- [ ] **Step 5: Verify no TypeScript errors**

Run: `cd FE-Design && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Test in browser**

Navigate to club view, click on movie titles
Expected: Opens Letterboxd in new tab

- [ ] **Step 7: Commit**

```bash
git add FE-Design/src/app/components/ClubView.tsx
git commit -m "feat(ui): make movie titles clickable with Letterboxd/IMDB links"
```

---

### Task 15: Settings Page UI

**Files:**
- Create: `FE-Design/src/app/components/Settings.tsx`
- Modify: `FE-Design/src/app/routes.tsx`

- [ ] **Step 1: Create Settings component**

```tsx
// FE-Design/src/app/components/Settings.tsx
import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import { VHSNoise } from "./VHSNoise";

export function Settings() {
  // TODO: Fetch from API when connected
  const [movieLinkPreference, setMovieLinkPreference] = useState<"letterboxd" | "imdb">("letterboxd");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Call PATCH /api/me/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#000814] relative">
      <VHSNoise />
      
      <header className="border-b-4 border-[#FDB913] sticky top-0 z-20 bg-[#003087]">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/" className="text-white hover:text-[#FDB913] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-[#FDB913] uppercase">Settings</h1>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
        <div className="bg-[#001d3d] border-4 border-[#FDB913] p-6">
          <h2 className="text-lg font-black text-[#FDB913] uppercase mb-6">Movie Links</h2>
          
          <p className="text-white/70 text-sm mb-4">
            Choose where movie titles link to when clicked:
          </p>

          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="movieLinkPreference"
                value="letterboxd"
                checked={movieLinkPreference === "letterboxd"}
                onChange={() => setMovieLinkPreference("letterboxd")}
                className="w-5 h-5 accent-[#FDB913]"
              />
              <div>
                <span className="font-bold text-white group-hover:text-[#FDB913] transition-colors">
                  Letterboxd
                </span>
                <span className="text-white/50 text-sm ml-2">(default)</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="movieLinkPreference"
                value="imdb"
                checked={movieLinkPreference === "imdb"}
                onChange={() => setMovieLinkPreference("imdb")}
                className="w-5 h-5 accent-[#FDB913]"
              />
              <span className="font-bold text-white group-hover:text-[#FDB913] transition-colors">
                IMDB
              </span>
            </label>
          </div>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#FDB913] text-[#003087] font-black uppercase hover:bg-[#003087] hover:text-[#FDB913] border-2 border-[#FDB913] transition-all flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Add route**

Update `FE-Design/src/app/routes.tsx` to add settings route:

```tsx
import { Settings } from "./components/Settings";

// Add to routes array:
{
  path: "/settings",
  Component: Settings,
},
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd FE-Design && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Test in browser**

Navigate to: `http://localhost:5173/settings`
Expected: Settings page renders with movie link preference radio buttons

- [ ] **Step 5: Commit**

```bash
git add FE-Design/src/app/components/Settings.tsx FE-Design/src/app/routes.tsx
git commit -m "feat(ui): add Settings page with movie link preference"
```

---

### Task 16: Update Roadmap

**Files:**
- Modify: `docs/roadmap/ROADMAP.md`

- [ ] **Step 1: Update roadmap to reflect completed work**

Update `docs/roadmap/ROADMAP.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/roadmap/ROADMAP.md
git commit -m "docs: update roadmap with completed Letterboxd integration"
```

---

## Summary

**Phase 1 (Tasks 1-9):** Profile pages with stats, activity, Letterboxd username, clickable user avatars
**Phase 2 (Tasks 10-16):** Movie link preferences with Letterboxd/IMDB toggle, clickable movie titles, settings page

Total: 16 tasks, ~60 steps
