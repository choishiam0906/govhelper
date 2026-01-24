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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcement_embeddings: {
        Row: {
          announcement_id: string
          content_hash: string | null
          created_at: string | null
          embedding: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          announcement_id: string
          content_hash?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          announcement_id?: string
          content_hash?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_embeddings_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: true
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          application_end: string | null
          application_start: string | null
          attachment_urls: string[] | null
          category: string | null
          content: string | null
          created_at: string | null
          eligibility_criteria: Json | null
          embedding: string | null
          id: string
          organization: string | null
          parsed_content: string | null
          source: string
          source_id: string
          status: string | null
          support_amount: string | null
          support_type: string | null
          target_company: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          application_end?: string | null
          application_start?: string | null
          attachment_urls?: string[] | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          eligibility_criteria?: Json | null
          embedding?: string | null
          id?: string
          organization?: string | null
          parsed_content?: string | null
          source: string
          source_id: string
          status?: string | null
          support_amount?: string | null
          support_type?: string | null
          target_company?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          application_end?: string | null
          application_start?: string | null
          attachment_urls?: string[] | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          eligibility_criteria?: Json | null
          embedding?: string | null
          id?: string
          organization?: string | null
          parsed_content?: string | null
          source?: string
          source_id?: string
          status?: string | null
          support_amount?: string | null
          support_type?: string | null
          target_company?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          content: string | null
          created_at: string | null
          hwp_url: string | null
          id: string
          match_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          hwp_url?: string | null
          id?: string
          match_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          hwp_url?: string | null
          id?: string
          match_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      business_plans: {
        Row: {
          company_id: string
          content: string | null
          created_at: string | null
          embedding: string | null
          file_url: string | null
          id: string
          parsed_content: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          file_url?: string | null
          id?: string
          parsed_content?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          file_url?: string | null
          id?: string
          parsed_content?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          annual_revenue: number | null
          approval_status: string | null
          business_number: string | null
          business_plan_url: string | null
          certifications: string[] | null
          created_at: string | null
          description: string | null
          employee_count: number | null
          founded_date: string | null
          id: string
          industry: string | null
          is_registered_business: boolean | null
          location: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_revenue?: number | null
          approval_status?: string | null
          business_number?: string | null
          business_plan_url?: string | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          employee_count?: number | null
          founded_date?: string | null
          id?: string
          industry?: string | null
          is_registered_business?: boolean | null
          location?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_revenue?: number | null
          approval_status?: string | null
          business_number?: string | null
          business_plan_url?: string | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          employee_count?: number | null
          founded_date?: string | null
          id?: string
          industry?: string | null
          is_registered_business?: boolean | null
          location?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_certifications: {
        Row: {
          business_number: string
          cert_name: string
          cert_number: string | null
          cert_type: string
          company_name: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          is_valid: boolean | null
          issued_date: string | null
          issuing_org: string | null
          updated_at: string | null
        }
        Insert: {
          business_number: string
          cert_name: string
          cert_number?: string | null
          cert_type: string
          company_name?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_valid?: boolean | null
          issued_date?: string | null
          issuing_org?: string | null
          updated_at?: string | null
        }
        Update: {
          business_number?: string
          cert_name?: string
          cert_number?: string | null
          cert_type?: string
          company_name?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_valid?: boolean | null
          issued_date?: string | null
          issuing_org?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dart_companies: {
        Row: {
          accounting_month: string | null
          address: string | null
          business_number: string | null
          ceo_name: string | null
          corp_cls: string | null
          corp_code: string
          corp_name: string
          corp_name_eng: string | null
          corp_reg_number: string | null
          created_at: string | null
          data_updated_at: string | null
          established_date: string | null
          fax: string | null
          homepage: string | null
          id: string
          industry_code: string | null
          phone: string | null
          stock_code: string | null
          stock_name: string | null
          updated_at: string | null
        }
        Insert: {
          accounting_month?: string | null
          address?: string | null
          business_number?: string | null
          ceo_name?: string | null
          corp_cls?: string | null
          corp_code: string
          corp_name: string
          corp_name_eng?: string | null
          corp_reg_number?: string | null
          created_at?: string | null
          data_updated_at?: string | null
          established_date?: string | null
          fax?: string | null
          homepage?: string | null
          id?: string
          industry_code?: string | null
          phone?: string | null
          stock_code?: string | null
          stock_name?: string | null
          updated_at?: string | null
        }
        Update: {
          accounting_month?: string | null
          address?: string | null
          business_number?: string | null
          ceo_name?: string | null
          corp_cls?: string | null
          corp_code?: string
          corp_name?: string
          corp_name_eng?: string | null
          corp_reg_number?: string | null
          created_at?: string | null
          data_updated_at?: string | null
          established_date?: string | null
          fax?: string | null
          homepage?: string | null
          id?: string
          industry_code?: string | null
          phone?: string | null
          stock_code?: string | null
          stock_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employment_insurance: {
        Row: {
          address: string | null
          business_number: string
          business_type: string | null
          company_name: string | null
          created_at: string | null
          id: string
          join_date: string | null
          status: string | null
          total_insured: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_number: string
          business_type?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          join_date?: string | null
          status?: string | null
          total_insured?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_number?: string
          business_type?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          join_date?: string | null
          status?: string | null
          total_insured?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string
          page_url: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          subject: string | null
          type: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
          page_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject?: string | null
          type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
          page_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject?: string | null
          type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      guest_leads: {
        Row: {
          annual_revenue: number | null
          business_number: string | null
          certifications: string[] | null
          company_name: string | null
          converted_at: string | null
          converted_to_user: boolean | null
          created_at: string | null
          description: string | null
          email: string
          employee_count: number | null
          founded_date: string | null
          id: string
          industry: string | null
          ip_address: string | null
          location: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          annual_revenue?: number | null
          business_number?: string | null
          certifications?: string[] | null
          company_name?: string | null
          converted_at?: string | null
          converted_to_user?: boolean | null
          created_at?: string | null
          description?: string | null
          email: string
          employee_count?: number | null
          founded_date?: string | null
          id?: string
          industry?: string | null
          ip_address?: string | null
          location?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          annual_revenue?: number | null
          business_number?: string | null
          certifications?: string[] | null
          company_name?: string | null
          converted_at?: string | null
          converted_to_user?: boolean | null
          created_at?: string | null
          description?: string | null
          email?: string
          employee_count?: number | null
          founded_date?: string | null
          id?: string
          industry?: string | null
          ip_address?: string | null
          location?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      guest_matches: {
        Row: {
          created_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          lead_id: string
          matches: Json
          payment_id: string | null
          revealed_at: string | null
          top_revealed: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          lead_id: string
          matches?: Json
          payment_id?: string | null
          revealed_at?: string | null
          top_revealed?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          lead_id?: string
          matches?: Json
          payment_id?: string | null
          revealed_at?: string | null
          top_revealed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_matches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "guest_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          analysis: Json | null
          announcement_id: string
          business_plan_id: string | null
          company_id: string
          created_at: string | null
          id: string
          match_score: number
        }
        Insert: {
          analysis?: Json | null
          announcement_id: string
          business_plan_id?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          match_score: number
        }
        Update: {
          analysis?: Json | null
          announcement_id?: string
          business_plan_id?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          match_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_business_plan_id_fkey"
            columns: ["business_plan_id"]
            isOneToOne: false
            referencedRelation: "business_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_business_registry: {
        Row: {
          business_number: string
          company_name: string
          created_at: string | null
          data_year_month: string | null
          id: string
          jibun_address: string | null
          lost_subscribers: number | null
          monthly_payment: number | null
          new_subscribers: number | null
          postal_code: string | null
          road_address: string | null
          subscriber_count: number | null
          updated_at: string | null
        }
        Insert: {
          business_number: string
          company_name: string
          created_at?: string | null
          data_year_month?: string | null
          id?: string
          jibun_address?: string | null
          lost_subscribers?: number | null
          monthly_payment?: number | null
          new_subscribers?: number | null
          postal_code?: string | null
          road_address?: string | null
          subscriber_count?: number | null
          updated_at?: string | null
        }
        Update: {
          business_number?: string
          company_name?: string
          created_at?: string | null
          data_year_month?: string | null
          id?: string
          jibun_address?: string | null
          lost_subscribers?: number | null
          monthly_payment?: number | null
          new_subscribers?: number | null
          postal_code?: string | null
          road_address?: string | null
          subscriber_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          order_id: string
          payment_key: string | null
          payment_method: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          payment_key?: string | null
          payment_method: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          payment_key?: string | null
          payment_method?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      public_statistics: {
        Row: {
          active_announcements: number | null
          avg_match_score: number | null
          avg_support_amount: number | null
          guest_conversion_rate: number | null
          high_score_matches: number | null
          id: string
          success_rate: number | null
          total_announcements: number | null
          total_companies: number | null
          total_guest_matches: number | null
          total_matches: number | null
          total_support_amount: number | null
          total_users: number | null
          updated_at: string | null
        }
        Insert: {
          active_announcements?: number | null
          avg_match_score?: number | null
          avg_support_amount?: number | null
          guest_conversion_rate?: number | null
          high_score_matches?: number | null
          id?: string
          success_rate?: number | null
          total_announcements?: number | null
          total_companies?: number | null
          total_guest_matches?: number | null
          total_matches?: number | null
          total_support_amount?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Update: {
          active_announcements?: number | null
          avg_match_score?: number | null
          avg_support_amount?: number | null
          guest_conversion_rate?: number | null
          high_score_matches?: number | null
          id?: string
          success_rate?: number | null
          total_announcements?: number | null
          total_companies?: number | null
          total_guest_matches?: number | null
          total_matches?: number | null
          total_support_amount?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_announcements: {
        Row: {
          announcement_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_announcements_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_key: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_key?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_key?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          browser: string | null
          created_at: string | null
          device_type: string | null
          first_match_at: string | null
          first_payment_at: string | null
          id: string
          ip_address: string | null
          landing_page: string | null
          onboarding_completed: boolean | null
          os: string | null
          referrer: string | null
          signup_completed: boolean | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          first_match_at?: string | null
          first_payment_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          onboarding_completed?: boolean | null
          os?: string | null
          referrer?: string | null
          signup_completed?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          first_match_at?: string | null
          first_payment_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          onboarding_completed?: boolean | null
          os?: string | null
          referrer?: string | null
          signup_completed?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      guest_utm_statistics: {
        Row: {
          conversion_rate: number | null
          converted_users: number | null
          date: string | null
          total_leads: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      utm_statistics: {
        Row: {
          completed_onboarding: number | null
          conversion_rate: number | null
          converted_paid: number | null
          date: string | null
          total_signups: number | null
          used_matching: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      match_announcements: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          id: string
          organization: string
          similarity: number
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_public_statistics: { Args: never; Returns: undefined }
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
