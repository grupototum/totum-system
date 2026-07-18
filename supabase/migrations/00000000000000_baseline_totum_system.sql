--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: totum_system; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA totum_system;


--
-- Name: app_role; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.app_role AS ENUM (
    'admin',
    'diretor',
    'financeiro',
    'gestor',
    'social_media',
    'designer',
    'trafego',
    'atendimento',
    'assistente',
    'parceiro',
    'cliente_convidado'
);


--
-- Name: checklist_frequency; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.checklist_frequency AS ENUM (
    'semanal',
    'quinzenal',
    'mensal',
    'personalizada'
);


--
-- Name: contract_status; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.contract_status AS ENUM (
    'ativo',
    'pausado',
    'cancelado',
    'encerrado'
);


--
-- Name: delivery_item_status; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.delivery_item_status AS ENUM (
    'entregue',
    'entregue_parcialmente',
    'nao_entregue',
    'nao_aplicavel'
);


--
-- Name: expense_recurrence; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.expense_recurrence AS ENUM (
    'recorrente',
    'unica',
    'parcelada'
);


--
-- Name: financial_entry_status; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.financial_entry_status AS ENUM (
    'pendente',
    'pago',
    'atrasado',
    'cancelado'
);


--
-- Name: task_priority; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.task_priority AS ENUM (
    'baixa',
    'media',
    'alta',
    'urgente'
);


--
-- Name: task_status; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.task_status AS ENUM (
    'pendente',
    'em_andamento',
    'pausado',
    'concluido',
    'arquivado'
);


--
-- Name: task_type; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.task_type AS ENUM (
    'conteudo',
    'trafego',
    'reuniao',
    'relatorio',
    'design',
    'desenvolvimento',
    'outro'
);


--
-- Name: user_status; Type: TYPE; Schema: totum_system; Owner: -
--

CREATE TYPE totum_system.user_status AS ENUM (
    'ativo',
    'inativo',
    'bloqueado',
    'pendente'
);


--
-- Name: can_access_client(uuid); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.can_access_client(_client_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM totum_system.clients client
    WHERE client.id = _client_id
      AND totum_system.can_access_org(client.organization_id)
  );
$$;


--
-- Name: can_access_delivery_checklist(uuid); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.can_access_delivery_checklist(_checklist_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM totum_system.delivery_checklists checklist
    WHERE checklist.id = _checklist_id
      AND totum_system.can_access_org(checklist.organization_id)
      AND (checklist.client_id IS NULL OR totum_system.can_access_client(checklist.client_id))
  );
$$;


--
-- Name: can_access_org(uuid); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.can_access_org(_organization_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(totum_system.is_master_user(), false)
    OR _organization_id = totum_system.get_user_organization_id();
$$;


--
-- Name: can_access_task(uuid); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.can_access_task(_task_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM totum_system.tasks task
    WHERE task.id = _task_id
      AND totum_system.can_access_org(task.organization_id)
  );
$$;


--
-- Name: can_access_task_attachment_path(text); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.can_access_task_attachment_path(_path text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM totum_system.tasks task
    WHERE task.id::text = split_part(COALESCE(_path, ''), '/', 1)
      AND totum_system.can_access_org(task.organization_id)
  );
$$;


--
-- Name: check_subdomain_available(text); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.check_subdomain_available(_subdomain text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM totum_system.organizations WHERE subdomain = lower(trim(_subdomain))
  );
$$;


--
-- Name: get_user_client_id(); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.get_user_client_id() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT client_id FROM totum_system.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;


--
-- Name: get_user_organization_id(); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.get_user_organization_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT organization_id FROM totum_system.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;


--
-- Name: get_user_permissions(uuid); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.get_user_permissions(_user_id uuid) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (SELECT r.permissions FROM totum_system.roles r
     JOIN totum_system.profiles p ON p.role_id = r.id
     WHERE p.user_id = _user_id
     LIMIT 1),
    '{}'::jsonb
  );
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_org uuid;
  v_status totum_system.user_status;
BEGIN
  IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
    v_org := (NEW.raw_user_meta_data->>'organization_id')::uuid;
    v_status := 'ativo';
  ELSE
    v_org := 'c3d8f5a2-1b4e-4f9c-8e7d-6a5b2c1d0e9f';
    v_status := 'pendente';
  END IF;

  INSERT INTO totum_system.profiles (user_id, email, full_name, status, organization_id, client_id, is_master)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    v_status,
    v_org,
    COALESCE(NEW.raw_user_meta_data->>'client_id', 'totum'),
    COALESCE((NEW.raw_user_meta_data->>'is_master')::BOOLEAN, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    organization_id = COALESCE(totum_system.profiles.organization_id, EXCLUDED.organization_id),
    client_id = COALESCE(EXCLUDED.client_id, totum_system.profiles.client_id);

  IF v_status = 'pendente' THEN
    INSERT INTO totum_system.notifications (user_id, title, message, type, entity_type, entity_id)
    SELECT p.user_id,
      'Novo cadastro pendente',
      'O usuário ' || COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.email
      ) || ' aguarda aprovação.',
      'warning',
      'profile',
      NEW.id
    FROM totum_system.profiles p
    JOIN totum_system.user_roles ur ON ur.user_id = p.user_id
    WHERE ur.role = 'admin'
      AND p.status = 'ativo';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: has_any_admin(); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.has_any_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (SELECT 1 FROM totum_system.user_roles WHERE role = 'admin');
$$;


