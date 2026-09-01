-- ============================================================================
-- fix-routing-visibility-v1.sql
-- Per-user data isolation for the admin apps + agency identity for routing.
--
--   1. users:      agency_name + service_area (city/province) — set when the
--                  officer account is created; used to auto-match routed
--                  tickets to the right officer/agency.
--   2. ticket_assignments: assignee_user_id — assign a ticket to a SPECIFIC
--                  officer (person-level), not only to a group.
--   3. get_my_tickets(): SECURITY DEFINER RPC — the one source of truth for
--                  what each account may see:
--                    super_admin            -> everything
--                    analyst/lgu/lgu_officer -> tickets assigned to THEM or
--                                               to anyone in their agency;
--                                               plus legacy group assignments
--                    citizen                -> only tickets they submitted
--                  (No more shared global lists between two same-role users.)
--   4. Column grants so the admin UI can read agency fields back.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. Agency identity on user accounts
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agency_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS service_area text;

-- 2. Person-level assignment
ALTER TABLE public.ticket_assignments
  ADD COLUMN IF NOT EXISTS assignee_user_id uuid REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_ticket_assignments_assignee
  ON public.ticket_assignments (assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_ticket
  ON public.ticket_assignments (ticket_id);

-- 3. Column grants (authenticated may read agency fields for display only;
--    writes remain service-role-only, as v4 established)
GRANT SELECT (agency_name, service_area) ON public.users TO authenticated;

-- 4. Scoped inbox
CREATE OR REPLACE FUNCTION public.get_my_tickets(
  p_page integer DEFAULT 1,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_me      uuid;
  v_role    text;
  v_agency  text;
  v_per_page integer := 50;
  v_offset  integer;
  v_total   bigint;
  v_rows    json;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id, role, agency_name INTO v_me, v_role, v_agency
  FROM public.users
  WHERE supabase_auth_user_id = v_uid
  LIMIT 1;
  IF v_me IS NULL THEN
    v_role := 'citizen';
  END IF;

  v_offset := (GREATEST(p_page, 1) - 1) * v_per_page;

  -- Visibility:
  --  super_admin -> all
  --  officers    -> ticket has an assignment to me, OR to anyone in my
  --                 agency, OR to one of my legacy groups
  --  citizen     -> my own submitted tickets only
  CREATE TEMP TABLE _vis ON COMMIT DROP AS
    SELECT t.id
    FROM public.tickets t
    WHERE
      (v_role = 'super_admin' OR v_role = 'admin')
      OR
      (v_role IN ('analyst', 'lgu', 'lgu_officer')
        AND EXISTS (
          SELECT 1 FROM public.ticket_assignments a
          LEFT JOIN public.users u ON u.id = a.assignee_user_id
          WHERE a.ticket_id = t.id
            AND (
              a.assignee_user_id = v_me
              OR (u.agency_name IS NOT NULL AND u.agency_name = v_agency AND v_agency IS NOT NULL)
            )
        ))
      OR
      (v_role = 'citizen' AND t.reporter_user_id = v_me);

  SELECT count(*) INTO v_total FROM _vis;

  IF p_status IS NOT NULL AND p_status <> '' THEN
    DELETE FROM _vis v USING public.tickets t
    WHERE v.id = t.id AND t.status <> p_status;
  END IF;

  IF p_search IS NOT NULL AND p_search <> '' THEN
    DELETE FROM _vis v USING public.tickets t
    WHERE v.id = t.id AND NOT (
      t.title ILIKE '%' || p_search || '%'
      OR t.description ILIKE '%' || p_search || '%'
      OR t.address_text ILIKE '%' || p_search || '%'
    );
  END IF;

  SELECT COALESCE(json_agg(x ORDER BY x.created_at DESC), '[]'::json) INTO v_rows
  FROM (
    SELECT t.*
    FROM public.tickets t
    JOIN _vis v ON v.id = t.id
    ORDER BY t.created_at DESC
    LIMIT v_per_page OFFSET v_offset
  ) x
  -- json_agg over table row keeps column names
  ;

  RETURN json_build_object(
    'tickets', v_rows,
    'total', v_total,
    'page', GREATEST(p_page, 1),
    'per_page', v_per_page
  );
END;
$$;

-- json_agg(row_of_table.*) expands to an object keyed by column names
-- (already handled above via `SELECT t.*` in the subquery).

REVOKE ALL ON FUNCTION public.get_my_tickets(integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_tickets(integer, text, text) TO authenticated;