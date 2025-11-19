-- Drop the old policy
DROP POLICY IF EXISTS "Users can view timetable for their batch" ON timetable;

-- Create new policy with LIKE matching for batch prefix
CREATE POLICY "Users can view timetable for their batch"
ON timetable
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND timetable.batch LIKE profiles.batch || '%'
  )
);