--
-- Name: has_permission(text, uuid); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.has_permission(_perm_key text, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT (totum_system.get_user_permissions(_user_id) ->> _perm_key)::boolean IS TRUE;
$$;


--
-- Name: has_role(totum_system.app_role, uuid); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.has_role(_role totum_system.app_role, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (SELECT 1 FROM totum_system.user_roles WHERE user_id = _user_id AND role = _role);
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT totum_system.has_role('admin', _user_id);
$$;


--
-- Name: is_master_user(); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.is_master_user() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM totum_system.profiles
    WHERE user_id = auth.uid() AND is_master = true
  );
$$;


--
-- Name: log_audit(uuid, text, text, uuid, jsonb, jsonb, text); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.log_audit(_user_id uuid, _entity_type text, _action text, _entity_id uuid DEFAULT NULL::uuid, _old_data jsonb DEFAULT NULL::jsonb, _new_data jsonb DEFAULT NULL::jsonb, _detail text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO totum_system.audit_logs (user_id, entity_type, entity_id, action, old_data, new_data, detail)
  VALUES (_user_id, _entity_type, _entity_id, _action, _old_data, _new_data, _detail);
END;
$$;


--
-- Name: log_sensitive_access(uuid, text, uuid, text); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.log_sensitive_access(_user_id uuid, _entity_type text, _entity_id uuid DEFAULT NULL::uuid, _action text DEFAULT 'view'::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO totum_system.audit_logs (user_id, entity_type, entity_id, action, detail)
  VALUES (_user_id, _entity_type, _entity_id, _action, 'sensitive_access');
END;
$$;


--
-- Name: resolve_organization_by_host(text); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.resolve_organization_by_host(_host text) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  result jsonb;
  org    totum_system.organizations%ROWTYPE;
  sub    text;
BEGIN
  SELECT * INTO org FROM totum_system.organizations
  WHERE custom_domain = _host AND is_active = true LIMIT 1;

  IF org.id IS NULL AND _host IS NOT NULL THEN
    sub := split_part(_host, '.', 1);
    SELECT * INTO org FROM totum_system.organizations
    WHERE subdomain = sub AND is_active = true LIMIT 1;
  END IF;

  IF org.id IS NULL THEN
    SELECT jsonb_build_object(
      'organization_id',   NULL,
      'organization_slug', 'totum',
      'organization_name', COALESCE(name, 'Totum System'),
      'display_name',      COALESCE(name, 'Totum System'),
      'logo_url',          logo_url,
      'logo_url_light',    NULL,
      'primary_color',     NULL,
      'bg_color',          NULL,
      'card_color',        NULL,
      'primary_hostname',  COALESCE(_host, 'totum.pixelsystem.online'),
      'matched_hostname',  COALESCE(_host, 'totum.pixelsystem.online'),
      'match_type',        'fallback'
    ) INTO result FROM totum_system.company_settings LIMIT 1;

    RETURN COALESCE(result, jsonb_build_object(
      'organization_id',   NULL,
      'organization_slug', 'totum',
      'organization_name', 'Totum System',
      'display_name',      'Totum System',
      'logo_url',          NULL,
      'logo_url_light',    NULL,
      'primary_color',     NULL,
      'bg_color',          NULL,
      'card_color',        NULL,
      'primary_hostname',  COALESCE(_host, 'totum.pixelsystem.online'),
      'matched_hostname',  COALESCE(_host, 'totum.pixelsystem.online'),
      'match_type',        'fallback'
    ));
  END IF;

  RETURN jsonb_build_object(
    'organization_id',   org.id,
    'organization_slug', org.slug,
    'organization_name', org.name,
    'display_name',      org.name,
    'logo_url',          org.logo_url,
    'logo_url_light',    org.logo_url_light,
    'primary_color',     org.primary_color,
    'bg_color',          org.bg_color,
    'card_color',        org.card_color,
    'primary_hostname',  COALESCE(org.custom_domain, org.subdomain || '.pixelsystem.online'),
    'matched_hostname',  _host,
    'match_type',        CASE WHEN org.custom_domain = _host THEN 'custom_domain' ELSE 'subdomain' END
  );
END;
$$;


--
-- Name: rollback_import(uuid); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.rollback_import(_batch_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- placeholder: app-level rollback logic per entity type
  UPDATE totum_system.import_batches SET status = 'rolled_back' WHERE id = _batch_id;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: totum_system; Owner: -
--

CREATE FUNCTION totum_system.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agents; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    type text DEFAULT 'ai'::text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: api_keys; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    key_prefix text NOT NULL,
    key_hash text NOT NULL,
    scopes text[] DEFAULT ARRAY['read'::text] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT api_keys_scopes_check CHECK (((scopes <@ ARRAY['read'::text, 'write'::text]) AND (array_length(scopes, 1) >= 1)))
);


--
-- Name: asaas_config; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.asaas_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_key text,
    environment text DEFAULT 'sandbox'::text NOT NULL,
    webhook_token text,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: asaas_customers; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.asaas_customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    asaas_id text NOT NULL,
    name text NOT NULL,
    email text,
    cpf_cnpj text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: asaas_payments; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.asaas_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asaas_customer_id uuid,
    asaas_id text NOT NULL,
    status text NOT NULL,
    value numeric DEFAULT 0 NOT NULL,
    net_value numeric,
    due_date date,
    payment_date date,
    billing_type text,
    invoice_url text,
    bank_slip_url text,
    description text,
    external_reference text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: asaas_subscriptions; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.asaas_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asaas_customer_id uuid,
    contract_id uuid,
    asaas_id text NOT NULL,
    status text NOT NULL,
    value numeric DEFAULT 0 NOT NULL,
    billing_type text,
    cycle text,
    next_due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: asaas_webhook_logs; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.asaas_webhook_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: audit_logs; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    detail text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: bank_accounts; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    bank_id uuid,
    account_type text,
    agency text,
    account_number text,
    balance numeric DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: banks; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.banks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cancellation_reasons; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.cancellation_reasons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_observations; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.client_observations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    content text NOT NULL,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: client_types; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.client_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    document text,
    address text,
    city text,
    state text,
    zip_code text,
    client_type_id uuid,
    partner_id uuid,
    responsible_id uuid,
    status text DEFAULT 'ativo'::text NOT NULL,
    notes text,
    instagram text,
    website text,
    segment text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: company_settings; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.company_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    logo_url text,
    email text,
    phone text,
    document text,
    address text,
    city text,
    state text,
    zip_code text,
    website text,
    primary_color text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: contract_products; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.contract_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contract_id uuid NOT NULL,
    product_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: contract_types; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.contract_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contracts; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    contract_type_id uuid,
    plan_id uuid,
    responsible_id uuid,
    status totum_system.contract_status DEFAULT 'ativo'::totum_system.contract_status NOT NULL,
    start_date date,
    end_date date,
    value numeric,
    billing_day integer,
    cancellation_reason_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cost_centers; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.cost_centers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: delay_reasons; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.delay_reasons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: delinquency_reasons; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.delinquency_reasons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: delivery_checklist_items; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.delivery_checklist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    checklist_id uuid NOT NULL,
    delivery_model_item_id uuid,
    title text NOT NULL,
    status totum_system.delivery_item_status DEFAULT 'nao_entregue'::totum_system.delivery_item_status NOT NULL,
    notes text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: delivery_checklists; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.delivery_checklists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    contract_id uuid,
    title text NOT NULL,
    frequency totum_system.checklist_frequency DEFAULT 'mensal'::totum_system.checklist_frequency NOT NULL,
    period_start date,
    period_end date,
    status text DEFAULT 'pendente'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    fulfillment_pct numeric DEFAULT 0,
    period text,
    completed_at timestamp with time zone,
    completed_by uuid,
    plan_id uuid,
    organization_id uuid
);


--
-- Name: delivery_model_items; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.delivery_model_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    frequency totum_system.checklist_frequency,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: departments; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: despesas_recorrentes; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.despesas_recorrentes (
    id bigint NOT NULL,
    data date,
    descricao text,
    valor numeric(15,2),
    tipo text,
    categoria text,
    conta_bancaria text,
    nome_cliente text,
    email_cliente text,
    telefone_cliente text,
    documento text,
    observacoes text,
    status text,
    tags text,
    created_at timestamp with time zone DEFAULT now(),
    organization_id uuid
);


--
-- Name: despesas_recorrentes_id_seq; Type: SEQUENCE; Schema: totum_system; Owner: -
--

CREATE SEQUENCE totum_system.despesas_recorrentes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: despesas_recorrentes_id_seq; Type: SEQUENCE OWNED BY; Schema: totum_system; Owner: -
--

ALTER SEQUENCE totum_system.despesas_recorrentes_id_seq OWNED BY totum_system.despesas_recorrentes.id;


--
-- Name: error_logs; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    error_type text,
    message text NOT NULL,
    stack_trace text,
    context jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: expense_types; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.expense_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: financial_categories; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.financial_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'despesa'::text NOT NULL,
    color text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: financial_entries; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.financial_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text DEFAULT 'despesa'::text NOT NULL,
    description text NOT NULL,
    value numeric DEFAULT 0 NOT NULL,
    due_date date,
    payment_date date,
    status totum_system.financial_entry_status DEFAULT 'pendente'::totum_system.financial_entry_status NOT NULL,
    category_id uuid,
    cost_center_id uuid,
    bank_account_id uuid,
    client_id uuid,
    contract_id uuid,
    supplier_id uuid,
    recurrence totum_system.expense_recurrence,
    recurrence_config jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: general_categories; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.general_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    module text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: import_batches; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.import_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    entity_type text NOT NULL,
    status text DEFAULT 'processing'::text NOT NULL,
    total_rows integer DEFAULT 0 NOT NULL,
    success_rows integer DEFAULT 0 NOT NULL,
    error_rows integer DEFAULT 0 NOT NULL,
    errors jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: notifications; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text,
    type text DEFAULT 'info'::text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    entity_type text,
    entity_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: organizations; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    subdomain text,
    custom_domain text,
    logo_url text,
    primary_color text DEFAULT '#ef4444'::text,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    vercel_domain_status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    logo_url_light text,
    bg_color text,
    card_color text
);


--
-- Name: partners; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    document text,
    commission_type text,
    commission_value numeric,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: plans; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric,
    billing_cycle text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pop_checklist_items; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.pop_checklist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pop_id uuid NOT NULL,
    text text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pop_steps; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.pop_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pop_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pops; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.pops (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_types; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.product_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric,
    price_package numeric,
    cost numeric,
    notes text,
    product_type_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: profiles; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    phone text,
    department_id uuid,
    role_id uuid,
    salary numeric,
    commission_type text,
    commission_value numeric,
    status totum_system.user_status DEFAULT 'ativo'::totum_system.user_status NOT NULL,
    last_access timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text DEFAULT 'totum'::text NOT NULL,
    is_master boolean DEFAULT false NOT NULL,
    organization_id uuid
);


--
-- Name: project_template_tasks; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.project_template_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    subtasks jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: project_templates; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.project_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: project_types; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.project_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    revenue_type_id uuid,
    service_type_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    client_id uuid NOT NULL,
    contract_id uuid,
    project_type_id uuid,
    responsible_id uuid,
    status totum_system.task_status DEFAULT 'pendente'::totum_system.task_status NOT NULL,
    start_date date,
    due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: revenue_types; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.revenue_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sdr_webhook_events; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.sdr_webhook_events (
    id bigint NOT NULL,
    event text,
    instance text,
    data jsonb,
    destination text,
    date_time text,
    sender text,
    server_url text,
    apikey text,
    consumed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sdr_webhook_events_id_seq; Type: SEQUENCE; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.sdr_webhook_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME totum_system.sdr_webhook_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: service_types; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.service_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric,
    service_type_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: sla_rules; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.sla_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority text DEFAULT 'media'::text NOT NULL,
    max_response_minutes integer DEFAULT 60 NOT NULL,
    max_resolution_minutes integer DEFAULT 480 NOT NULL,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: subtasks; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.subtasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    title text NOT NULL,
    status totum_system.task_status DEFAULT 'pendente'::totum_system.task_status NOT NULL,
    responsible_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: suppliers; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    document text,
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: system_settings; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    timezone text DEFAULT 'America/Sao_Paulo'::text NOT NULL,
    currency text DEFAULT 'BRL'::text NOT NULL,
    date_format text DEFAULT 'DD/MM/YYYY'::text NOT NULL,
    default_task_status text DEFAULT 'pendente'::text NOT NULL,
    default_task_priority text DEFAULT 'media'::text NOT NULL,
    archive_after_days integer DEFAULT 90 NOT NULL,
    default_recurrence_rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    default_contract_rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    default_checklist_rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tags; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    color text,
    module text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: task_checklist_items; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.task_checklist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    text text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: task_comments; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.task_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: task_dependencies; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.task_dependencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    depends_on_task_id uuid NOT NULL,
    project_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: task_goals; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.task_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    goal_type text DEFAULT 'count'::text NOT NULL,
    target_count integer DEFAULT 0 NOT NULL,
    current_count integer DEFAULT 0 NOT NULL,
    period text DEFAULT 'mensal'::text NOT NULL,
    status text DEFAULT 'ativo'::text NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    responsible_id uuid,
    client_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: task_history; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.task_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid,
    action text NOT NULL,
    detail text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: task_template_items; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.task_template_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: task_templates; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.task_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


--
-- Name: tasks; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    client_id uuid NOT NULL,
    contract_id uuid,
    project_id uuid,
    responsible_id uuid,
    status totum_system.task_status DEFAULT 'pendente'::totum_system.task_status NOT NULL,
    priority totum_system.task_priority DEFAULT 'media'::totum_system.task_priority NOT NULL,
    task_type totum_system.task_type DEFAULT 'outro'::totum_system.task_type NOT NULL,
    start_date date,
    due_date date,
    estimated_minutes integer,
    actual_minutes integer,
    is_recurring boolean DEFAULT false NOT NULL,
    recurrence_type text,
    recurrence_config jsonb,
    recurrence_end_date date,
    last_generated_at timestamp with time zone,
    generation_period text,
    parent_task_id uuid,
    plan_id uuid,
    pop_id uuid,
    delivery_model_item_id uuid,
    sla_id uuid,
    sla_response_deadline timestamp with time zone,
    sla_resolution_deadline timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: totum_system; Owner: -
--

CREATE TABLE totum_system.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role totum_system.app_role NOT NULL,
    organization_id uuid
);


--
-- Name: despesas_recorrentes id; Type: DEFAULT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.despesas_recorrentes ALTER COLUMN id SET DEFAULT nextval('totum_system.despesas_recorrentes_id_seq'::regclass);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_hash_key; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.api_keys
    ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: asaas_config asaas_config_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_config
    ADD CONSTRAINT asaas_config_pkey PRIMARY KEY (id);


--
-- Name: asaas_customers asaas_customers_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_customers
    ADD CONSTRAINT asaas_customers_pkey PRIMARY KEY (id);


--
-- Name: asaas_payments asaas_payments_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_payments
    ADD CONSTRAINT asaas_payments_pkey PRIMARY KEY (id);


--
-- Name: asaas_subscriptions asaas_subscriptions_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_subscriptions
    ADD CONSTRAINT asaas_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: asaas_webhook_logs asaas_webhook_logs_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_webhook_logs
    ADD CONSTRAINT asaas_webhook_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: banks banks_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.banks
    ADD CONSTRAINT banks_pkey PRIMARY KEY (id);


--
-- Name: cancellation_reasons cancellation_reasons_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.cancellation_reasons
    ADD CONSTRAINT cancellation_reasons_pkey PRIMARY KEY (id);


--
-- Name: client_observations client_observations_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.client_observations
    ADD CONSTRAINT client_observations_pkey PRIMARY KEY (id);


--
-- Name: client_types client_types_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.client_types
    ADD CONSTRAINT client_types_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: contract_products contract_products_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contract_products
    ADD CONSTRAINT contract_products_pkey PRIMARY KEY (id);


--
-- Name: contract_types contract_types_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contract_types
    ADD CONSTRAINT contract_types_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: cost_centers cost_centers_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.cost_centers
    ADD CONSTRAINT cost_centers_pkey PRIMARY KEY (id);


--
-- Name: delay_reasons delay_reasons_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delay_reasons
    ADD CONSTRAINT delay_reasons_pkey PRIMARY KEY (id);


--
-- Name: delinquency_reasons delinquency_reasons_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delinquency_reasons
    ADD CONSTRAINT delinquency_reasons_pkey PRIMARY KEY (id);


--
-- Name: delivery_checklist_items delivery_checklist_items_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklist_items
    ADD CONSTRAINT delivery_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: delivery_checklists delivery_checklists_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklists
    ADD CONSTRAINT delivery_checklists_pkey PRIMARY KEY (id);


--
-- Name: delivery_model_items delivery_model_items_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_model_items
    ADD CONSTRAINT delivery_model_items_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: despesas_recorrentes despesas_recorrentes_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.despesas_recorrentes
    ADD CONSTRAINT despesas_recorrentes_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: expense_types expense_types_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.expense_types
    ADD CONSTRAINT expense_types_pkey PRIMARY KEY (id);


--
-- Name: financial_categories financial_categories_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.financial_categories
    ADD CONSTRAINT financial_categories_pkey PRIMARY KEY (id);


--
-- Name: financial_entries financial_entries_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.financial_entries
    ADD CONSTRAINT financial_entries_pkey PRIMARY KEY (id);


--
-- Name: general_categories general_categories_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.general_categories
    ADD CONSTRAINT general_categories_pkey PRIMARY KEY (id);


--
-- Name: import_batches import_batches_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.import_batches
    ADD CONSTRAINT import_batches_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_custom_domain_key; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.organizations
    ADD CONSTRAINT organizations_custom_domain_key UNIQUE (custom_domain);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: organizations organizations_subdomain_key; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.organizations
    ADD CONSTRAINT organizations_subdomain_key UNIQUE (subdomain);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: pop_checklist_items pop_checklist_items_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.pop_checklist_items
    ADD CONSTRAINT pop_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: pop_steps pop_steps_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.pop_steps
    ADD CONSTRAINT pop_steps_pkey PRIMARY KEY (id);


--
-- Name: pops pops_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.pops
    ADD CONSTRAINT pops_pkey PRIMARY KEY (id);


--
-- Name: product_types product_types_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.product_types
    ADD CONSTRAINT product_types_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_unique; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.profiles
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);


