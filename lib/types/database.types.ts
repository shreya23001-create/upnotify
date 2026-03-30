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
          created_at: string
          id: string
          name: string
          slug: string
          stripe_connect_account_id: string | null
          stripe_customer_id: string | null
          timezone: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          timezone?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
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
          monitor_limit: number | null
          name: string
          onboarding_fee_gbp: number
          price_annual_gbp: number | null
          price_monthly_gbp: number
          slug: string
          stripe_price_id_annual: string | null
          stripe_price_id_monthly: string | null
          type: string
          updated_at: string
          voice_call_monthly_limit: number
        }
        Insert: {
          check_interval_seconds?: number
          client_workspace_limit?: number | null
          created_at?: string
          data_retention_days?: number | null
          has_ai_predictive?: boolean
          has_api_access?: boolean
          has_status_page_custom_domain?: boolean
          has_voice_calls?: boolean
          has_white_label?: boolean
          id?: string
          is_visible?: boolean
          monitor_limit?: number | null
          name: string
          onboarding_fee_gbp?: number
          price_annual_gbp?: number | null
          price_monthly_gbp?: number
          slug: string
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          type: string
          updated_at?: string
          voice_call_monthly_limit?: number
        }
        Update: {
          check_interval_seconds?: number
          client_workspace_limit?: number | null
          created_at?: string
          data_retention_days?: number | null
          has_ai_predictive?: boolean
          has_api_access?: boolean
          has_status_page_custom_domain?: boolean
          has_voice_calls?: boolean
          has_white_label?: boolean
          id?: string
          is_visible?: boolean
          monitor_limit?: number | null
          name?: string
          onboarding_fee_gbp?: number
          price_annual_gbp?: number | null
          price_monthly_gbp?: number
          slug?: string
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          type?: string
          updated_at?: string
          voice_call_monthly_limit?: number
        }
        Relationships: []
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          is_super_admin: boolean
          org_id: string
          role: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          org_id: string
          role?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          org_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_super_admin: { Args: never; Returns: boolean }
      user_org_id: { Args: never; Returns: string }
      user_role: { Args: never; Returns: string }
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
