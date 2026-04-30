# Inline Turn Results Design

**Date:** 2026-04-30  
**Status:** Draft  
**Author:** Claude + Adnan

## Summary

Consolidate the separate "Full Results" page (`/groups/:id/results`) into the normal group turn view (`/groups/:id`). When a turn has completed and results are released, the group view displays the results content inline instead of requiring navigation to a separate page.

## Goals

1. Eliminate the need for a separate results page by showing results inline
2. Maintain the existing movie display with "Picked by" attribution
3. Hide the "Watch Status" section for completed turns
4. Add a "Shame Dungeon" section for members who didn't participate
5. Update dashboard "Recently Watched" links to navigate to the group view
6. Preserve backwards compatibility by redirecting old results URLs

## Non-Goals

- Changing the backend API structure
- Adding new sorting/filtering options for reviews (noted for future work)
- Modifying how results availability is calculated

## Design

### Architecture Overview

```
group-detail.tsx
├── TurnStatusBanner (unchanged)
├── CurrentTurnMovie (unchanged - shows movie + metadata + "Picked by")
├── VerdictForm (shown if votingOpen OR admin re-opened window)
├── TurnResultsInline (NEW - shown when resultsAvailable)
│   ├── ResultsSummary (collapsible, default open)
│   │   ├── Score cards (average rating, participation)
│   │   └── Distribution chart
│   ├── MemberReviews (sorted by rating desc)
│   └── ShameDungeon (dimmed non-participants)
└── Watch Status section (HIDDEN when resultsAvailable)
```

### Component Changes

#### 1. New Component: `TurnResultsInline.tsx`

Location: `artifacts/movie-club/src/domains/verdicts/components/TurnResultsInline.tsx`

This component encapsulates all results UI and is rendered in `group-detail.tsx` when `resultsAvailable` is true.

**Props:**
```typescript
interface TurnResultsInlineProps {
  groupId: number;
  selectedWeek: string;
  members: GroupMember[];  // Full member list for shame dungeon
}
```

**Behavior:**
- Fetches verdicts data using `useGetVerdicts` hook
- Only renders when data is successfully fetched
- Shows loading skeleton while fetching
- Gracefully handles errors (shows "Results unavailable" message)

**Sub-components:**

##### ResultsSummary (collapsible section)
- Contains average rating card + participation card + distribution chart
- Collapsible via a single toggle button
- Default state: expanded
- Uses local state for collapse toggle

##### MemberReviews
- Lists all verdicts with ratings, sorted by rating (highest first)
- Each review shows: username, 5-star display, numeric rating, review text, reaction bar
- Same styling as current results page

##### ShameDungeon
- Header: "Shame Dungeon" with `Skull` icon from Lucide
- Lists members who did NOT submit a rating (i.e., members from `group.members` whose `id` is not present in the verdicts response with a non-null rating)
- Member cards styled with `opacity-50` class
- Same card layout as current Watch Status grid but dimmed
- No admin action buttons in this section

#### 2. Modified: `group-detail.tsx`

Changes:
- Import and conditionally render `TurnResultsInline` when `group.resultsAvailable` is true
- Conditionally hide "Watch Status" section when `resultsAvailable` is true
- Keep `VerdictForm` rendering logic, but ensure it appears ABOVE `TurnResultsInline` when admin has re-opened voting

**Conditional rendering logic:**
```tsx
{/* Verdict form - shown when voting is open */}
{status?.votingOpen && movie && (
  <VerdictForm ... />
)}

{/* Results - shown when available */}
{group.resultsAvailable && (
  <TurnResultsInline
    groupId={groupId}
    selectedWeek={selectedWeek}
    members={group.members}
  />
)}

{/* Watch Status - ONLY shown when results NOT available */}
{!group.resultsAvailable && (
  <div className="p-6 mb-6">
    <h3>Watch Status</h3>
    ...
  </div>
)}
```

#### 3. Modified: `VerdictList.tsx`

This component currently just shows a "View Full Results" button. Options:
- **Option A:** Delete it entirely since results are now inline
- **Option B:** Repurpose it as a wrapper/alias for `TurnResultsInline`

**Decision:** Delete `VerdictList.tsx` - its functionality is replaced by `TurnResultsInline`.

