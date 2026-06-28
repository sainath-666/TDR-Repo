-- Supabase Auth Hook: inject APCRDA role claims into JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  official_record record;
  farmer_record record;
  claims jsonb;
BEGIN
  user_id := (event->>'user_id')::uuid;

  SELECT role::text, district_code, employee_id
  INTO official_record
  FROM officials
  WHERE id = user_id AND is_active = true
  LIMIT 1;

  IF FOUND THEN
    claims := jsonb_build_object(
      'role', official_record.role,
      'district_code', official_record.district_code,
      'employee_id', official_record.employee_id
    );
    RETURN jsonb_set(
      event,
      '{claims,app_metadata}',
      COALESCE(event->'claims'->'app_metadata', '{}'::jsonb) || claims
    );
  END IF;

  SELECT id INTO farmer_record FROM farmers WHERE id = user_id LIMIT 1;

  IF FOUND THEN
    claims := jsonb_build_object('role', 'FARMER', 'farmer_id', farmer_record.id::text);
    RETURN jsonb_set(
      event,
      '{claims,app_metadata}',
      COALESCE(event->'claims'->'app_metadata', '{}'::jsonb) || claims
    );
  END IF;

  SELECT id INTO farmer_record FROM farmers WHERE aadhaar_phone = (
    SELECT phone FROM auth.users WHERE id = user_id
  ) LIMIT 1;

  IF FOUND THEN
    claims := jsonb_build_object('role', 'FARMER', 'farmer_id', farmer_record.id::text);
    RETURN jsonb_set(
      event,
      '{claims,app_metadata}',
      COALESCE(event->'claims'->'app_metadata', '{}'::jsonb) || claims
    );
  END IF;

  RETURN event;
END;
$$;

REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