--
-- Name: project_template_tasks project_template_tasks_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.project_template_tasks
    ADD CONSTRAINT project_template_tasks_pkey PRIMARY KEY (id);


--
-- Name: project_templates project_templates_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.project_templates
    ADD CONSTRAINT project_templates_pkey PRIMARY KEY (id);


--
-- Name: project_types project_types_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.project_types
    ADD CONSTRAINT project_types_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: revenue_types revenue_types_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.revenue_types
    ADD CONSTRAINT revenue_types_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sdr_webhook_events sdr_webhook_events_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.sdr_webhook_events
    ADD CONSTRAINT sdr_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: service_types service_types_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.service_types
    ADD CONSTRAINT service_types_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: sla_rules sla_rules_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.sla_rules
    ADD CONSTRAINT sla_rules_pkey PRIMARY KEY (id);


--
-- Name: subtasks subtasks_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.subtasks
    ADD CONSTRAINT subtasks_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: task_checklist_items task_checklist_items_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_checklist_items
    ADD CONSTRAINT task_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- Name: task_dependencies task_dependencies_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_dependencies
    ADD CONSTRAINT task_dependencies_pkey PRIMARY KEY (id);


--
-- Name: task_goals task_goals_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_goals
    ADD CONSTRAINT task_goals_pkey PRIMARY KEY (id);