#### 4. Modified: `RecentVerdictsList.tsx`

Change the navigation target from results page to group view:

```tsx
// Before
onClick={() => setLocation(`/groups/${result.groupId}/results?weekOf=${result.weekOf}`)}

// After
onClick={() => setLocation(`/groups/${result.groupId}?weekOf=${result.weekOf}`)}
```

#### 5. Modified: `group-results.tsx`

Convert to a redirect component:

```tsx
export default function GroupResults() {
  const params = useParams<{ groupId: string }>();
  const search = useSearch();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const qp = new URLSearchParams(search);
    const weekOf = qp.get("weekOf");
    const target = weekOf 
      ? `/groups/${params.groupId}?weekOf=${weekOf}`
      : `/groups/${params.groupId}`;
    setLocation(target, { replace: true });
  }, [params.groupId, search, setLocation]);
  
  return null; // or loading spinner
}
```

### Data Flow

```
1. User navigates to /groups/:id (or /groups/:id?weekOf=...)
2. group-detail.tsx fetches group data via useGetGroup
3. If group.resultsAvailable is true:
   a. TurnResultsInline mounts
   b. TurnResultsInline fetches verdicts via useGetVerdicts
   c. Results render inline
4. If resultsAvailable is false:
   a. TurnResultsInline does not render
   b. Watch Status section renders instead
5. If admin re-opens voting (votingOpen becomes true while resultsAvailable is also true):
   a. VerdictForm renders above TurnResultsInline
   b. User can submit/edit their verdict
   c. Results remain visible below
```

### Security Guards

**Frontend guards:**
1. `TurnResultsInline` only rendered when `group.resultsAvailable` is true
2. `useGetVerdicts` hook only called within `TurnResultsInline` (which only mounts when allowed)
3. Error boundary handles any unexpected API failures gracefully

**Backend guards (already in place):**
1. `GetVerdicts` service checks `isResultsAvailable()` before returning data
2. Returns error "results are not available yet" if premature
3. Membership verification prevents non-members from accessing any data

### UI/UX Details

#### Collapsible Results Summary
- Toggle button with `ChevronDown` icon when expanded, `ChevronUp` when collapsed
- Click target: the entire header row (icon + label)
- Label: "Final Results"
- Uses CSS `transition-all` for smooth collapse animation
- State managed via `useState<boolean>(true)` (default expanded)
- Content hidden via conditional rendering or `hidden` class when collapsed

#### Shame Dungeon Styling
- Section header: "Shame Dungeon" with `Skull` icon from Lucide
- Container: `border-4 border-secondary bg-card` (not primary highlight)
- Member cards: same 2-4 column grid layout as Watch Status
- Card opacity: `opacity-50` class on each card container
- No admin action buttons (dropdown menu hidden for this section)

#### Member Reviews
- Sorted by rating descending (highest first)
- Same card styling as current results page
- Includes reaction bar for each review
- Reviews without text still show rating

**Future Enhancement (TODO in code):**
```typescript
// TODO: Add sorting/filtering options for reviews
// Options to consider: by rating, by reaction count, by submission time
// See design doc: 2026-04-30-inline-turn-results-design.md
```

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `TurnResultsInline.tsx` | Create | New component for inline results |
| `group-detail.tsx` | Modify | Add TurnResultsInline, conditionally hide Watch Status |
| `VerdictList.tsx` | Delete | Replaced by TurnResultsInline |
| `RecentVerdictsList.tsx` | Modify | Change link target to group view |
| `group-results.tsx` | Modify | Convert to redirect |

### Testing Considerations

1. **Results visibility guard:** Verify results don't render when `resultsAvailable` is false
2. **Admin re-open flow:** Verify VerdictForm appears above results when voting re-opened
3. **Shame dungeon accuracy:** Verify correct members appear (those who did not submit a rating)
4. **Redirect functionality:** Verify old results URLs redirect correctly with weekOf param preserved
5. **Dashboard links:** Verify "Recently Watched" navigates to group view with correct weekOf
6. **Collapsible state:** Verify summary section toggles correctly and persists reasonable UX

### Migration Notes

- No database changes required
- No API changes required
- Old bookmarks to `/groups/:id/results?weekOf=...` will automatically redirect
- Feature is backwards compatible
