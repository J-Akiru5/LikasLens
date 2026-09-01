-- ============================================================================
-- fix-notifications-v1.sql
-- Makes the notification system actually work end-to-end:
--   1. Broadcast to EVERYONE, or target a specific ROLE, or a specific USER
--   2. Per-user read receipts (notification_reads) — read state is no longer
--      global (previously read_at on the row meant one person's "read" marked
--      it read for everybody)
--   3. SECURITY DEFINER RPCs so no app needs the service-role key:
--        get_my_notifications(p_page)          -> role-aware inbox + unread count
--        mark_notification_read(p_id)          -> receipt for one notification
--        mark_all_notifications_read()         -> receipts for everything visible
--   4. Closes the leftover anon hole on `reports` (public_insert_reports let
--      anonymous visitors forge staging report rows; nothing in the apps uses it)
--
-- Safe to re-run. Writes to notifications/notification_reads go through RPCs
-- (definer) or the admin portal's service-role route only — RLS keeps REST
-- writes locked (v4 already dropped the auth_* write policies).
-- ============================================================================

-- 1. Targeting columns: user_id = users.id (public uuid), for_role = role string
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS for_role text;

-- 1b. The table has no id default — inserts fail without an explicit id
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Per-user read receipts
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,
  read_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user
  ON public.notification_reads (user_id, read_at);

-- 3a. Role-aware inbox.
--     Visibility: broadcast (user_id NULL, for_role NULL) OR my role OR me.
--     read_at is projected from my receipt, so the existing UI works untouched.
CREATE OR REPLACE FUNCTION public.get_my_notifications(p_page integer DEFAULT 1)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_role    text;
  v_per_page integer := 20;
  v_offset  integer := (GREATEST(p_page, 1) - 1) * 20;
  v_unread  bigint;
  v_total   bigint;
  v_rows    json;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL; -- unauthenticated: caller falls back to public read
  END IF;

  SELECT role INTO v_role
  FROM public.users
  WHERE supabase_auth_user_id = v_uid
  LIMIT 1;
  v_role := COALESCE(v_role, 'citizen');

  -- 'lgu' and 'lgu_officer' are treated as the same audience (legacy naming)
  IF v_role IN ('lgu', 'lgu_officer') THEN
    v_role := 'lgu_officer';
  END IF;

  SELECT count(*) INTO v_total
  FROM public.notifications n
  WHERE (n.user_id IS NULL OR n.user_id = (SELECT id FROM public.users WHERE supabase_auth_user_id = v_uid))
    AND (n.for_role IS NULL OR n.for_role = v_role OR (n.for_role = 'lgu' AND v_role = 'lgu_officer'));

  SELECT count(*) INTO v_unread
  FROM public.notifications n
  LEFT JOIN public.notification_reads r
    ON r.notification_id = n.id AND r.user_id = v_uid
  WHERE (n.user_id IS NULL OR n.user_id = (SELECT id FROM public.users WHERE supabase_auth_user_id = v_uid))
    AND (n.for_role IS NULL OR n.for_role = v_role OR (n.for_role = 'lgu' AND v_role = 'lgu_officer'))
    AND r.id IS NULL;

  SELECT COALESCE(json_agg(x ORDER BY x.created_at DESC), '[]'::json) INTO v_rows
  FROM (
    SELECT n.id, n.type, n.data, n.created_at, n.user_id, n.for_role,
           r.read_at AS read_at
    FROM public.notifications n
    LEFT JOIN public.notification_reads r
      ON r.notification_id = n.id AND r.user_id = v_uid
    WHERE (n.user_id IS NULL OR n.user_id = (SELECT id FROM public.users WHERE supabase_auth_user_id = v_uid))
      AND (n.for_role IS NULL OR n.for_role = v_role OR (n.for_role = 'lgu' AND v_role = 'lgu_officer'))
    ORDER BY n.created_at DESC
    LIMIT v_per_page OFFSET v_offset
  ) x;

  RETURN json_build_object(
    'notifications', v_rows,
    'unread_count', v_unread,
    'total', v_total,
    'page', GREATEST(p_page, 1),
    'per_page', v_per_page
  );
END;
$$;

-- 3b. Read receipt for one notification
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.notification_reads (notification_id, user_id)
  VALUES (p_id, auth.uid())
  ON CONFLICT (notification_id, user_id) DO NOTHING;
END;
$$;

-- 3c. Read receipts for everything visible to me; returns how many were marked
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_role    text;
  v_me      uuid;
  v_count   integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  SELECT role, id INTO v_role, v_me
  FROM public.users
  WHERE supabase_auth_user_id = v_uid
  LIMIT 1;
  v_role := COALESCE(v_role, 'citizen');
  IF v_role IN ('lgu', 'lgu_officer') THEN
    v_role := 'lgu_officer';
  END IF;

  INSERT INTO public.notification_reads (notification_id, user_id, read_at)
  SELECT n.id, v_uid, now()
  FROM public.notifications n
  LEFT JOIN public.notification_reads r
    ON r.notification_id = n.id AND r.user_id = v_uid
  WHERE (n.user_id IS NULL OR n.user_id = v_me)
    AND (n.for_role IS NULL OR n.for_role = v_role OR (n.for_role = 'lgu' AND v_role = 'lgu_officer'))
    AND r.id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 4. Only authenticated users may call the RPCs (no public execution)
REVOKE ALL ON FUNCTION public.get_my_notifications(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_notifications(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- 5. Close the anon staging-report forging hole
DROP POLICY IF EXISTS "public_insert_reports" ON public.reports;