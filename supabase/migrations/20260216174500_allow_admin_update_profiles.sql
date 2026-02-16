-- Migration: Allow admins to update all user profiles
-- This is necessary to allow admins to approve drivers via the is_driver_approved column

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
