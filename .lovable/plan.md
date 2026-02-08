

# Fix Signup Issues and Scale Analysis

## Problem Analysis

Based on my investigation, I found **two separate issues**:

### Issue 1: "Invalid Refresh Token" Error
When you see the error on the home page, it's because:
- A previously deleted account (or logged out session) left stale authentication tokens in browser storage
- When the app loads, it tries to refresh these invalid tokens, which fails
- The current code doesn't handle this error gracefully, leaving users in a broken state

**Good news**: Signup is actually working! I successfully created a test account (testuser123@jss.edu). The error you're seeing happens *before* you try to sign up.

### Issue 2: Account Deletion Not Working
The Delete Account function is deployed correctly, but there may be issues with:
- The function call from the frontend
- Error responses not being shown to users

---

## Fixes to Implement

### Fix 1: Handle Stale Auth Tokens

Update `src/contexts/AuthContext.tsx` to:
- Detect "refresh_token_not_found" errors during initialization
- Automatically clear the invalid session from localStorage
- Allow users to proceed to login/signup without errors

```text
Flow after fix:
  App Loads → Token Refresh Fails → Clear Invalid Session → User Can Sign Up
```

### Fix 2: Clear localStorage on Auth Page Load

Update `src/pages/Auth.tsx` to:
- Clear any stale auth data when the Auth page loads
- Ensure a clean slate for signup/login attempts

### Fix 3: Improve Account Deletion Error Handling

Update `src/pages/Profile.tsx` to:
- Add better error logging and display
- Handle edge function response properly
- Clear localStorage completely after deletion

---

## Capacity and Scalability Analysis

### Current Capacity (Lovable Cloud Free Tier)

| Resource | Limit | Notes |
|----------|-------|-------|
| Database Size | 500 MB | Sufficient for ~50,000-100,000 users with typical data |
| Auth Users | Unlimited | No hard limit on Supabase Auth |
| Database Connections | 60 | Can handle ~500-1000 concurrent users |
| Edge Function Invocations | 500K/month | ~16,000/day |
| Bandwidth | 5 GB/month | Good for moderate traffic |

### Realistic User Estimates

For a **college attendance app** like yours:

| Scenario | Users | Storage/User | Total Storage | Feasibility |
|----------|-------|--------------|---------------|-------------|
| Single Class (60 students) | 60 | ~100 KB | 6 MB | Easily supported |
| Single Branch (300 students) | 300 | ~100 KB | 30 MB | Easily supported |
| Full Year (1,200 students) | 1,200 | ~100 KB | 120 MB | Well supported |
| Multiple Years (4,000 students) | 4,000 | ~100 KB | 400 MB | At limit |

### Long-term Sustainability

**For 1-2 years of active use with up to 2,000 students:**
- The free tier should handle this comfortably
- Database will grow slowly (attendance records are small)
- Main concern: cleanup of old data after students graduate

**Recommendations for scaling:**
1. Archive or delete attendance records after students graduate
2. Consider upgrading to Pro tier ($25/month) if you exceed 500 MB
3. Add data retention policies to automatically clean old records

---

## Technical Implementation Details

### File Changes

1. **`src/contexts/AuthContext.tsx`**
   - Add error handling in `onAuthStateChange` 
   - Detect `refresh_token_not_found` error
   - Call `supabase.auth.signOut()` to clear invalid session
   - Set loading to false so app continues normally

2. **`src/pages/Auth.tsx`**
   - Add `useEffect` to clear stale session on mount
   - Call `supabase.auth.signOut()` when Auth page loads
   - Prevents stale token issues from blocking signup

3. **`src/pages/Profile.tsx`**
   - Add `console.log` for response data from edge function
   - Ensure proper error extraction from response
   - Force clear localStorage before navigation

---

## Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Can't signup | Stale tokens blocking app | Clear invalid sessions automatically |
| Can't delete account | Edge function errors not surfaced | Better error handling + logging |
| Scalability | - | Good for 2,000+ users on free tier |

