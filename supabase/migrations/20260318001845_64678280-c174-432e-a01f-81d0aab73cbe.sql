
-- ============================================================
-- ERP BACKEND - COMPLETE DATABASE SCHEMA
-- ============================================================

-- 0. UTILITY FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin','diretor','financeiro','gestor','social_media','designer','trafego','atendimento','assistente','parceiro','cliente_convidado');
CREATE TYPE public.user_status AS ENUM ('ativo','inativo','bloqueado');
CREATE TYPE public.contract_status AS ENUM ('ativo','pausado','cancelado','encerrado');
CREATE TYPE public.task_status AS ENUM ('pendente','em_andamento','pausado','concluido');
CREATE TYPE public.task_priority AS ENUM ('baixa','media','alta','urgente');
CREATE TYPE public.task_type AS ENUM ('conteudo','trafego','reuniao','relatorio','design','desenvolvimento','outro');
CREATE TYPE public.delivery_item_status AS ENUM ('entregue','entregue_parcialmente','nao_entregue','nao_aplicavel');
CREATE TYPE public.expense_recurrence AS ENUM ('recorrente','unica','parcelada');
CREATE TYPE public.financial_entry_status AS ENUM ('pendente','pago','atrasado','cancelado');
CREATE TYPE public.checklist_frequency AS ENUM ('semanal','quinzenal','mensal','personalizada');

-- 2. DEPARTMENTS
CREATE TABLE public.departments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 3. ROLES
CREATE TABLE public.roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, permissions JSONB NOT NULL DEFAULT '{}'::jsonb, is_system BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 4. PROFILES
CREATE TABLE public.profiles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, role_id UUID REFERENCES public.roles(id), department_id UUID REFERENCES public.departments(id), status public.user_status NOT NULL DEFAULT 'ativo', last_access TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. USER_ROLES
CREATE TABLE public.user_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id, role));
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. SECURITY DEFINER FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','diretor')); $$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID) RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(r.permissions, '{}'::jsonb) FROM public.profiles p JOIN public.roles r ON r.id = p.role_id WHERE p.user_id = _user_id LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _perm_key TEXT) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE((public.get_user_permissions(_user_id) ->> _perm_key)::boolean, false); $$;

-- 7. CLIENT TYPES
CREATE TABLE public.client_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.client_types ENABLE ROW LEVEL SECURITY;

