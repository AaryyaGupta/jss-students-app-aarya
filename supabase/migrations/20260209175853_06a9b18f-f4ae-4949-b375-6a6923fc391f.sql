
-- Clean up test data
DELETE FROM profiles WHERE email = 'testuser123@jss.edu';

-- Update trigger to handle conflicts gracefully
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
