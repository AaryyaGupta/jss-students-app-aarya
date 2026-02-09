

# Fix: Signup Failing Due to Duplicate Roll Number Constraint

## Root Cause

The signup error is **not** a stale token issue. The actual error from the backend logs is:

```
duplicate key value violates unique constraint "profiles_roll_number_key"
```

When a new user signs up, a database trigger (`handle_new_user`) automatically creates a profile row. The `profiles` table has a **unique constraint on `roll_number`**. If the roll number already exists (from a previous account, test data, or another user), the signup fails with a 500 error and shows a generic "unexpected_failure" message.

## Evidence

The profiles table currently contains test/leftover entries:
- `testuser123@jss.edu` with roll number `1JS21CS001`
- Multiple entries with similar roll numbers (`25CSEAIML026` vs `25cse-aiml026`)

## Fixes

### 1. Clean Up Orphaned Profile Records
Delete the test account profile that was created during earlier debugging:
- Remove `testuser123@jss.edu` profile (roll number `1JS21CS001`)

### 2. Update the `handle_new_user` Trigger
Modify the database trigger to handle duplicate roll numbers gracefully using `ON CONFLICT`. Instead of failing the entire signup, it will update the existing profile row if a roll number collision occurs. This prevents 500 errors.

### 3. Improve Frontend Error Messages
Update `Auth.tsx` to show a user-friendly message when signup fails due to a duplicate roll number, instead of the generic "unexpected_failure" error. The signup handler will catch 500 errors and suggest the user check if they already have an account.

## Technical Details

### Database Migration
```sql
-- Clean up test data
DELETE FROM profiles WHERE email = 'testuser123@jss.edu';

-- Update trigger to handle conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, branch, batch, roll_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'branch',
    NEW.raw_user_meta_data->>'batch',
    NEW.raw_user_meta_data->>'roll_number'
  )
  ON CONFLICT (roll_number) DO UPDATE SET
    id = NEW.id,
    email = NEW.email,
    name = NEW.raw_user_meta_data->>'name',
    branch = NEW.raw_user_meta_data->>'branch',
    batch = NEW.raw_user_meta_data->>'batch';

  INSERT INTO public.user_roles (userid, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
```

### `src/pages/Auth.tsx`
- Add a catch for 500 errors during signup that displays: "Signup failed. This roll number may already be in use. If you already have an account, try logging in instead."

## Result
- Signups will no longer fail due to duplicate roll numbers
- Orphaned test data is cleaned up
- Users get clear error messages instead of cryptic failures