--
-- Name: task_history task_history_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_history
    ADD CONSTRAINT task_history_pkey PRIMARY KEY (id);


--
-- Name: task_template_items task_template_items_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_template_items
    ADD CONSTRAINT task_template_items_pkey PRIMARY KEY (id);


--
-- Name: task_templates task_templates_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_templates
    ADD CONSTRAINT task_templates_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: idx_api_keys_key_hash; Type: INDEX; Schema: totum_system; Owner: -
--

CREATE INDEX idx_api_keys_key_hash ON totum_system.api_keys USING btree (key_hash);


--
-- Name: idx_api_keys_organization_id; Type: INDEX; Schema: totum_system; Owner: -
--

CREATE INDEX idx_api_keys_organization_id ON totum_system.api_keys USING btree (organization_id);


--
-- Name: api_keys set_api_keys_updated_at; Type: TRIGGER; Schema: totum_system; Owner: -
--

CREATE TRIGGER set_api_keys_updated_at BEFORE UPDATE ON totum_system.api_keys FOR EACH ROW EXECUTE FUNCTION totum_system.update_updated_at_column();


--
-- Name: agents agents_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.agents
    ADD CONSTRAINT agents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: api_keys api_keys_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.api_keys
    ADD CONSTRAINT api_keys_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE CASCADE;


--
-- Name: asaas_config asaas_config_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_config
    ADD CONSTRAINT asaas_config_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: asaas_customers asaas_customers_client_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_customers
    ADD CONSTRAINT asaas_customers_client_id_fkey FOREIGN KEY (client_id) REFERENCES totum_system.clients(id) ON DELETE SET NULL;


--
-- Name: asaas_customers asaas_customers_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_customers
    ADD CONSTRAINT asaas_customers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: asaas_payments asaas_payments_asaas_customer_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_payments
    ADD CONSTRAINT asaas_payments_asaas_customer_id_fkey FOREIGN KEY (asaas_customer_id) REFERENCES totum_system.asaas_customers(id);


--
-- Name: asaas_payments asaas_payments_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_payments
    ADD CONSTRAINT asaas_payments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: asaas_subscriptions asaas_subscriptions_asaas_customer_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_subscriptions
    ADD CONSTRAINT asaas_subscriptions_asaas_customer_id_fkey FOREIGN KEY (asaas_customer_id) REFERENCES totum_system.asaas_customers(id);


--
-- Name: asaas_subscriptions asaas_subscriptions_contract_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_subscriptions
    ADD CONSTRAINT asaas_subscriptions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES totum_system.contracts(id);


--
-- Name: asaas_subscriptions asaas_subscriptions_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_subscriptions
    ADD CONSTRAINT asaas_subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: asaas_webhook_logs asaas_webhook_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.asaas_webhook_logs
    ADD CONSTRAINT asaas_webhook_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.audit_logs
    ADD CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: bank_accounts bank_accounts_bank_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.bank_accounts
    ADD CONSTRAINT bank_accounts_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES totum_system.banks(id);


--
-- Name: bank_accounts bank_accounts_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.bank_accounts
    ADD CONSTRAINT bank_accounts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: client_observations client_observations_client_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.client_observations
    ADD CONSTRAINT client_observations_client_id_fkey FOREIGN KEY (client_id) REFERENCES totum_system.clients(id) ON DELETE CASCADE;


