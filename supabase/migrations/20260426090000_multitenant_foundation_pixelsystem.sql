-- Multi-tenant foundation for Totum System on pixelsystem.online

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'assistente',
  status public.user_status NOT NULL DEFAULT 'ativo',
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_wildcard BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_domains ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_org_user ON public.organization_memberships(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_domains_hostname ON public.organization_domains(hostname);

CREATE OR REPLACE FUNCTION public.is_org_member(_organization_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships membership
    WHERE membership.organization_id = _organization_id
      AND membership.user_id = COALESCE(_user_id, auth.uid())
      AND membership.status = 'ativo'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_organization_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships membership
    WHERE membership.organization_id = _organization_id
      AND membership.user_id = COALESCE(_user_id, auth.uid())
      AND membership.status = 'ativo'
      AND (
        membership.is_owner = true
        OR membership.role IN ('admin', 'diretor')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.resolve_organization_by_host(_host TEXT)
RETURNS TABLE (
  organization_id UUID,
  organization_slug TEXT,
  organization_name TEXT,
  display_name TEXT,
  logo_url TEXT,
  primary_hostname TEXT,
  matched_hostname TEXT,
  match_type TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH normalized AS (
    SELECT lower(split_part(trim(_host), ':', 1)) AS host
  ),
  candidates AS (
    SELECT
      org.id AS organization_id,
      org.slug AS organization_slug,
      org.name AS organization_name,
      settings.name AS display_name,
      settings.logo_url,
      primary_domain.hostname AS primary_hostname,
      domain.hostname AS matched_hostname,
      CASE
        WHEN domain.hostname = normalized.host THEN 'exact'
        ELSE 'wildcard'
      END AS match_type,
      CASE
        WHEN domain.hostname = normalized.host THEN 0
        ELSE 1
      END AS priority
    FROM normalized
    JOIN public.organization_domains domain
      ON domain.hostname = normalized.host
      OR (
        domain.is_wildcard = true
        AND domain.hostname LIKE '*.%'
        AND (
          normalized.host = substring(domain.hostname FROM 3)
          OR normalized.host LIKE '%.' || substring(domain.hostname FROM 3)
        )
      )
    JOIN public.organizations org
      ON org.id = domain.organization_id
     AND org.status = 'active'
    LEFT JOIN public.organization_settings settings
      ON settings.organization_id = org.id
    LEFT JOIN public.organization_domains primary_domain
      ON primary_domain.organization_id = org.id
     AND primary_domain.is_primary = true
  )
  SELECT
    candidates.organization_id,
    candidates.organization_slug,
    candidates.organization_name,
    COALESCE(candidates.display_name, candidates.organization_name) AS display_name,
    candidates.logo_url,
    COALESCE(candidates.primary_hostname, candidates.matched_hostname) AS primary_hostname,
    candidates.matched_hostname,
    candidates.match_type
  FROM candidates
  ORDER BY candidates.priority, candidates.primary_hostname NULLS LAST
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_organization_by_host(TEXT) TO anon, authenticated;

DROP POLICY IF EXISTS "Organizations members can view organizations" ON public.organizations;
CREATE POLICY "Organizations members can view organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
CREATE POLICY "Admins can manage organizations"
  ON public.organizations FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own memberships" ON public.organization_memberships;
CREATE POLICY "Users can view own memberships"
  ON public.organization_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage memberships" ON public.organization_memberships;
CREATE POLICY "Admins can manage memberships"
  ON public.organization_memberships FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Members can view organization settings" ON public.organization_settings;
CREATE POLICY "Members can view organization settings"
  ON public.organization_settings FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Organization admins can manage settings" ON public.organization_settings;
CREATE POLICY "Organization admins can manage settings"
  ON public.organization_settings FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view organization domains" ON public.organization_domains;
CREATE POLICY "Admins can view organization domains"
  ON public.organization_domains FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage organization domains" ON public.organization_domains;
CREATE POLICY "Admins can manage organization domains"
  ON public.organization_domains FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()));

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_memberships_updated_at
  BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.organizations (name, slug, owner_user_id)
SELECT
  COALESCE((SELECT name FROM public.company_settings LIMIT 1), 'Totum System'),
  'totum',
  (
    SELECT p.user_id
    FROM public.profiles p
    ORDER BY p.created_at
    LIMIT 1
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations WHERE slug = 'totum'
);

WITH org AS (
  SELECT id
  FROM public.organizations
  WHERE slug = 'totum'
  LIMIT 1
)
UPDATE public.profiles
SET organization_id = org.id
FROM org
WHERE public.profiles.organization_id IS NULL;

WITH org AS (
  SELECT id
  FROM public.organizations
  WHERE slug = 'totum'
  LIMIT 1
)
INSERT INTO public.organization_memberships (organization_id, user_id, role, status, is_owner)
SELECT
  org.id,
  p.user_id,
  COALESCE(
    (
      SELECT ur.role
      FROM public.user_roles ur
      WHERE ur.user_id = p.user_id
      ORDER BY CASE
        WHEN ur.role = 'admin' THEN 0
        WHEN ur.role = 'diretor' THEN 1
        ELSE 2
      END
      LIMIT 1
    ),
    'assistente'::public.app_role
  ) AS role,
  p.status,
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p.user_id
      AND ur.role IN ('admin', 'diretor')
  )
FROM public.profiles p
CROSS JOIN org
ON CONFLICT (organization_id, user_id) DO NOTHING;

WITH org AS (
  SELECT id
  FROM public.organizations
  WHERE slug = 'totum'
  LIMIT 1
)
INSERT INTO public.organization_settings (organization_id, name, logo_url, email, phone, address, timezone, currency)
SELECT
  org.id,
  COALESCE(cs.name, 'Totum System'),
  cs.logo_url,
  cs.email,
  cs.phone,
  cs.address,
  COALESCE(ss.timezone, 'America/Sao_Paulo'),
  COALESCE(ss.currency, 'BRL')
FROM org
LEFT JOIN public.company_settings cs ON true
LEFT JOIN public.system_settings ss ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_settings existing WHERE existing.organization_id = org.id
);

WITH org AS (
  SELECT id
  FROM public.organizations
  WHERE slug = 'totum'
  LIMIT 1
)
INSERT INTO public.organization_domains (organization_id, hostname, is_primary, is_wildcard)
SELECT org.id, domain.hostname, domain.is_primary, domain.is_wildcard
FROM org
CROSS JOIN (
  VALUES
    ('pixelsystem.online', true, false),
    ('www.pixelsystem.online', false, false),
    ('*.pixelsystem.online', false, true)
) AS domain(hostname, is_primary, is_wildcard)
ON CONFLICT (hostname) DO NOTHING;