-- 8. CLIENTS
CREATE TABLE public.clients (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT, phone TEXT, document TEXT, address TEXT, client_type_id UUID REFERENCES public.client_types(id), status TEXT NOT NULL DEFAULT 'ativo', assigned_user_id UUID REFERENCES auth.users(id), notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 9. CONTRACT TYPES
CREATE TABLE public.contract_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;

-- 10. SERVICE TYPES
CREATE TABLE public.service_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- 11. PRODUCT TYPES
CREATE TABLE public.product_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;

-- 12. PROJECT TYPES
CREATE TABLE public.project_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;

-- 13. PLANS
CREATE TABLE public.plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT, value NUMERIC(12,2), frequency public.checklist_frequency NOT NULL DEFAULT 'mensal', is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- 14. DELIVERY MODEL ITEMS
CREATE TABLE public.delivery_model_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, task_type public.task_type NOT NULL DEFAULT 'outro', suggested_priority public.task_priority NOT NULL DEFAULT 'media', suggested_responsible_id UUID REFERENCES auth.users(id), sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.delivery_model_items ENABLE ROW LEVEL SECURITY;

-- 15. PRODUCTS
CREATE TABLE public.products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT, product_type_id UUID REFERENCES public.product_types(id), price NUMERIC(12,2), cost NUMERIC(12,2), is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 16. SERVICES
CREATE TABLE public.services (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT, service_type_id UUID REFERENCES public.service_types(id), price NUMERIC(12,2), is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 17. CONTRACTS
CREATE TABLE public.contracts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE, contract_type_id UUID REFERENCES public.contract_types(id), plan_id UUID REFERENCES public.plans(id), title TEXT NOT NULL, value NUMERIC(12,2), start_date DATE, end_date DATE, billing_frequency public.checklist_frequency DEFAULT 'mensal', status public.contract_status NOT NULL DEFAULT 'ativo', notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- 18. PROJECTS
CREATE TABLE public.projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE, contract_id UUID REFERENCES public.contracts(id), project_type_id UUID REFERENCES public.project_types(id), name TEXT NOT NULL, description TEXT, responsible_id UUID REFERENCES auth.users(id), status public.task_status NOT NULL DEFAULT 'pendente', start_date DATE, due_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 19. TASKS
CREATE TABLE public.tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE, contract_id UUID REFERENCES public.contracts(id), project_id UUID REFERENCES public.projects(id), plan_id UUID REFERENCES public.plans(id), delivery_model_item_id UUID REFERENCES public.delivery_model_items(id), responsible_id UUID REFERENCES auth.users(id), priority public.task_priority NOT NULL DEFAULT 'media', status public.task_status NOT NULL DEFAULT 'pendente', task_type public.task_type NOT NULL DEFAULT 'outro', start_date DATE, due_date DATE, estimated_minutes INT, actual_minutes INT, generation_period TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 20. SUBTASKS
CREATE TABLE public.subtasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE, title TEXT NOT NULL, responsible_id UUID REFERENCES auth.users(id), status public.task_status NOT NULL DEFAULT 'pendente', due_date DATE, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- 21. TASK CHECKLIST ITEMS
CREATE TABLE public.task_checklist_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE, text TEXT NOT NULL, completed BOOLEAN NOT NULL DEFAULT false, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- 22. TASK COMMENTS
CREATE TABLE public.task_comments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id), content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- 23. TASK HISTORY
CREATE TABLE public.task_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE, user_id UUID REFERENCES auth.users(id), action TEXT NOT NULL, detail TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- 24. DELIVERY CHECKLISTS
CREATE TABLE public.delivery_checklists (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE, contract_id UUID REFERENCES public.contracts(id), plan_id UUID REFERENCES public.plans(id), period TEXT NOT NULL, frequency public.checklist_frequency NOT NULL DEFAULT 'mensal', completed_at TIMESTAMPTZ, completed_by UUID REFERENCES auth.users(id), fulfillment_pct NUMERIC(5,2) DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.delivery_checklists ENABLE ROW LEVEL SECURITY;

-- 25. DELIVERY CHECKLIST ITEMS
CREATE TABLE public.delivery_checklist_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), checklist_id UUID NOT NULL REFERENCES public.delivery_checklists(id) ON DELETE CASCADE, delivery_model_item_id UUID REFERENCES public.delivery_model_items(id), task_id UUID REFERENCES public.tasks(id), name TEXT NOT NULL, status public.delivery_item_status, observation TEXT, justification TEXT, responsible_id UUID REFERENCES auth.users(id), completed_at TIMESTAMPTZ, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.delivery_checklist_items ENABLE ROW LEVEL SECURITY;

-- 26. BANKS
CREATE TABLE public.banks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, code TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- 27. BANK ACCOUNTS
CREATE TABLE public.bank_accounts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), bank_id UUID NOT NULL REFERENCES public.banks(id), name TEXT NOT NULL, agency TEXT, account_number TEXT, account_type TEXT, balance NUMERIC(14,2) NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- 28. FINANCIAL CATEGORIES
CREATE TABLE public.financial_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('receita','despesa')), parent_id UUID REFERENCES public.financial_categories(id), is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- 29. COST CENTERS
CREATE TABLE public.cost_centers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

-- 30. EXPENSE TYPES
CREATE TABLE public.expense_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, recurrence public.expense_recurrence NOT NULL DEFAULT 'unica', description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;