--
-- Name: client_observations client_observations_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.client_observations
    ADD CONSTRAINT client_observations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: clients clients_client_type_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.clients
    ADD CONSTRAINT clients_client_type_id_fkey FOREIGN KEY (client_type_id) REFERENCES totum_system.client_types(id);


--
-- Name: clients clients_partner_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.clients
    ADD CONSTRAINT clients_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES totum_system.partners(id);


--
-- Name: company_settings company_settings_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.company_settings
    ADD CONSTRAINT company_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: contract_products contract_products_contract_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contract_products
    ADD CONSTRAINT contract_products_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES totum_system.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_products contract_products_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contract_products
    ADD CONSTRAINT contract_products_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: contract_products contract_products_product_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contract_products
    ADD CONSTRAINT contract_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES totum_system.products(id);


--
-- Name: contracts contracts_cancellation_reason_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contracts
    ADD CONSTRAINT contracts_cancellation_reason_id_fkey FOREIGN KEY (cancellation_reason_id) REFERENCES totum_system.cancellation_reasons(id);


--
-- Name: contracts contracts_client_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contracts
    ADD CONSTRAINT contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES totum_system.clients(id);


--
-- Name: contracts contracts_contract_type_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contracts
    ADD CONSTRAINT contracts_contract_type_id_fkey FOREIGN KEY (contract_type_id) REFERENCES totum_system.contract_types(id);


--
-- Name: contracts contracts_plan_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.contracts
    ADD CONSTRAINT contracts_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES totum_system.plans(id);


--
-- Name: cost_centers cost_centers_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.cost_centers
    ADD CONSTRAINT cost_centers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: delivery_checklist_items delivery_checklist_items_checklist_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklist_items
    ADD CONSTRAINT delivery_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES totum_system.delivery_checklists(id) ON DELETE CASCADE;


--
-- Name: delivery_checklist_items delivery_checklist_items_delivery_model_item_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklist_items
    ADD CONSTRAINT delivery_checklist_items_delivery_model_item_id_fkey FOREIGN KEY (delivery_model_item_id) REFERENCES totum_system.delivery_model_items(id);


--
-- Name: delivery_checklist_items delivery_checklist_items_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklist_items
    ADD CONSTRAINT delivery_checklist_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: delivery_checklists delivery_checklists_client_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklists
    ADD CONSTRAINT delivery_checklists_client_id_fkey FOREIGN KEY (client_id) REFERENCES totum_system.clients(id) ON DELETE CASCADE;


--
-- Name: delivery_checklists delivery_checklists_completed_by_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklists
    ADD CONSTRAINT delivery_checklists_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES totum_system.profiles(id) ON DELETE SET NULL;


--
-- Name: delivery_checklists delivery_checklists_contract_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklists
    ADD CONSTRAINT delivery_checklists_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES totum_system.contracts(id);


--
-- Name: delivery_checklists delivery_checklists_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklists
    ADD CONSTRAINT delivery_checklists_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: delivery_checklists delivery_checklists_plan_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.delivery_checklists
    ADD CONSTRAINT delivery_checklists_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES totum_system.plans(id) ON DELETE SET NULL;


--
-- Name: departments departments_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.departments
    ADD CONSTRAINT departments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: despesas_recorrentes despesas_recorrentes_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.despesas_recorrentes
    ADD CONSTRAINT despesas_recorrentes_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: error_logs error_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.error_logs
    ADD CONSTRAINT error_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: financial_categories financial_categories_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.financial_categories
    ADD CONSTRAINT financial_categories_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: financial_entries financial_entries_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.financial_entries
    ADD CONSTRAINT financial_entries_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES totum_system.bank_accounts(id);


--
-- Name: financial_entries financial_entries_category_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.financial_entries
    ADD CONSTRAINT financial_entries_category_id_fkey FOREIGN KEY (category_id) REFERENCES totum_system.financial_categories(id);


--
-- Name: financial_entries financial_entries_client_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.financial_entries
    ADD CONSTRAINT financial_entries_client_id_fkey FOREIGN KEY (client_id) REFERENCES totum_system.clients(id);


--
-- Name: financial_entries financial_entries_contract_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.financial_entries
    ADD CONSTRAINT financial_entries_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES totum_system.contracts(id);


--
-- Name: financial_entries financial_entries_cost_center_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.financial_entries
    ADD CONSTRAINT financial_entries_cost_center_id_fkey FOREIGN KEY (cost_center_id) REFERENCES totum_system.cost_centers(id);


--
-- Name: financial_entries financial_entries_supplier_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.financial_entries
    ADD CONSTRAINT financial_entries_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES totum_system.suppliers(id);


--
-- Name: general_categories general_categories_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.general_categories
    ADD CONSTRAINT general_categories_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: import_batches import_batches_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.import_batches
    ADD CONSTRAINT import_batches_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.notifications
    ADD CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: partners partners_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.partners
    ADD CONSTRAINT partners_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: pop_checklist_items pop_checklist_items_pop_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.pop_checklist_items
    ADD CONSTRAINT pop_checklist_items_pop_id_fkey FOREIGN KEY (pop_id) REFERENCES totum_system.pops(id) ON DELETE CASCADE;


--
-- Name: pop_steps pop_steps_pop_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.pop_steps
    ADD CONSTRAINT pop_steps_pop_id_fkey FOREIGN KEY (pop_id) REFERENCES totum_system.pops(id) ON DELETE CASCADE;


--
-- Name: products products_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.products
    ADD CONSTRAINT products_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: products products_product_type_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.products
    ADD CONSTRAINT products_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES totum_system.product_types(id);


--
-- Name: profiles profiles_department_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.profiles
    ADD CONSTRAINT profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES totum_system.departments(id);


--
-- Name: profiles profiles_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.profiles
    ADD CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_role_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.profiles
    ADD CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES totum_system.roles(id);


--
-- Name: project_template_tasks project_template_tasks_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.project_template_tasks
    ADD CONSTRAINT project_template_tasks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: project_template_tasks project_template_tasks_template_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.project_template_tasks
    ADD CONSTRAINT project_template_tasks_template_id_fkey FOREIGN KEY (template_id) REFERENCES totum_system.project_templates(id) ON DELETE CASCADE;


--
-- Name: project_templates project_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.project_templates
    ADD CONSTRAINT project_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: project_types project_types_revenue_type_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.project_types
    ADD CONSTRAINT project_types_revenue_type_id_fkey FOREIGN KEY (revenue_type_id) REFERENCES totum_system.revenue_types(id);


--
-- Name: project_types project_types_service_type_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.project_types
    ADD CONSTRAINT project_types_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES totum_system.service_types(id);


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES totum_system.clients(id);


--
-- Name: projects projects_contract_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.projects
    ADD CONSTRAINT projects_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES totum_system.contracts(id);


--
-- Name: projects projects_project_type_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.projects
    ADD CONSTRAINT projects_project_type_id_fkey FOREIGN KEY (project_type_id) REFERENCES totum_system.project_types(id);


--
-- Name: services services_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.services
    ADD CONSTRAINT services_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: services services_service_type_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.services
    ADD CONSTRAINT services_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES totum_system.service_types(id);


