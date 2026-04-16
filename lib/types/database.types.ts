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
      admin_permissions: {
        Row: {
          can_read: boolean
          can_write: boolean
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          id: string
          email: string
          role: string
          display_name: string | null
          permissions: Json
          is_active: boolean
          added_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: string
          display_name?: string | null
          permissions?: Json
          is_active?: boolean
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          display_name?: string | null
          permissions?: Json
          is_active?: boolean
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agency_tags: {
        Row: {
          created_at: string
          custom_script: string | null
          ga4_id: string | null
          gtm_id: string | null
          id: string
          org_id: string
          pixel_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_script?: string | null
          ga4_id?: string | null
          gtm_id?: string | null
          id?: string
          org_id: string
          pixel_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_script?: string | null
          ga4_id?: string | null
          gtm_id?: string | null
          id?: string
          org_id?: string
          pixel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_tags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_channels: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          name: string
          org_id: string
          severity_filter: string[]
          type: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          name: string
          org_id: string
          severity_filter?: string[]
          type: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          name?: string
          org_id?: string
          severity_filter?: string[]
          type?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_channels_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          channel_id: string
          created_at: string
          error_message: string | null
          id: string
          incident_id: string
          org_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          incident_id: string
          org_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          incident_id?: string
          org_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "alert_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_revoked: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          org_id: string
          scopes: string[]
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          org_id: string
          scopes?: string[]
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          org_id?: string
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          org_id: string
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          org_id: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          org_id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: Json
          created_at: string
          excerpt: string | null
          id: string
          og_image_url: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          source_public_incident_id: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: Json
          created_at?: string
          excerpt?: string | null
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          source_public_incident_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: Json
          created_at?: string
          excerpt?: string | null
          id?: string
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          source_public_incident_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      check_results: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          metadata: Json
          monitor_id: string
          org_id: string
          region: string | null
          response_time_ms: number | null
          status: string
          status_code: number | null
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          monitor_id: string
          org_id: string
          region?: string | null
          response_time_ms?: number | null
          status: string
          status_code?: number | null
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          monitor_id?: string
          org_id?: string
          region?: string | null
          response_time_ms?: number | null
          status?: string
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "check_results_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "monitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_results_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_preferences: {
        Row: {
          created_at: string
          email_billing: boolean
          email_incident_digest: boolean
          email_product_updates: boolean
          id: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_billing?: boolean
          email_incident_digest?: boolean
          email_product_updates?: boolean
          id?: string
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_billing?: boolean
          email_incident_digest?: boolean
          email_product_updates?: boolean
          id?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_preferences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flag_usage: {
        Row: {
          evaluated_at: string
          flag_id: string
          id: string
          org_id: string
          result: boolean
        }
        Insert: {
          evaluated_at?: string
          flag_id: string
          id?: string
          org_id: string
          result: boolean
        }
        Update: {
          evaluated_at?: string
          flag_id?: string
          id?: string
          org_id?: string
          result?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_usage_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          key: string
          rollout_percentage: number
          target_org_ids: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          rollout_percentage?: number
          target_org_ids?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          rollout_percentage?: number
          target_org_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          monitor_id: string
          org_id: string
          resolved_at: string | null
          root_cause: string | null
          severity: string
          started_at: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          monitor_id: string
          org_id: string
          resolved_at?: string | null
          root_cause?: string | null
          severity: string
          started_at?: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          monitor_id?: string
          org_id?: string
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "monitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_gbp: number
          currency: string
          created_at: string
          id: string
          invoice_pdf_url: string | null
          org_id: string
          period_end: string | null
          period_start: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount_gbp: number
          currency?: string
          created_at?: string
          id?: string
          invoice_pdf_url?: string | null
          org_id: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount_gbp?: number
          currency?: string
          created_at?: string
          id?: string
          invoice_pdf_url?: string | null
          org_id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_windows: {
        Row: {
          affected_monitor_ids: string[]
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          org_id: string
          starts_at: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          affected_monitor_ids?: string[]
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          org_id: string
          starts_at: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          affected_monitor_ids?: string[]
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          starts_at?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_windows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_windows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      monitors: {
        Row: {
          check_interval_seconds: number
          config: Json
          created_at: string
          flap_count: number
          id: string
          is_paused: boolean
          last_checked_at: string | null
          name: string
          next_check_at: string | null
          org_id: string
          severity: string
          status: string
          target: string
          timeout_ms: number
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          check_interval_seconds?: number
          config?: Json
          created_at?: string
          flap_count?: number
          id?: string
          is_paused?: boolean
          last_checked_at?: string | null
          name: string
          next_check_at?: string | null
          org_id: string
          severity?: string
          status?: string
          target: string
          timeout_ms?: number
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          check_interval_seconds?: number
          config?: Json
          created_at?: string
          flap_count?: number
          id?: string
          is_paused?: boolean
          last_checked_at?: string | null
          name?: string
          next_check_at?: string | null
          org_id?: string
          severity?: string
          status?: string
          target?: string
          timeout_ms?: number
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          billing_email: string | null
          company_address_line1: string | null
          company_address_line2: string | null
          company_city: string | null
          company_country: string | null
          company_name: string | null
          company_postcode: string | null
          company_registration_number: string | null
          company_vat_number: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          stripe_connect_account_id: string | null
          stripe_customer_id: string | null
          razorpay_customer_id: string | null
          timezone: string
          type: string
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          company_address_line1?: string | null
          company_address_line2?: string | null
          company_city?: string | null
          company_country?: string | null
          company_name?: string | null
          company_postcode?: string | null
          company_registration_number?: string | null
          company_vat_number?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          razorpay_customer_id?: string | null
          timezone?: string
          type?: string
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          company_address_line1?: string | null
          company_address_line2?: string | null
          company_city?: string | null
          company_country?: string | null
          company_name?: string | null
          company_postcode?: string | null
          company_registration_number?: string | null
          company_vat_number?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          razorpay_customer_id?: string | null
          timezone?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          content: Json
          id: string
          is_visible: boolean
          page: string
          section_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          is_visible?: boolean
          page: string
          section_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          is_visible?: boolean
          page?: string
          section_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          check_interval_seconds: number
          client_workspace_limit: number | null
          created_at: string
          data_retention_days: number | null
          has_ai_predictive: boolean
          has_api_access: boolean
          has_status_page_custom_domain: boolean
          has_voice_calls: boolean
          has_white_label: boolean
          id: string
          is_visible: boolean
          max_team_members: number
          monitor_limit: number | null
          name: string
          onboarding_fee_gbp: number
          price_annual_gbp: number | null
          price_annual_inr: number | null
          price_annual_usd: number | null
          price_monthly_gbp: number
          price_monthly_inr: number
          price_monthly_usd: number
          slug: string
          stripe_price_id_annual: string | null
          stripe_price_id_monthly: string | null
          razorpay_monthly_plan_id: string | null
          razorpay_annual_plan_id: string | null
          type: string
          updated_at: string
          voice_call_monthly_limit: number
          has_email_alerts: boolean
          has_slack_teams: boolean
          has_webhooks: boolean
          has_status_pages: boolean
          status_page_limit: number
          ai_report_limit: number
          competitor_limit: number
          llms_txt_limit: number
          citation_check_monthly_limit: number
        }
        Insert: {
          check_interval_seconds?: number
          client_workspace_limit?: number | null
          created_at?: string
          data_retention_days?: number | null
          has_ai_predictive?: boolean
          has_api_access?: boolean
          has_email_alerts?: boolean
          has_slack_teams?: boolean
          has_webhooks?: boolean
          has_status_pages?: boolean
          has_status_page_custom_domain?: boolean
          has_voice_calls?: boolean
          has_white_label?: boolean
          status_page_limit?: number
          ai_report_limit?: number
          id?: string
          is_visible?: boolean
          max_team_members?: number
          monitor_limit?: number | null
          name: string
          onboarding_fee_gbp?: number
          price_annual_gbp?: number | null
          price_annual_inr?: number | null
          price_annual_usd?: number | null
          price_monthly_gbp?: number
          price_monthly_inr?: number
          price_monthly_usd?: number
          slug: string
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          razorpay_monthly_plan_id?: string | null
          razorpay_annual_plan_id?: string | null
          type: string
          updated_at?: string
          voice_call_monthly_limit?: number
          competitor_limit?: number
          llms_txt_limit?: number
          citation_check_monthly_limit?: number
        }
        Update: {
          check_interval_seconds?: number
          client_workspace_limit?: number | null
          created_at?: string
          data_retention_days?: number | null
          has_ai_predictive?: boolean
          has_api_access?: boolean
          has_email_alerts?: boolean
          has_slack_teams?: boolean
          has_webhooks?: boolean
          has_status_pages?: boolean
          has_status_page_custom_domain?: boolean
          has_voice_calls?: boolean
          has_white_label?: boolean
          status_page_limit?: number
          ai_report_limit?: number
          competitor_limit?: number
          id?: string
          is_visible?: boolean
          max_team_members?: number
          monitor_limit?: number | null
          name?: string
          onboarding_fee_gbp?: number
          price_annual_gbp?: number | null
          price_annual_inr?: number | null
          price_annual_usd?: number | null
          price_monthly_gbp?: number
          price_monthly_inr?: number
          price_monthly_usd?: number
          slug?: string
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          razorpay_monthly_plan_id?: string | null
          razorpay_annual_plan_id?: string | null
          type?: string
          updated_at?: string
          voice_call_monthly_limit?: number
          llms_txt_limit?: number
          citation_check_monthly_limit?: number
        }
        Relationships: []
      }
      credit_rules: {
        Row: {
          id: string
          rule_key: string
          display_name: string
          credit_amount_pence: number
          credit_type: string
          max_per_user: number
          max_credit_per_month_pence: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rule_key: string
          display_name: string
          credit_amount_pence: number
          credit_type: string
          max_per_user: number
          max_credit_per_month_pence?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rule_key?: string
          display_name?: string
          credit_amount_pence?: number
          credit_type?: string
          max_per_user?: number
          max_credit_per_month_pence?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          org_id: string
          rule_key: string
          amount_pence: number
          earned_at: string
          expires_at: string | null
          applied: boolean
          applied_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          org_id: string
          rule_key: string
          amount_pence: number
          earned_at?: string
          expires_at?: string | null
          applied?: boolean
          applied_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string
          rule_key?: string
          amount_pence?: number
          earned_at?: string
          expires_at?: string | null
          applied?: boolean
          applied_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referrer_org_id: string
          referred_id: string | null
          referred_org_id: string | null
          referral_code: string
          status: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referrer_org_id: string
          referred_id?: string | null
          referred_org_id?: string | null
          referral_code: string
          status?: string
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referrer_org_id?: string
          referred_id?: string | null
          referred_org_id?: string | null
          referral_code?: string
          status?: string
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_suggestions: {
        Row: { id: string; keyword: string; category: string; type: string; url_pattern: string | null; description: string | null; is_active: boolean; display_order: number; created_at: string; updated_at: string }
        Insert: { id?: string; keyword: string; category: string; type?: string; url_pattern?: string | null; description?: string | null; is_active?: boolean; display_order?: number; created_at?: string; updated_at?: string }
        Update: { id?: string; keyword?: string; category?: string; type?: string; url_pattern?: string | null; description?: string | null; is_active?: boolean; display_order?: number; created_at?: string; updated_at?: string }
        Relationships: []
      }
      competitor_monitors: {
        Row: {
          id: string
          org_id: string
          domain: string
          display_name: string
          last_status: string | null
          last_response_time_ms: number | null
          last_checked_at: string | null
          uptime_30d: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          domain: string
          display_name: string
          last_status?: string | null
          last_response_time_ms?: number | null
          last_checked_at?: string | null
          uptime_30d?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          domain?: string
          display_name?: string
          last_status?: string | null
          last_response_time_ms?: number | null
          last_checked_at?: string | null
          uptime_30d?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_monitors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_summary: string | null
          created_at: string
          data: Json
          generated_at: string
          id: string
          org_id: string
          period_end: string
          period_start: string
          type: string
          workspace_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          data?: Json
          generated_at?: string
          id?: string
          org_id: string
          period_end: string
          period_start: string
          type?: string
          workspace_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          data?: Json
          generated_at?: string
          id?: string
          org_id?: string
          period_end?: string
          period_start?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      status_page_subscribers: {
        Row: {
          confirmation_token: string | null
          confirmed: boolean
          created_at: string
          email: string
          id: string
          status_page_id: string
          unsubscribe_token: string
        }
        Insert: {
          confirmation_token?: string | null
          confirmed?: boolean
          created_at?: string
          email: string
          id?: string
          status_page_id: string
          unsubscribe_token?: string
        }
        Update: {
          confirmation_token?: string | null
          confirmed?: boolean
          created_at?: string
          email?: string
          id?: string
          status_page_id?: string
          unsubscribe_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_page_subscribers_status_page_id_fkey"
            columns: ["status_page_id"]
            isOneToOne: false
            referencedRelation: "status_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      status_pages: {
        Row: {
          branding: Json
          created_at: string
          custom_domain: string | null
          custom_domain_verified: boolean
          dns_verification_token: string | null
          id: string
          is_published: boolean
          monitor_ids: string[]
          name: string
          org_id: string
          slug: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          custom_domain?: string | null
          custom_domain_verified?: boolean
          dns_verification_token?: string | null
          id?: string
          is_published?: boolean
          monitor_ids?: string[]
          name: string
          org_id: string
          slug: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          branding?: Json
          created_at?: string
          custom_domain?: string | null
          custom_domain_verified?: boolean
          dns_verification_token?: string | null
          id?: string
          is_published?: boolean
          monitor_ids?: string[]
          name?: string
          org_id?: string
          slug?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_pages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_connect_payouts: {
        Row: {
          amount_gbp: number
          created_at: string
          id: string
          org_id: string
          payout_date: string | null
          platform_fee_gbp: number
          status: string
          stripe_payout_id: string
        }
        Insert: {
          amount_gbp: number
          created_at?: string
          id?: string
          org_id: string
          payout_date?: string | null
          platform_fee_gbp: number
          status: string
          stripe_payout_id: string
        }
        Update: {
          amount_gbp?: number
          created_at?: string
          id?: string
          org_id?: string
          payout_date?: string | null
          platform_fee_gbp?: number
          status?: string
          stripe_payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_connect_payouts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          org_id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          razorpay_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          paused_at: string | null
          pause_until: string | null
          pause_reason: string | null
        }
        Insert: {
          billing_cycle?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          org_id: string
          plan_id: string
          status?: string
          stripe_subscription_id?: string | null
          razorpay_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          paused_at?: string | null
          pause_until?: string | null
          pause_reason?: string | null
        }
        Update: {
          billing_cycle?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          org_id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          razorpay_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          paused_at?: string | null
          pause_until?: string | null
          pause_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          is_super_admin: boolean
          org_id: string
          original_org_id: string | null
          referral_code: string | null
          role: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          is_super_admin?: boolean
          org_id: string
          original_org_id?: string | null
          referral_code?: string | null
          role?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_super_admin?: boolean
          org_id?: string
          original_org_id?: string | null
          referral_code?: string | null
          role?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_call_logs: {
        Row: {
          alert_id: string
          cost_gbp: number | null
          created_at: string
          duration_seconds: number | null
          id: string
          org_id: string
          status: string
          to_number: string
          twilio_call_sid: string | null
        }
        Insert: {
          alert_id: string
          cost_gbp?: number | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          org_id: string
          status: string
          to_number: string
          twilio_call_sid?: string | null
        }
        Update: {
          alert_id?: string
          cost_gbp?: number | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          org_id?: string
          status?: string
          to_number?: string
          twilio_call_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_call_logs_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_call_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          name: string
          org_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          name: string
          org_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          name?: string
          org_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      public_monitors: {
        Row: {
          id: string
          domain: string
          display_name: string
          category: string
          check_interval_seconds: number
          is_active: boolean
          last_checked_at: string | null
          last_status: string | null
          last_response_time_ms: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          display_name: string
          category?: string
          check_interval_seconds?: number
          is_active?: boolean
          last_checked_at?: string | null
          last_status?: string | null
          last_response_time_ms?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain?: string
          display_name?: string
          category?: string
          check_interval_seconds?: number
          is_active?: boolean
          last_checked_at?: string | null
          last_status?: string | null
          last_response_time_ms?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_check_results: {
        Row: {
          id: string
          monitor_id: string
          status: string
          response_time_ms: number | null
          status_code: number | null
          error_message: string | null
          checked_at: string
        }
        Insert: {
          id?: string
          monitor_id: string
          status: string
          response_time_ms?: number | null
          status_code?: number | null
          error_message?: string | null
          checked_at?: string
        }
        Update: {
          id?: string
          monitor_id?: string
          status?: string
          response_time_ms?: number | null
          status_code?: number | null
          error_message?: string | null
          checked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_check_results_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "public_monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      public_incidents: {
        Row: {
          id: string
          monitor_id: string
          started_at: string
          resolved_at: string | null
          cause: string | null
          status_code: number | null
        }
        Insert: {
          id?: string
          monitor_id: string
          started_at?: string
          resolved_at?: string | null
          cause?: string | null
          status_code?: number | null
        }
        Update: {
          id?: string
          monitor_id?: string
          started_at?: string
          resolved_at?: string | null
          cause?: string | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_incidents_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "public_monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      public_alert_subscribers: {
        Row: {
          id: string
          monitor_id: string
          email: string
          verified: boolean
          verification_token: string
          created_at: string
        }
        Insert: {
          id?: string
          monitor_id: string
          email: string
          verified?: boolean
          verification_token?: string
          created_at?: string
        }
        Update: {
          id?: string
          monitor_id?: string
          email?: string
          verified?: boolean
          verification_token?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_alert_subscribers_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "public_monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          id: string
          user_id: string
          email_key: string
          sent_at: string
          opened_at: string | null
          clicked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email_key: string
          sent_at?: string
          opened_at?: string | null
          clicked_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email_key?: string
          sent_at?: string
          opened_at?: string | null
          clicked_at?: string | null
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          user_id: string
          product_updates: boolean
          usage_digests: boolean
          upgrade_tips: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          product_updates?: boolean
          usage_digests?: boolean
          upgrade_tips?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          product_updates?: boolean
          usage_digests?: boolean
          upgrade_tips?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          id: string
          org_id: string
          email: string
          role: string
          invited_by: string
          token: string
          status: string
          created_at: string
          expires_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          email: string
          role?: string
          invited_by: string
          token?: string
          status?: string
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          email?: string
          role?: string
          invited_by?: string
          token?: string
          status?: string
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_product_groups: {
        Row: {
          id: string
          org_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_product_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_products: {
        Row: {
          id: string
          org_id: string
          product_group_id: string | null
          name: string
          url: string
          domain: string
          is_own_product: boolean
          extraction_method: string
          css_selector: string | null
          check_interval_minutes: number
          last_price: number | null
          last_currency: string
          last_stock_status: string | null
          last_checked_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          product_group_id?: string | null
          name: string
          url: string
          domain: string
          is_own_product?: boolean
          extraction_method?: string
          css_selector?: string | null
          check_interval_minutes?: number
          last_price?: number | null
          last_currency?: string
          last_stock_status?: string | null
          last_checked_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          product_group_id?: string | null
          name?: string
          url?: string
          domain?: string
          is_own_product?: boolean
          extraction_method?: string
          css_selector?: string | null
          check_interval_minutes?: number
          last_price?: number | null
          last_currency?: string
          last_stock_status?: string | null
          last_checked_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecom_products_product_group_id_fkey"
            columns: ["product_group_id"]
            isOneToOne: false
            referencedRelation: "ecom_product_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_price_history: {
        Row: {
          id: string
          product_id: string
          org_id: string
          price: number
          currency: string
          stock_status: string | null
          extraction_method: string | null
          confidence: number | null
          raw_extracted_value: string | null
          checked_at: string
        }
        Insert: {
          id?: string
          product_id: string
          org_id: string
          price: number
          currency?: string
          stock_status?: string | null
          extraction_method?: string | null
          confidence?: number | null
          raw_extracted_value?: string | null
          checked_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          org_id?: string
          price?: number
          currency?: string
          stock_status?: string | null
          extraction_method?: string | null
          confidence?: number | null
          raw_extracted_value?: string | null
          checked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ecom_products"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_pricing_rules: {
        Row: {
          id: string
          org_id: string
          product_group_id: string | null
          rule_name: string
          rule_type: string
          condition: Json
          action_type: string
          webhook_url: string | null
          is_active: boolean
          created_at: string
          watch_product_id: string | null
          my_product_id: string | null
          trigger_type: string
          trigger_threshold_pct: number
          response_action: string
          response_adjust_pct: number
          response_adjust_direction: string
          safety_min_price_pence: number | null
          safety_max_price_pence: number | null
          safety_max_change_pct: number
          safety_max_changes_per_day: number
          auto_update_enabled: boolean
          auto_update_confirmed_at: string | null
          webhook_secret: string | null
          alert_channels: Json
          last_triggered_at: string | null
          trigger_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          product_group_id?: string | null
          rule_name: string
          rule_type: string
          condition: Json
          action_type?: string
          webhook_url?: string | null
          is_active?: boolean
          created_at?: string
          watch_product_id?: string | null
          my_product_id?: string | null
          trigger_type?: string
          trigger_threshold_pct?: number
          response_action?: string
          response_adjust_pct?: number
          response_adjust_direction?: string
          safety_min_price_pence?: number | null
          safety_max_price_pence?: number | null
          safety_max_change_pct?: number
          safety_max_changes_per_day?: number
          auto_update_enabled?: boolean
          auto_update_confirmed_at?: string | null
          webhook_secret?: string | null
          alert_channels?: Json
        }
        Update: {
          rule_name?: string
          trigger_type?: string
          trigger_threshold_pct?: number
          response_action?: string
          response_adjust_pct?: number
          response_adjust_direction?: string
          safety_min_price_pence?: number | null
          safety_max_price_pence?: number | null
          safety_max_change_pct?: number
          safety_max_changes_per_day?: number
          auto_update_enabled?: boolean
          auto_update_confirmed_at?: string | null
          webhook_url?: string | null
          webhook_secret?: string | null
          alert_channels?: Json
          is_active?: boolean
          last_triggered_at?: string | null
          trigger_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_pricing_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecom_pricing_rules_product_group_id_fkey"
            columns: ["product_group_id"]
            isOneToOne: false
            referencedRelation: "ecom_product_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rule_executions: {
        Row: {
          id: string
          org_id: string
          rule_id: string
          watch_product_id: string | null
          old_price_pence: number | null
          new_price_pence: number | null
          competitor_price_pence: number | null
          action_taken: string
          webhook_response_code: number | null
          webhook_response_body: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          rule_id: string
          watch_product_id?: string | null
          old_price_pence?: number | null
          new_price_pence?: number | null
          competitor_price_pence?: number | null
          action_taken: string
          webhook_response_code?: number | null
          webhook_response_body?: string | null
          details?: Json
        }
        Update: {}
        Relationships: []
      }
      cancellation_log: {
        Row: {
          id: string
          org_id: string
          user_id: string
          reason: string
          reason_detail: string | null
          action_taken: string
          plan_slug: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          reason: string
          reason_detail?: string | null
          action_taken: string
          plan_slug?: string | null
        }
        Update: {}
        Relationships: []
      }
      agency_waitlist: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          country: string | null
          city: string | null
          business_name: string
          website: string | null
          num_clients: number | null
          status: string
          ai_report: Json | null
          ai_score: number | null
          notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          country?: string | null
          city?: string | null
          business_name: string
          website?: string | null
          num_clients?: number | null
          status?: string
          ai_report?: Json | null
          ai_score?: number | null
          notes?: string | null
        }
        Update: {
          status?: string
          ai_report?: Json | null
          ai_score?: number | null
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          id: string
          template_key: string
          name: string
          subject: string
          body_text: string
          body_html: string | null
          is_active: boolean
          category: string
          variables: Json
          send_count: number
          last_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_key: string
          name: string
          subject: string
          body_text: string
          body_html?: string | null
          is_active?: boolean
          category?: string
          variables?: Json
          send_count?: number
          last_sent_at?: string | null
        }
        Update: {
          name?: string
          subject?: string
          body_text?: string
          body_html?: string | null
          is_active?: boolean
          category?: string
          variables?: Json
          send_count?: number
          last_sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          id: string
          org_id: string | null
          user_id: string
          title: string
          body: string
          type: string
          category: string
          is_read: boolean
          read_at: string | null
          action_url: string | null
          action_label: string | null
          created_at: string
          expires_at: string | null
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          org_id?: string | null
          user_id: string
          title: string
          body: string
          type?: string
          category?: string
          is_read?: boolean
          read_at?: string | null
          action_url?: string | null
          action_label?: string | null
          created_at?: string
          expires_at?: string | null
          metadata?: Record<string, unknown>
        }
        Update: {
          is_read?: boolean
          read_at?: string | null
        }
        Relationships: []
      }
      credit_submissions: {
        Row: {
          id: string
          org_id: string
          user_id: string
          credit_type: string
          submission_url: string | null
          evidence_text: string | null
          status: string
          review_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          credit_amount_pence: number
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          credit_type: string
          submission_url?: string | null
          evidence_text?: string | null
          status?: string
          review_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          credit_amount_pence?: number
          created_at?: string
        }
        Update: {
          status?: string
          review_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Relationships: []
      }
      compete_plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          product_limit: number
          price_monthly_pence: number
          price_yearly_pence: number | null
          has_yearly_discount: boolean
          extra_product_price_pence: number
          extra_product_bundle_sizes: number[]
          max_extra_products: number
          nudge_to_slug: string | null
          stripe_product_id: string | null
          stripe_monthly_price_id: string | null
          stripe_yearly_price_id: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          product_limit?: number
          price_monthly_pence?: number
          price_yearly_pence?: number | null
          has_yearly_discount?: boolean
          extra_product_price_pence?: number
          extra_product_bundle_sizes?: number[]
          max_extra_products?: number
          nudge_to_slug?: string | null
          stripe_product_id?: string | null
          stripe_monthly_price_id?: string | null
          stripe_yearly_price_id?: string | null
          is_active?: boolean
          sort_order?: number
        }
        Update: Partial<{
          name: string
          description: string | null
          product_limit: number
          price_monthly_pence: number
          price_yearly_pence: number | null
          has_yearly_discount: boolean
          extra_product_price_pence: number
          max_extra_products: number
          is_active: boolean
          stripe_product_id: string | null
          stripe_monthly_price_id: string | null
          stripe_yearly_price_id: string | null
        }>
        Relationships: []
      }
      compete_subscriptions: {
        Row: {
          id: string
          org_id: string
          compete_plan_id: string
          stripe_subscription_id: string | null
          status: string
          billing_cycle: string
          extra_products_purchased: number
          stripe_extra_price_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          canceled_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          compete_plan_id: string
          stripe_subscription_id?: string | null
          status?: string
          billing_cycle?: string
          extra_products_purchased?: number
          stripe_extra_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
        }
        Update: {
          status?: string
          extra_products_purchased?: number
          current_period_start?: string | null
          current_period_end?: string | null
          canceled_at?: string | null
        }
        Relationships: []
      }
      admin_broadcasts: {
        Row: {
          id: string
          title: string
          body: string
          type: string
          category: string
          audience: string
          sent_by: string
          sent_at: string
          recipient_count: number
          action_url: string | null
          action_label: string | null
        }
        Insert: {
          id?: string
          title: string
          body: string
          type?: string
          category?: string
          audience: string
          sent_by: string
          sent_at?: string
          recipient_count?: number
          action_url?: string | null
          action_label?: string | null
        }
        Update: {
          recipient_count?: number
        }
        Relationships: []
      }
      blog_approval_tokens: {
        Row: {
          id: string
          blog_post_id: string
          token: string
          action: string
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          blog_post_id: string
          token?: string
          action: string
          expires_at?: string
          used_at?: string | null
          created_at?: string
        }
        Update: {
          used_at?: string | null
        }
        Relationships: []
      }
      aoe_email_quota: {
        Row: {
          id: string
          month: string
          total_quota: number
          marketing_sent: number
          alert_sent: number
          burst_sent: number
          available_marketing: number
          reserved_alerts: number
          safety_buffer: number
          hard_reserve: number
          monitors_with_email: number
          status_page_subs: number
          status: string
          calculated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          month: string
          total_quota?: number
          marketing_sent?: number
          alert_sent?: number
          burst_sent?: number
          available_marketing?: number
          reserved_alerts?: number
          safety_buffer?: number
          hard_reserve?: number
          monitors_with_email?: number
          status_page_subs?: number
          status?: string
          calculated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          total_quota?: number
          marketing_sent?: number
          alert_sent?: number
          burst_sent?: number
          available_marketing?: number
          reserved_alerts?: number
          safety_buffer?: number
          hard_reserve?: number
          monitors_with_email?: number
          status_page_subs?: number
          status?: string
          calculated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      aoe_site_discovery: {
        Row: {
          id: string
          domain: string
          email: string | null
          email_source: string | null
          platform: string | null
          ssl_expiry_days: number | null
          status: string
          category: string | null
          check_count: number
          last_checked_at: string | null
          ready_at: string | null
          emailed_at: string | null
          skip_reason: string | null
          discovered_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          email?: string | null
          email_source?: string | null
          platform?: string | null
          ssl_expiry_days?: number | null
          status?: string
          category?: string | null
          check_count?: number
          last_checked_at?: string | null
          ready_at?: string | null
          emailed_at?: string | null
          skip_reason?: string | null
          discovered_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          email_source?: string | null
          platform?: string | null
          ssl_expiry_days?: number | null
          status?: string
          category?: string | null
          check_count?: number
          last_checked_at?: string | null
          ready_at?: string | null
          emailed_at?: string | null
          skip_reason?: string | null
          updated_at?: string
          [key: string]: unknown
        }
        Relationships: []
      }
      aoe_site_checks: {
        Row: {
          id: string
          domain: string
          check_number: number
          response_time_ms: number | null
          status_code: number | null
          is_down: boolean
          ssl_expiry_days: number | null
          error_message: string | null
          checked_at: string
        }
        Insert: {
          id?: string
          domain: string
          check_number?: number
          response_time_ms?: number | null
          status_code?: number | null
          is_down?: boolean
          ssl_expiry_days?: number | null
          error_message?: string | null
          checked_at?: string
        }
        Update: {
          response_time_ms?: number | null
          status_code?: number | null
          is_down?: boolean
          ssl_expiry_days?: number | null
          error_message?: string | null
        }
        Relationships: []
      }
      aoe_outreach_log: {
        Row: {
          id: string
          domain: string
          email_sent_to: string
          email_source: string
          campaign: string
          platform: string | null
          product: string
          sent_at: string
          resend_message_id: string | null
          month: string
          opened_at: string | null
          clicked_at: string | null
          opted_out: boolean
          opted_out_at: string | null
          converted: boolean
          converted_at: string | null
          converted_plan: string | null
          bounced: boolean
          spam_complaint: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          email_sent_to: string
          email_source: string
          campaign: string
          platform?: string | null
          product: string
          sent_at?: string
          resend_message_id?: string | null
          month: string
          opened_at?: string | null
          clicked_at?: string | null
          opted_out?: boolean
          opted_out_at?: string | null
          converted?: boolean
          converted_at?: string | null
          converted_plan?: string | null
          bounced?: boolean
          spam_complaint?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          opened_at?: string | null
          clicked_at?: string | null
          opted_out?: boolean
          opted_out_at?: string | null
          converted?: boolean
          converted_at?: string | null
          converted_plan?: string | null
          bounced?: boolean
          spam_complaint?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      aoe_settings: {
        Row: {
          id: string
          key: string
          value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          key: string
          value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      citation_check_runs: {
        Row: {
          id: string
          org_id: string
          user_id: string
          domain: string
          keywords: string[]
          engine_ids: string[]
          status: string
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          domain: string
          keywords: string[]
          engine_ids: string[]
          status?: string
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      citation_check_results: {
        Row: {
          id: string
          run_id: string
          engine_id: string
          keyword: string
          cited: boolean
          citation_url: string | null
          snippet: string | null
          checked_at: string
        }
        Insert: {
          id?: string
          run_id: string
          engine_id: string
          keyword: string
          cited: boolean
          citation_url?: string | null
          snippet?: string | null
          checked_at?: string
        }
        Update: {
          cited?: boolean
          citation_url?: string | null
          snippet?: string | null
        }
        Relationships: []
      }
      llms_txt_generations: {
        Row: {
          id: string
          org_id: string
          user_id: string
          domain: string
          engine_ids: string[]
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          domain: string
          engine_ids?: string[]
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
        Relationships: []
      }
      razorpay_annual_upgrade_log: {
        Row: {
          id: string
          org_id: string
          org_name: string
          user_email: string
          old_razorpay_subscription_id: string
          old_plan_id: string | null
          old_plan_name: string
          old_plan_slug: string
          old_plan_price_annual_inr: number
          old_subscription_started_at: string
          old_subscription_period_end: string
          new_razorpay_subscription_id: string
          new_plan_id: string | null
          new_plan_name: string
          new_plan_slug: string
          new_plan_price_annual_inr: number
          upgraded_at: string
          days_remaining: number
          credit_amount_inr: number
          refund_status: string
          refunded_at: string | null
          refunded_amount_inr: number | null
          refund_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          org_name: string
          user_email: string
          old_razorpay_subscription_id: string
          old_plan_id?: string | null
          old_plan_name: string
          old_plan_slug: string
          old_plan_price_annual_inr: number
          old_subscription_started_at: string
          old_subscription_period_end: string
          new_razorpay_subscription_id: string
          new_plan_id?: string | null
          new_plan_name: string
          new_plan_slug: string
          new_plan_price_annual_inr: number
          upgraded_at?: string
          days_remaining: number
          credit_amount_inr: number
          refund_status?: string
          refunded_at?: string | null
          refunded_amount_inr?: number | null
          refund_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          refund_status?: string
          refunded_at?: string | null
          refunded_amount_inr?: number | null
          refund_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "razorpay_annual_upgrade_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          }
        ]
      }
      paywalled_domains: {
        Row: {
          id: number
          domain: string
          auto_detected: boolean
          added_at: string
        }
        Insert: {
          id?: number
          domain: string
          auto_detected?: boolean
          added_at?: string
        }
        Update: {
          id?: number
          domain?: string
          auto_detected?: boolean
          added_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_super_admin: { Args: never; Returns: boolean }
      user_org_id: { Args: never; Returns: string }
      user_role: { Args: never; Returns: string }
      aoe_increment_marketing_sent: {
        Args: { p_month: string; p_count: number }
        Returns: undefined
      }
      aoe_increment_alert_sent: {
        Args: { p_month: string; p_count: number }
        Returns: undefined
      }
      aoe_increment_burst_sent: {
        Args: { p_month: string; p_count: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
