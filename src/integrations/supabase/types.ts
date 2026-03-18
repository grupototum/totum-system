export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency: string | null
          balance: number
          bank_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          balance?: number
          bank_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          balance?: number
          bank_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      cancellation_reasons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      client_observations: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_observations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          assigned_user_id: string | null
          client_type_id: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          marketing_analysis: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_user_id?: string | null
          client_type_id?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          marketing_analysis?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_user_id?: string | null
          client_type_id?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          marketing_analysis?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_client_type_id_fkey"
            columns: ["client_type_id"]
            isOneToOne: false
            referencedRelation: "client_types"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contract_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          billing_frequency:
            | Database["public"]["Enums"]["checklist_frequency"]
            | null
          client_id: string
          contract_type_id: string | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          plan_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          billing_frequency?:
            | Database["public"]["Enums"]["checklist_frequency"]
            | null
          client_id: string
          contract_type_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          billing_frequency?:
            | Database["public"]["Enums"]["checklist_frequency"]
            | null
          client_id?: string
          contract_type_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      delay_reasons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      delinquency_reasons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      delivery_checklist_items: {
        Row: {
          checklist_id: string
          completed_at: string | null
          created_at: string
          delivery_model_item_id: string | null
          id: string
          justification: string | null
          name: string
          observation: string | null
          responsible_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["delivery_item_status"] | null
          task_id: string | null
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          created_at?: string
          delivery_model_item_id?: string | null
          id?: string
          justification?: string | null
          name: string
          observation?: string | null
          responsible_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["delivery_item_status"] | null
          task_id?: string | null
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          created_at?: string
          delivery_model_item_id?: string | null
          id?: string
          justification?: string | null
          name?: string
          observation?: string | null
          responsible_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["delivery_item_status"] | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "delivery_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_checklist_items_delivery_model_item_id_fkey"
            columns: ["delivery_model_item_id"]
            isOneToOne: false
            referencedRelation: "delivery_model_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_checklists: {
        Row: {
          client_id: string
          completed_at: string | null
          completed_by: string | null
          contract_id: string | null
          created_at: string
          frequency: Database["public"]["Enums"]["checklist_frequency"]
          fulfillment_pct: number | null
          id: string
          period: string
          plan_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          completed_by?: string | null
          contract_id?: string | null
          created_at?: string
          frequency?: Database["public"]["Enums"]["checklist_frequency"]
          fulfillment_pct?: number | null
          id?: string
          period: string
          plan_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          completed_by?: string | null
          contract_id?: string | null
          created_at?: string
          frequency?: Database["public"]["Enums"]["checklist_frequency"]
          fulfillment_pct?: number | null
          id?: string
          period?: string
          plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_checklists_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_checklists_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_checklists_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_model_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          plan_id: string
          sort_order: number
          suggested_priority: Database["public"]["Enums"]["task_priority"]
          suggested_responsible_id: string | null
          task_type: Database["public"]["Enums"]["task_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          plan_id: string
          sort_order?: number
          suggested_priority?: Database["public"]["Enums"]["task_priority"]
          suggested_responsible_id?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          plan_id?: string
          sort_order?: number
          suggested_priority?: Database["public"]["Enums"]["task_priority"]
          suggested_responsible_id?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
        }
        Relationships: [
          {
            foreignKeyName: "delivery_model_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: string | null
          created_at: string
          error_type: string
          id: string
          message: string
          stack_trace: string | null
          technical_message: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          error_type: string
          id?: string
          message: string
          stack_trace?: string | null
          technical_message?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          error_type?: string
          id?: string
          message?: string
          stack_trace?: string | null
          technical_message?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expense_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          recurrence: Database["public"]["Enums"]["expense_recurrence"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          recurrence?: Database["public"]["Enums"]["expense_recurrence"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          recurrence?: Database["public"]["Enums"]["expense_recurrence"]
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          bank_account_id: string | null
          category_id: string | null
          client_id: string | null
          competence_date: string | null
          contract_id: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string
          expense_type_id: string | null
          id: string
          installment_number: number | null
          notes: string | null
          payment_date: string | null
          recurrence: Database["public"]["Enums"]["expense_recurrence"] | null
          status: Database["public"]["Enums"]["financial_entry_status"]
          supplier_id: string | null
          total_installments: number | null
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          bank_account_id?: string | null
          category_id?: string | null
          client_id?: string | null
          competence_date?: string | null
          contract_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date: string
          expense_type_id?: string | null
          id?: string
          installment_number?: number | null
          notes?: string | null
          payment_date?: string | null
          recurrence?: Database["public"]["Enums"]["expense_recurrence"] | null
          status?: Database["public"]["Enums"]["financial_entry_status"]
          supplier_id?: string | null
          total_installments?: number | null
          type: string
          updated_at?: string
          value: number
        }
        Update: {
          bank_account_id?: string | null
          category_id?: string | null
          client_id?: string | null
          competence_date?: string | null
          contract_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string
          expense_type_id?: string | null
          id?: string
          installment_number?: number | null
          notes?: string | null
          payment_date?: string | null
          recurrence?: Database["public"]["Enums"]["expense_recurrence"] | null
          status?: Database["public"]["Enums"]["financial_entry_status"]
          supplier_id?: string | null
          total_installments?: number | null
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      general_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          module: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          module: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          module?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          frequency: Database["public"]["Enums"]["checklist_frequency"]
          id: string
          is_active: boolean
          name: string
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["checklist_frequency"]
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["checklist_frequency"]
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      product_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          product_type_id: string | null
          updated_at: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          product_type_id?: string | null
          updated_at?: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          product_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          commission_type: string | null
          commission_value: number | null
          created_at: string
          department_id: string | null
          email: string
          full_name: string
          id: string
          last_access: string | null
          phone: string | null
          role_id: string | null
          salary: number | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string
          department_id?: string | null
          email: string
          full_name: string
          id?: string
          last_access?: string | null
          phone?: string | null
          role_id?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          last_access?: string | null
          phone?: string | null
          role_id?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_template_tasks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          subtasks: Json | null
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          subtasks?: Json | null
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          subtasks?: Json | null
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          revenue_type_id: string | null
          service_type_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          revenue_type_id?: string | null
          service_type_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          revenue_type_id?: string | null
          service_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_types_revenue_type_id_fkey"
            columns: ["revenue_type_id"]
            isOneToOne: false
            referencedRelation: "revenue_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_types_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          contract_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          project_type_id: string | null
          responsible_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          project_type_id?: string | null
          responsible_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          project_type_id?: string | null
          responsible_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      service_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          service_type_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          service_type_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          service_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          responsible_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          responsible_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          task_id: string
          title: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          responsible_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          archive_after_days: number
          created_at: string
          currency: string
          date_format: string
          default_checklist_rules: Json
          default_contract_rules: Json
          default_recurrence_rules: Json
          default_task_priority: string
          default_task_status: string
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          archive_after_days?: number
          created_at?: string
          currency?: string
          date_format?: string
          default_checklist_rules?: Json
          default_contract_rules?: Json
          default_recurrence_rules?: Json
          default_task_priority?: string
          default_task_status?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          archive_after_days?: number
          created_at?: string
          currency?: string
          date_format?: string
          default_checklist_rules?: Json
          default_contract_rules?: Json
          default_recurrence_rules?: Json
          default_task_priority?: string
          default_task_status?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          module: string | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          module?: string | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          module?: string | null
          name?: string
        }
        Relationships: []
      }
      task_checklist_items: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          sort_order: number
          task_id: string
          text: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          task_id: string
          text: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          task_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          id: string
          project_id: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          id?: string
          project_id?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          id?: string
          project_id?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          task_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          task_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_minutes: number | null
          client_id: string
          contract_id: string | null
          created_at: string
          delivery_model_item_id: string | null
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          generation_period: string | null
          id: string
          is_recurring: boolean
          last_generated_at: string | null
          parent_task_id: string | null
          plan_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          recurrence_config: Json | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          responsible_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          client_id: string
          contract_id?: string | null
          created_at?: string
          delivery_model_item_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          generation_period?: string | null
          id?: string
          is_recurring?: boolean
          last_generated_at?: string | null
          parent_task_id?: string | null
          plan_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          recurrence_config?: Json | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          responsible_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          client_id?: string
          contract_id?: string | null
          created_at?: string
          delivery_model_item_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          generation_period?: string | null
          id?: string
          is_recurring?: boolean
          last_generated_at?: string | null
          parent_task_id?: string | null
          plan_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          recurrence_config?: Json | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          responsible_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_delivery_model_item_id_fkey"
            columns: ["delivery_model_item_id"]
            isOneToOne: false
            referencedRelation: "delivery_model_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_permissions: { Args: { _user_id: string }; Returns: Json }
      has_any_admin: { Args: never; Returns: boolean }
      has_permission: {
        Args: { _perm_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _detail?: string
          _entity_id?: string
          _entity_type: string
          _new_data?: Json
          _old_data?: Json
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "diretor"
        | "financeiro"
        | "gestor"
        | "social_media"
        | "designer"
        | "trafego"
        | "atendimento"
        | "assistente"
        | "parceiro"
        | "cliente_convidado"
      checklist_frequency: "semanal" | "quinzenal" | "mensal" | "personalizada"
      contract_status: "ativo" | "pausado" | "cancelado" | "encerrado"
      delivery_item_status:
        | "entregue"
        | "entregue_parcialmente"
        | "nao_entregue"
        | "nao_aplicavel"
      expense_recurrence: "recorrente" | "unica" | "parcelada"
      financial_entry_status: "pendente" | "pago" | "atrasado" | "cancelado"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status:
        | "pendente"
        | "em_andamento"
        | "pausado"
        | "concluido"
        | "arquivado"
      task_type:
        | "conteudo"
        | "trafego"
        | "reuniao"
        | "relatorio"
        | "design"
        | "desenvolvimento"
        | "outro"
      user_status: "ativo" | "inativo" | "bloqueado" | "pendente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "diretor",
        "financeiro",
        "gestor",
        "social_media",
        "designer",
        "trafego",
        "atendimento",
        "assistente",
        "parceiro",
        "cliente_convidado",
      ],
      checklist_frequency: ["semanal", "quinzenal", "mensal", "personalizada"],
      contract_status: ["ativo", "pausado", "cancelado", "encerrado"],
      delivery_item_status: [
        "entregue",
        "entregue_parcialmente",
        "nao_entregue",
        "nao_aplicavel",
      ],
      expense_recurrence: ["recorrente", "unica", "parcelada"],
      financial_entry_status: ["pendente", "pago", "atrasado", "cancelado"],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: [
        "pendente",
        "em_andamento",
        "pausado",
        "concluido",
        "arquivado",
      ],
      task_type: [
        "conteudo",
        "trafego",
        "reuniao",
        "relatorio",
        "design",
        "desenvolvimento",
        "outro",
      ],
      user_status: ["ativo", "inativo", "bloqueado", "pendente"],
    },
  },
} as const
