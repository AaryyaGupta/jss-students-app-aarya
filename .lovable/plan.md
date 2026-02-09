
# Fix Plan: Persistent Login, Duplicate Classes, and Slow Loading

## Issue 1: Login Not Persisting (Session Cleared on Every Visit)

**Root Cause**: The Auth page (`src/pages/Auth.tsx`) has a `useEffect` that calls `supabase.auth.signOut()` every time it mounts. This was added to clear stale sessions, but it also destroys valid sessions. Combined with the Index page redirecting logged-in users to `/dashboard`, the flow works — but if a user ever lands on `/auth` (e.g., bookmark, direct URL), their session is wiped.

The real fix: Supabase already saves login sessions in localStorage automatically. We just need to stop destroying them unnecessarily.

**Fix**: Remove the `signOut()` on Auth page mount. Instead, redirect already-logged-in users away from the Auth page.

## Issue 2: Classes Showing Twice

**Root Cause**: The Dashboard makes two overlapping database queries:
1. Query 1: All classes matching the user's batch (`.like("batch", "A5%")`) -- this already includes batch-wide classes
2. Query 2: Batch-wide classes matching the same batch filter

Since batch-wide classes match both queries, they get added twice. The deduplication map uses `room` in the key, but room can vary, causing duplicates to slip through.

**Fix**: Remove the second query entirely. The first query already fetches all classes for the batch (both batch-wide and non-batch-wide). This also improves loading speed by eliminating one unnecessary database call.

## Issue 3: Slow Loading

**Root Cause**: The Dashboard's `fetchTodayClasses` function makes **5 sequential/parallel database calls**:
1. `supabase.auth.getUser()` (redundant -- user is already in AuthContext)
2. Profile fetch (redundant -- already fetched by `fetchProfile()`)
3. Holiday check
4. Classes query
5. Batch-wide classes query (redundant -- duplicate of #4)
6. Attendance records query

**Fix**:
- Remove redundant `getUser()` call -- use `user` from AuthContext
- Reuse the profile data from `fetchProfile()` instead of fetching it again
- Remove the duplicate batch-wide query
- This reduces 6 database calls down to 3 (profile, timetable+holidays, attendance)

## Technical Details

### Files to Change

**1. `src/pages/Auth.tsx`**
- Remove the `useEffect` that calls `signOut()` on mount
- Add a check: if user is already logged in, redirect to `/dashboard`
- This preserves sessions across visits (the "remember device" behavior)

**2. `src/pages/Dashboard.tsx`**
- Remove redundant `supabase.auth.getUser()` call; use `user` from `useAuth()`
- Share profile data between `fetchProfile` and `fetchTodayClasses` instead of fetching twice
- Remove the second batch-wide classes query (already included in first query)
- Simplify deduplication to just use `subject + start_time + end_time + day` as the key (drop room)
- Reduce total database calls from 6 to 3

**3. `src/contexts/AuthContext.tsx`**
- No changes needed; session persistence already works correctly here

### Result
- Users stay logged in across browser sessions (no re-entering credentials)
- Classes appear once, not twice
- Dashboard loads roughly 2x faster (half the database calls)
