-- Allow Admins to INSERT into conversations
CREATE POLICY "Admins can insert conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Allow Admins to read all profiles (usually covered, but ensuring)
-- Existing policies might limit this, but Admins usually bypass or have a policy.
-- Let's check profiles policies later if needed, but usually admin needs to see profiles.
