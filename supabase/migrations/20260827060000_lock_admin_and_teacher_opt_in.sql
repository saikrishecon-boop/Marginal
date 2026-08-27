-- Final role-assignment logic for handle_new_user():
--
--   1. vaquitavoid@gmail.com is hardcoded as THE admin. This replaces the
--      old "first account ever created becomes admin" bootstrap rule,
--      which was unpredictable (whoever signed up first got admin).
--   2. Any other signup gets "teacher" only if BOTH:
--        a. they ticked "I'm a teacher" at signup, sent as
--           { wants_teacher: true } in auth signup metadata (see
--           src/routes/auth.tsx), AND
--        b. their email is on the @csacoimbatore.com domain (suffix match,
--           anchored right after "@", so "csacoimbatore.com@evil.net"
--           does NOT match).
--   3. Everyone else gets "student".
--
-- Trust model: raw_user_meta_data is client-supplied, so "wants_teacher"
-- is a self-declaration, not a hard security boundary — a student could in
-- principle tick the box. Anthropic/this app's real guarantee is that only
-- vaquitavoid@gmail.com can ever reach /admin (AI provider keys, role
-- management, usage logs); mis-declared teachers can be demoted there.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  assigned_role public.app_role;
  wants_teacher boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  wants_teacher := COALESCE((NEW.raw_user_meta_data ->> 'wants_teacher')::boolean, false);

  IF NEW.email ILIKE 'vaquitavoid@gmail.com' THEN
    assigned_role := 'admin';
  ELSIF wants_teacher AND NEW.email ILIKE '%@csacoimbatore.com' THEN
    assigned_role := 'teacher';
  ELSE
    assigned_role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── Clean up existing data to match the rule above ──────────────────────

-- 1. Strip "admin" from anyone who is NOT vaquitavoid@gmail.com.
DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'admin'
  AND u.email NOT ILIKE 'vaquitavoid@gmail.com';

-- 2. Make sure vaquitavoid@gmail.com IS admin, if that account already
--    exists (if it hasn't signed up yet, the trigger above will assign it
--    automatically the moment it does).
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.email ILIKE 'vaquitavoid@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Undo the earlier bug where every @csacoimbatore.com signup (students
--    included) was auto-promoted to teacher. Revert anyone who is "teacher"
--    but never opted in via the signup checkbox (nobody could have, since
--    it didn't exist before now) and who isn't admin.
DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'teacher'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles r2 WHERE r2.user_id = u.id AND r2.role = 'admin'
  )
  AND COALESCE((u.raw_user_meta_data ->> 'wants_teacher')::boolean, false) = false;

-- 4. Anyone left with no role row at all falls back to student.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'student'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;

-- Sanity check — run this after, and confirm only vaquitavoid@gmail.com
-- shows role = admin:
-- SELECT u.email, ur.role FROM auth.users u
--   JOIN public.user_roles ur ON ur.user_id = u.id
--   ORDER BY ur.role, u.email;