--
-- Name: sla_rules sla_rules_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.sla_rules
    ADD CONSTRAINT sla_rules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: subtasks subtasks_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.subtasks
    ADD CONSTRAINT subtasks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: subtasks subtasks_task_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.subtasks
    ADD CONSTRAINT subtasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES totum_system.tasks(id) ON DELETE CASCADE;


--
-- Name: suppliers suppliers_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.suppliers
    ADD CONSTRAINT suppliers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: tags tags_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tags
    ADD CONSTRAINT tags_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: task_checklist_items task_checklist_items_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_checklist_items
    ADD CONSTRAINT task_checklist_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: task_checklist_items task_checklist_items_task_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_checklist_items
    ADD CONSTRAINT task_checklist_items_task_id_fkey FOREIGN KEY (task_id) REFERENCES totum_system.tasks(id) ON DELETE CASCADE;


--
-- Name: task_comments task_comments_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_comments
    ADD CONSTRAINT task_comments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES totum_system.tasks(id) ON DELETE CASCADE;


--
-- Name: task_dependencies task_dependencies_depends_on_task_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_dependencies
    ADD CONSTRAINT task_dependencies_depends_on_task_id_fkey FOREIGN KEY (depends_on_task_id) REFERENCES totum_system.tasks(id) ON DELETE CASCADE;


--
-- Name: task_dependencies task_dependencies_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_dependencies
    ADD CONSTRAINT task_dependencies_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: task_dependencies task_dependencies_project_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_dependencies
    ADD CONSTRAINT task_dependencies_project_id_fkey FOREIGN KEY (project_id) REFERENCES totum_system.projects(id);


--
-- Name: task_dependencies task_dependencies_task_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_dependencies
    ADD CONSTRAINT task_dependencies_task_id_fkey FOREIGN KEY (task_id) REFERENCES totum_system.tasks(id) ON DELETE CASCADE;


--
-- Name: task_goals task_goals_client_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_goals
    ADD CONSTRAINT task_goals_client_id_fkey FOREIGN KEY (client_id) REFERENCES totum_system.clients(id);


--
-- Name: task_goals task_goals_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_goals
    ADD CONSTRAINT task_goals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: task_history task_history_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_history
    ADD CONSTRAINT task_history_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: task_history task_history_task_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_history
    ADD CONSTRAINT task_history_task_id_fkey FOREIGN KEY (task_id) REFERENCES totum_system.tasks(id) ON DELETE CASCADE;


--
-- Name: task_template_items task_template_items_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_template_items
    ADD CONSTRAINT task_template_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: task_template_items task_template_items_template_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_template_items
    ADD CONSTRAINT task_template_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES totum_system.task_templates(id) ON DELETE CASCADE;


--
-- Name: task_templates task_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.task_templates
    ADD CONSTRAINT task_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_client_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tasks
    ADD CONSTRAINT tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES totum_system.clients(id);


--
-- Name: tasks tasks_contract_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tasks
    ADD CONSTRAINT tasks_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES totum_system.contracts(id);


--
-- Name: tasks tasks_delivery_model_item_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tasks
    ADD CONSTRAINT tasks_delivery_model_item_id_fkey FOREIGN KEY (delivery_model_item_id) REFERENCES totum_system.delivery_model_items(id);


--
-- Name: tasks tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tasks
    ADD CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES totum_system.tasks(id);


--
-- Name: tasks tasks_plan_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tasks
    ADD CONSTRAINT tasks_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES totum_system.plans(id);


--
-- Name: tasks tasks_pop_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tasks
    ADD CONSTRAINT tasks_pop_id_fkey FOREIGN KEY (pop_id) REFERENCES totum_system.pops(id);


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES totum_system.projects(id);


--
-- Name: tasks tasks_sla_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.tasks
    ADD CONSTRAINT tasks_sla_id_fkey FOREIGN KEY (sla_id) REFERENCES totum_system.sla_rules(id);


--
-- Name: user_roles user_roles_organization_id_fkey; Type: FK CONSTRAINT; Schema: totum_system; Owner: -
--

ALTER TABLE ONLY totum_system.user_roles
    ADD CONSTRAINT user_roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES totum_system.organizations(id) ON DELETE SET NULL;


--
-- Name: asaas_config Admins manage asaas_config; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Admins manage asaas_config" ON totum_system.asaas_config TO authenticated USING ((EXISTS ( SELECT 1
   FROM totum_system.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::totum_system.app_role)))));


--
-- Name: company_settings Admins manage company_settings; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Admins manage company_settings" ON totum_system.company_settings TO authenticated USING ((EXISTS ( SELECT 1
   FROM totum_system.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::totum_system.app_role)))));


--
-- Name: organizations Admins manage organizations; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Admins manage organizations" ON totum_system.organizations USING ((EXISTS ( SELECT 1
   FROM totum_system.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::totum_system.app_role)))));


--
-- Name: asaas_webhook_logs Admins read asaas_webhook_logs; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Admins read asaas_webhook_logs" ON totum_system.asaas_webhook_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM totum_system.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::totum_system.app_role)))));


--
-- Name: audit_logs Admins read audit_logs; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Admins read audit_logs" ON totum_system.audit_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM totum_system.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::totum_system.app_role)))));


--
-- Name: error_logs Admins read error_logs; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Admins read error_logs" ON totum_system.error_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM totum_system.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::totum_system.app_role)))));


--
-- Name: audit_logs Authenticated insert audit_logs; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated insert audit_logs" ON totum_system.audit_logs FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: client_observations Authenticated insert client_observations; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated insert client_observations" ON totum_system.client_observations FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: clients Authenticated insert clients; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated insert clients" ON totum_system.clients FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: contracts Authenticated insert contracts; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated insert contracts" ON totum_system.contracts FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: error_logs Authenticated insert error_logs; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated insert error_logs" ON totum_system.error_logs FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: financial_entries Authenticated insert financial_entries; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated insert financial_entries" ON totum_system.financial_entries FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: notifications Authenticated insert notifications; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated insert notifications" ON totum_system.notifications FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: projects Authenticated insert projects; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated insert projects" ON totum_system.projects FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: tasks Authenticated insert tasks; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated insert tasks" ON totum_system.tasks FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: banks Authenticated read banks; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read banks" ON totum_system.banks FOR SELECT TO authenticated USING (true);


--
-- Name: cancellation_reasons Authenticated read cancellation_reasons; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read cancellation_reasons" ON totum_system.cancellation_reasons FOR SELECT TO authenticated USING (true);


--
-- Name: client_types Authenticated read client_types; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read client_types" ON totum_system.client_types FOR SELECT TO authenticated USING (true);


--
-- Name: contract_types Authenticated read contract_types; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read contract_types" ON totum_system.contract_types FOR SELECT TO authenticated USING (true);


--
-- Name: delay_reasons Authenticated read delay_reasons; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read delay_reasons" ON totum_system.delay_reasons FOR SELECT TO authenticated USING (true);


--
-- Name: delinquency_reasons Authenticated read delinquency_reasons; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read delinquency_reasons" ON totum_system.delinquency_reasons FOR SELECT TO authenticated USING (true);