-- 31. SUPPLIERS
CREATE TABLE public.suppliers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT, phone TEXT, document TEXT, address TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 32. FINANCIAL ENTRIES
CREATE TABLE public.financial_entries (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type TEXT NOT NULL CHECK (type IN ('pagar','receber')), category_id UUID REFERENCES public.financial_categories(id), cost_center_id UUID REFERENCES public.cost_centers(id), expense_type_id UUID REFERENCES public.expense_types(id), client_id UUID REFERENCES public.clients(id), contract_id UUID REFERENCES public.contracts(id), bank_account_id UUID REFERENCES public.bank_accounts(id), supplier_id UUID REFERENCES public.suppliers(id), description TEXT NOT NULL, value NUMERIC(12,2) NOT NULL, due_date DATE NOT NULL, competence_date DATE, payment_date DATE, status public.financial_entry_status NOT NULL DEFAULT 'pendente', recurrence public.expense_recurrence DEFAULT 'unica', installment_number INT, total_installments INT, notes TEXT, created_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

-- 33. PARTNERS
CREATE TABLE public.partners (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT, phone TEXT, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 34. TAGS
CREATE TABLE public.tags (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, color TEXT, module TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- 35. GENERAL CATEGORIES
CREATE TABLE public.general_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT, module TEXT NOT NULL, color TEXT, icon TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(name, module));
ALTER TABLE public.general_categories ENABLE ROW LEVEL SECURITY;

-- 36. REASONS
CREATE TABLE public.cancellation_reasons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.cancellation_reasons ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.delinquency_reasons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.delinquency_reasons ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.delay_reasons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.delay_reasons ENABLE ROW LEVEL SECURITY;

-- 37. AUDIT LOGS
CREATE TABLE public.audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id UUID, detail TEXT, old_data JSONB, new_data JSONB, ip_address TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 38. NOTIFICATIONS
CREATE TABLE public.notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, title TEXT NOT NULL, message TEXT, type TEXT NOT NULL DEFAULT 'info', entity_type TEXT, entity_id UUID, is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 39. INDEXES
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX idx_clients_assigned_user ON public.clients(assigned_user_id);
CREATE INDEX idx_contracts_client ON public.contracts(client_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_tasks_client ON public.tasks(client_id);
CREATE INDEX idx_tasks_responsible ON public.tasks(responsible_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_subtasks_task ON public.subtasks(task_id);
CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX idx_task_history_task ON public.task_history(task_id);
CREATE INDEX idx_delivery_checklists_client ON public.delivery_checklists(client_id);
CREATE INDEX idx_delivery_checklists_period ON public.delivery_checklists(period);
CREATE INDEX idx_delivery_items_checklist ON public.delivery_checklist_items(checklist_id);
CREATE INDEX idx_financial_entries_type ON public.financial_entries(type);
CREATE INDEX idx_financial_entries_status ON public.financial_entries(status);
CREATE INDEX idx_financial_entries_due_date ON public.financial_entries(due_date);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE NOT is_read;

-- 40. TRIGGERS
CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_delivery_checklists_updated BEFORE UPDATE ON public.delivery_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bank_accounts_updated BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_financial_entries_updated BEFORE UPDATE ON public.financial_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_partners_updated BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_general_categories_updated BEFORE UPDATE ON public.general_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 41. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles (user_id, full_name, email) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), NEW.email); RETURN NEW; END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 42. AUDIT LOG HELPER
CREATE OR REPLACE FUNCTION public.log_audit(_user_id UUID, _action TEXT, _entity_type TEXT, _entity_id UUID DEFAULT NULL, _detail TEXT DEFAULT NULL, _old_data JSONB DEFAULT NULL, _new_data JSONB DEFAULT NULL) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, detail, old_data, new_data) VALUES (_user_id, _action, _entity_type, _entity_id, _detail, _old_data, _new_data); END; $$;

-- 43. DELIVERY CHECKLIST JUSTIFICATION CONSTRAINT
CREATE OR REPLACE FUNCTION public.check_delivery_justification() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$ BEGIN IF NEW.status IN ('entregue_parcialmente', 'nao_entregue') AND (NEW.justification IS NULL OR TRIM(NEW.justification) = '') THEN RAISE EXCEPTION 'Justificativa obrigatória para itens com status entregue parcialmente ou não entregue'; END IF; RETURN NEW; END; $$;

CREATE TRIGGER trg_delivery_item_justification BEFORE INSERT OR UPDATE ON public.delivery_checklist_items FOR EACH ROW EXECUTE FUNCTION public.check_delivery_justification();

-- 44. RLS POLICIES

-- Departments
CREATE POLICY "Auth users can view departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Roles
CREATE POLICY "Auth users can view roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.roles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Profiles
CREATE POLICY "Auth users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- User roles
CREATE POLICY "Admins can manage user_roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Clients
CREATE POLICY "Auth users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Master data (read: all auth, write: admin)
CREATE POLICY "Auth read client_types" ON public.client_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage client_types" ON public.client_types FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read contract_types" ON public.contract_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage contract_types" ON public.contract_types FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read service_types" ON public.service_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage service_types" ON public.service_types FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read product_types" ON public.product_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage product_types" ON public.product_types FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read project_types" ON public.project_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage project_types" ON public.project_types FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Plans and delivery models
CREATE POLICY "Auth read plans" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage plans" ON public.plans FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read delivery_model_items" ON public.delivery_model_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage delivery_model_items" ON public.delivery_model_items FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Products and services
CREATE POLICY "Auth read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage products" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth read services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage services" ON public.services FOR ALL TO authenticated USING (true);

-- Contracts
CREATE POLICY "Auth read contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update contracts" ON public.contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete contracts" ON public.contracts FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Projects
CREATE POLICY "Auth read projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update projects" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete projects" ON public.projects FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Tasks
CREATE POLICY "Auth read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete tasks" ON public.tasks FOR DELETE TO authenticated USING (true);

-- Task sub-entities
CREATE POLICY "Auth manage subtasks" ON public.subtasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage task_checklist" ON public.task_checklist_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage task_comments" ON public.task_comments FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth read task_history" ON public.task_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert task_history" ON public.task_history FOR INSERT TO authenticated WITH CHECK (true);

-- Delivery checklists
CREATE POLICY "Auth read delivery_checklists" ON public.delivery_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert delivery_checklists" ON public.delivery_checklists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update delivery_checklists" ON public.delivery_checklists FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth manage delivery_checklist_items" ON public.delivery_checklist_items FOR ALL TO authenticated USING (true);

-- Financial
CREATE POLICY "Auth read banks" ON public.banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage banks" ON public.banks FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read bank_accounts" ON public.bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage bank_accounts" ON public.bank_accounts FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read financial_categories" ON public.financial_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage financial_categories" ON public.financial_categories FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read cost_centers" ON public.cost_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage cost_centers" ON public.cost_centers FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read expense_types" ON public.expense_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage expense_types" ON public.expense_types FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read financial_entries" ON public.financial_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert financial_entries" ON public.financial_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update financial_entries" ON public.financial_entries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete financial_entries" ON public.financial_entries FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Suppliers, partners, tags
CREATE POLICY "Auth read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth read partners" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage partners" ON public.partners FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth read tags" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage tags" ON public.tags FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth read general_categories" ON public.general_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage general_categories" ON public.general_categories FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Reasons
CREATE POLICY "Auth read cancellation_reasons" ON public.cancellation_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage cancellation_reasons" ON public.cancellation_reasons FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read delinquency_reasons" ON public.delinquency_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage delinquency_reasons" ON public.delinquency_reasons FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Auth read delay_reasons" ON public.delay_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage delay_reasons" ON public.delay_reasons FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Audit logs
CREATE POLICY "Admin read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "System insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
