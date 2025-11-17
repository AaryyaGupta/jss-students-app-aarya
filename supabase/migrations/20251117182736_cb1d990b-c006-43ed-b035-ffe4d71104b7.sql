-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('student', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  branch TEXT NOT NULL CHECK (branch IN ('CSE', 'CSE-AIML', 'IT', 'CS-DS')),
  batch TEXT NOT NULL CHECK (
    (branch = 'CSE' AND batch IN ('A1', 'A2', 'A3')) OR
    (branch = 'CSE-AIML' AND batch IN ('A4', 'A5', 'A6')) OR
    (branch = 'IT' AND batch IN ('B1', 'B2', 'B3')) OR
    (branch = 'CS-DS' AND batch = 'B4')
  ),
  roll_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(userid, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = userid);

-- Create timetable table
CREATE TABLE public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  batch TEXT NOT NULL,
  subject TEXT NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  is_batch_wide BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on timetable
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- RLS policies for timetable
CREATE POLICY "Users can view timetable for their batch"
  ON public.timetable FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.batch = timetable.batch
    )
  );

-- Create calendar table for holidays/events
CREATE TABLE public.calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'holiday',
  is_institution_wide BOOLEAN DEFAULT false,
  batch TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on calendar
ALTER TABLE public.calendar ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar
CREATE POLICY "Users can view institution-wide calendar"
  ON public.calendar FOR SELECT
  USING (is_institution_wide = true);

CREATE POLICY "Users can view their own calendar entries"
  ON public.calendar FOR SELECT
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert their own calendar entries"
  ON public.calendar FOR INSERT
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own calendar entries"
  ON public.calendar FOR UPDATE
  USING (auth.uid() = userid);

CREATE POLICY "Users can delete their own calendar entries"
  ON public.calendar FOR DELETE
  USING (auth.uid() = userid);

-- Create attendance_record table
CREATE TABLE public.attendance_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'cancelled')),
  swapped_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(userid, date, subject)
);

-- Enable RLS on attendance_record
ALTER TABLE public.attendance_record ENABLE ROW LEVEL SECURITY;

-- RLS policies for attendance_record
CREATE POLICY "Users can view their own attendance"
  ON public.attendance_record FOR SELECT
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert their own attendance"
  ON public.attendance_record FOR INSERT
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own attendance"
  ON public.attendance_record FOR UPDATE
  USING (auth.uid() = userid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_timetable_updated_at
  BEFORE UPDATE ON public.timetable
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance_record
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (userid, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();