--
-- Name: delivery_model_items Authenticated read delivery_model_items; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read delivery_model_items" ON totum_system.delivery_model_items FOR SELECT TO authenticated USING (true);


--
-- Name: expense_types Authenticated read expense_types; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read expense_types" ON totum_system.expense_types FOR SELECT TO authenticated USING (true);


--
-- Name: plans Authenticated read plans; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read plans" ON totum_system.plans FOR SELECT TO authenticated USING (true);


--
-- Name: pop_checklist_items Authenticated read pop_checklist_items; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read pop_checklist_items" ON totum_system.pop_checklist_items FOR SELECT TO authenticated USING (true);


--
-- Name: pop_steps Authenticated read pop_steps; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read pop_steps" ON totum_system.pop_steps FOR SELECT TO authenticated USING (true);


--
-- Name: pops Authenticated read pops; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read pops" ON totum_system.pops FOR SELECT TO authenticated USING (true);


--
-- Name: product_types Authenticated read product_types; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read product_types" ON totum_system.product_types FOR SELECT TO authenticated USING (true);


--
-- Name: project_types Authenticated read project_types; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read project_types" ON totum_system.project_types FOR SELECT TO authenticated USING (true);


--
-- Name: revenue_types Authenticated read revenue_types; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read revenue_types" ON totum_system.revenue_types FOR SELECT TO authenticated USING (true);


--
-- Name: roles Authenticated read roles; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read roles" ON totum_system.roles FOR SELECT TO authenticated USING (true);


--
-- Name: service_types Authenticated read service_types; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read service_types" ON totum_system.service_types FOR SELECT TO authenticated USING (true);


--
-- Name: system_settings Authenticated read system_settings; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Authenticated read system_settings" ON totum_system.system_settings FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Master insert profiles; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Master insert profiles" ON totum_system.profiles FOR INSERT WITH CHECK (totum_system.is_master_user());


--
-- Name: organizations Master manage organizations; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Master manage organizations" ON totum_system.organizations TO authenticated USING (totum_system.is_master_user()) WITH CHECK (totum_system.is_master_user());


--
-- Name: api_keys Org admins manage api_keys; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org admins manage api_keys" ON totum_system.api_keys TO authenticated USING (((totum_system.is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM totum_system.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_master = true))))) AND ((organization_id = ( SELECT profiles.organization_id
   FROM totum_system.profiles
  WHERE (profiles.user_id = auth.uid())
 LIMIT 1)) OR (EXISTS ( SELECT 1
   FROM totum_system.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_master = true))))))) WITH CHECK (((totum_system.is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM totum_system.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_master = true))))) AND ((organization_id = ( SELECT profiles.organization_id
   FROM totum_system.profiles
  WHERE (profiles.user_id = auth.uid())
 LIMIT 1)) OR (EXISTS ( SELECT 1
   FROM totum_system.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_master = true)))))));


--
-- Name: task_comments Org members can delete own task comments; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can delete own task comments" ON totum_system.task_comments FOR DELETE TO authenticated USING ((totum_system.can_access_task(task_id) AND (user_id = auth.uid())));


--
-- Name: delivery_checklists Org members can insert delivery checklists; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can insert delivery checklists" ON totum_system.delivery_checklists FOR INSERT TO authenticated WITH CHECK ((totum_system.can_access_org(organization_id) AND ((client_id IS NULL) OR totum_system.can_access_client(client_id))));


--
-- Name: task_comments Org members can insert own task comments; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can insert own task comments" ON totum_system.task_comments FOR INSERT TO authenticated WITH CHECK ((totum_system.can_access_task(task_id) AND (user_id = auth.uid())));


--
-- Name: task_history Org members can insert task history; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can insert task history" ON totum_system.task_history FOR INSERT TO authenticated WITH CHECK ((totum_system.can_access_task(task_id) AND ((user_id IS NULL) OR (user_id = auth.uid()))));


--
-- Name: delivery_checklist_items Org members can manage delivery checklist items; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can manage delivery checklist items" ON totum_system.delivery_checklist_items TO authenticated USING (totum_system.can_access_delivery_checklist(checklist_id)) WITH CHECK (totum_system.can_access_delivery_checklist(checklist_id));


--
-- Name: subtasks Org members can manage subtasks; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can manage subtasks" ON totum_system.subtasks TO authenticated USING (totum_system.can_access_task(task_id)) WITH CHECK (totum_system.can_access_task(task_id));


--
-- Name: task_checklist_items Org members can manage task checklist items; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can manage task checklist items" ON totum_system.task_checklist_items TO authenticated USING (totum_system.can_access_task(task_id)) WITH CHECK (totum_system.can_access_task(task_id));


--
-- Name: delivery_checklists Org members can update delivery checklists; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can update delivery checklists" ON totum_system.delivery_checklists FOR UPDATE TO authenticated USING ((totum_system.can_access_org(organization_id) AND ((client_id IS NULL) OR totum_system.can_access_client(client_id)))) WITH CHECK ((totum_system.can_access_org(organization_id) AND ((client_id IS NULL) OR totum_system.can_access_client(client_id))));


--
-- Name: task_comments Org members can update own task comments; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can update own task comments" ON totum_system.task_comments FOR UPDATE TO authenticated USING ((totum_system.can_access_task(task_id) AND (user_id = auth.uid()))) WITH CHECK ((totum_system.can_access_task(task_id) AND (user_id = auth.uid())));


--
-- Name: delivery_checklists Org members can view delivery checklists; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can view delivery checklists" ON totum_system.delivery_checklists FOR SELECT TO authenticated USING ((totum_system.can_access_org(organization_id) AND ((client_id IS NULL) OR totum_system.can_access_client(client_id))));


--
-- Name: task_comments Org members can view task comments; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can view task comments" ON totum_system.task_comments FOR SELECT TO authenticated USING (totum_system.can_access_task(task_id));


--
-- Name: task_history Org members can view task history; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org members can view task history" ON totum_system.task_history FOR SELECT TO authenticated USING (totum_system.can_access_task(task_id));


--
-- Name: profiles Org scoped profiles select; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Org scoped profiles select" ON totum_system.profiles FOR SELECT TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: organizations Public read active organizations; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Public read active organizations" ON totum_system.organizations FOR SELECT USING ((is_active = true));


