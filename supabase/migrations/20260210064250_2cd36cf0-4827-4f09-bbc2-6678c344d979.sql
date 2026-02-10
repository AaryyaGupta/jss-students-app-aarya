-- Allow users to delete their own attendance records (needed for manual attendance editing)
CREATE POLICY "Users can delete their own attendance"
ON public.attendance_record
FOR DELETE
USING (auth.uid() = userid);