--
-- Name: agents Tenant isolation on agents; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on agents" ON totum_system.agents TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: asaas_config Tenant isolation on asaas_config; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on asaas_config" ON totum_system.asaas_config TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: asaas_customers Tenant isolation on asaas_customers; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on asaas_customers" ON totum_system.asaas_customers TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: asaas_payments Tenant isolation on asaas_payments; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on asaas_payments" ON totum_system.asaas_payments TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: asaas_subscriptions Tenant isolation on asaas_subscriptions; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on asaas_subscriptions" ON totum_system.asaas_subscriptions TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: asaas_webhook_logs Tenant isolation on asaas_webhook_logs; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on asaas_webhook_logs" ON totum_system.asaas_webhook_logs TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: audit_logs Tenant isolation on audit_logs; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on audit_logs" ON totum_system.audit_logs TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: bank_accounts Tenant isolation on bank_accounts; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on bank_accounts" ON totum_system.bank_accounts TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: client_observations Tenant isolation on client_observations; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on client_observations" ON totum_system.client_observations TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: clients Tenant isolation on clients; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on clients" ON totum_system.clients TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: company_settings Tenant isolation on company_settings; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on company_settings" ON totum_system.company_settings TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: contract_products Tenant isolation on contract_products; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on contract_products" ON totum_system.contract_products TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: contracts Tenant isolation on contracts; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on contracts" ON totum_system.contracts TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: cost_centers Tenant isolation on cost_centers; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on cost_centers" ON totum_system.cost_centers TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: departments Tenant isolation on departments; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on departments" ON totum_system.departments TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: despesas_recorrentes Tenant isolation on despesas_recorrentes; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on despesas_recorrentes" ON totum_system.despesas_recorrentes TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: error_logs Tenant isolation on error_logs; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on error_logs" ON totum_system.error_logs TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: financial_categories Tenant isolation on financial_categories; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on financial_categories" ON totum_system.financial_categories TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: financial_entries Tenant isolation on financial_entries; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on financial_entries" ON totum_system.financial_entries TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: general_categories Tenant isolation on general_categories; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on general_categories" ON totum_system.general_categories TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: import_batches Tenant isolation on import_batches; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on import_batches" ON totum_system.import_batches TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: notifications Tenant isolation on notifications; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on notifications" ON totum_system.notifications TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: partners Tenant isolation on partners; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on partners" ON totum_system.partners TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: products Tenant isolation on products; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on products" ON totum_system.products TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: project_template_tasks Tenant isolation on project_template_tasks; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on project_template_tasks" ON totum_system.project_template_tasks TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: project_templates Tenant isolation on project_templates; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on project_templates" ON totum_system.project_templates TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: projects Tenant isolation on projects; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on projects" ON totum_system.projects TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: services Tenant isolation on services; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on services" ON totum_system.services TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: sla_rules Tenant isolation on sla_rules; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on sla_rules" ON totum_system.sla_rules TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: suppliers Tenant isolation on suppliers; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on suppliers" ON totum_system.suppliers TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: tags Tenant isolation on tags; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on tags" ON totum_system.tags TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: task_dependencies Tenant isolation on task_dependencies; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on task_dependencies" ON totum_system.task_dependencies TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: task_goals Tenant isolation on task_goals; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on task_goals" ON totum_system.task_goals TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: task_template_items Tenant isolation on task_template_items; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on task_template_items" ON totum_system.task_template_items TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: task_templates Tenant isolation on task_templates; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on task_templates" ON totum_system.task_templates TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: tasks Tenant isolation on tasks; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on tasks" ON totum_system.tasks TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: user_roles Tenant isolation on user_roles; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant isolation on user_roles" ON totum_system.user_roles TO authenticated USING (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user())) WITH CHECK (((organization_id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: organizations Tenant see own org; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Tenant see own org" ON totum_system.organizations FOR SELECT TO authenticated USING (((id = totum_system.get_user_organization_id()) OR totum_system.is_master_user()));


--
-- Name: notifications Users read own notifications; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Users read own notifications" ON totum_system.notifications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: notifications Users update own notifications; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Users update own notifications" ON totum_system.notifications FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users update own profile; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY "Users update own profile" ON totum_system.profiles FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR totum_system.is_master_user()));


--
-- Name: agents; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.agents ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: asaas_config; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.asaas_config ENABLE ROW LEVEL SECURITY;

--
-- Name: asaas_customers; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.asaas_customers ENABLE ROW LEVEL SECURITY;

--
-- Name: asaas_payments; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.asaas_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: asaas_subscriptions; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.asaas_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: asaas_webhook_logs; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.asaas_webhook_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: bank_accounts; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.bank_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: banks; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.banks ENABLE ROW LEVEL SECURITY;

--
-- Name: cancellation_reasons; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.cancellation_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: client_observations; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.client_observations ENABLE ROW LEVEL SECURITY;

--
-- Name: client_types; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.client_types ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: company_settings; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.company_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_products; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.contract_products ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_types; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.contract_types ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: cost_centers; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.cost_centers ENABLE ROW LEVEL SECURITY;

--
-- Name: delay_reasons; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.delay_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: delinquency_reasons; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.delinquency_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_checklist_items; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.delivery_checklist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_checklists; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.delivery_checklists ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_model_items; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.delivery_model_items ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_model_items delivery_model_items_manage; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY delivery_model_items_manage ON totum_system.delivery_model_items TO authenticated USING ((totum_system.is_admin(auth.uid()) OR totum_system.is_master_user())) WITH CHECK ((totum_system.is_admin(auth.uid()) OR totum_system.is_master_user()));


--
-- Name: delivery_model_items delivery_model_items_read; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY delivery_model_items_read ON totum_system.delivery_model_items FOR SELECT TO authenticated USING (true);


--
-- Name: departments; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.departments ENABLE ROW LEVEL SECURITY;

--
-- Name: despesas_recorrentes; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.despesas_recorrentes ENABLE ROW LEVEL SECURITY;

--
-- Name: error_logs; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.error_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: expense_types; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.expense_types ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_categories; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.financial_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_entries; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.financial_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: general_categories; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.general_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: import_batches; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.import_batches ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: partners; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.partners ENABLE ROW LEVEL SECURITY;

--
-- Name: plans; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.plans ENABLE ROW LEVEL SECURITY;

--
-- Name: pop_checklist_items; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.pop_checklist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: pop_steps; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.pop_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: pops; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.pops ENABLE ROW LEVEL SECURITY;

--
-- Name: product_types; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.product_types ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: project_template_tasks; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.project_template_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: project_templates; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.project_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: project_types; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.project_types ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue_types; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.revenue_types ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: sdr_webhook_events sdr_evt_insert; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY sdr_evt_insert ON totum_system.sdr_webhook_events FOR INSERT TO anon WITH CHECK (true);


--
-- Name: sdr_webhook_events sdr_evt_select; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY sdr_evt_select ON totum_system.sdr_webhook_events FOR SELECT TO anon USING (true);


--
-- Name: sdr_webhook_events sdr_evt_update; Type: POLICY; Schema: totum_system; Owner: -
--

CREATE POLICY sdr_evt_update ON totum_system.sdr_webhook_events FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: sdr_webhook_events; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.sdr_webhook_events ENABLE ROW LEVEL SECURITY;

--
-- Name: service_types; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.service_types ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.services ENABLE ROW LEVEL SECURITY;

--
-- Name: sla_rules; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.sla_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: subtasks; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.subtasks ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: system_settings; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.system_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.tags ENABLE ROW LEVEL SECURITY;

--
-- Name: task_checklist_items; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.task_checklist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: task_comments; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.task_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: task_dependencies; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.task_dependencies ENABLE ROW LEVEL SECURITY;

--
-- Name: task_goals; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.task_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: task_history; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.task_history ENABLE ROW LEVEL SECURITY;

--
-- Name: task_template_items; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.task_template_items ENABLE ROW LEVEL SECURITY;

--
-- Name: task_templates; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.task_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: totum_system; Owner: -
--

ALTER TABLE totum_system.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

