export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          business_number: string | null
          industry: string | null
          employee_count: number | null
          founded_date: string | null
          location: string | null
          certifications: string[] | null
          annual_revenue: number | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          business_number?: string | null
          industry?: string | null
          employee_count?: number | null
          founded_date?: string | null
          location?: string | null
          certifications?: string[] | null
          annual_revenue?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          business_number?: string | null
          industry?: string | null
          employee_count?: number | null
          founded_date?: string | null
          location?: string | null
          certifications?: string[] | null
          annual_revenue?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          source: string
          source_id: string
          title: string
          organization: string | null
          category: string | null
          support_type: string | null
          target_company: string | null
          support_amount: string | null
          application_start: string | null
          application_end: string | null
          content: string | null
          attachment_urls: string[] | null
          parsed_content: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source: string
          source_id: string
          title: string
          organization?: string | null
          category?: string | null
          support_type?: string | null
          target_company?: string | null
          support_amount?: string | null
          application_start?: string | null
          application_end?: string | null
          content?: string | null
          attachment_urls?: string[] | null
          parsed_content?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source?: string
          source_id?: string
          title?: string
          organization?: string | null
          category?: string | null
          support_type?: string | null
          target_company?: string | null
          support_amount?: string | null
          application_start?: string | null
          application_end?: string | null
          content?: string | null
          attachment_urls?: string[] | null
          parsed_content?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      business_plans: {
        Row: {
          id: string
          company_id: string
          title: string
          content: string | null
          file_url: string | null
          parsed_content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          content?: string | null
          file_url?: string | null
          parsed_content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          content?: string | null
          file_url?: string | null
          parsed_content?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          company_id: string
          announcement_id: string
          business_plan_id: string | null
          match_score: number
          analysis: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          announcement_id: string
          business_plan_id?: string | null
          match_score: number
          analysis?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          announcement_id?: string
          business_plan_id?: string | null
          match_score?: number
          analysis?: Json | null
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          match_id: string
          user_id: string
          content: string | null
          hwp_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          content?: string | null
          hwp_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          content?: string | null
          hwp_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          payment_method: string
          payment_key: string | null
          order_id: string
          status: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          payment_method: string
          payment_key?: string | null
          order_id: string
          status?: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          payment_method?: string
          payment_key?: string | null
          order_id?: string
          status?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          billing_key: string | null
          status: string
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          billing_key?: string | null
          status?: string
          current_period_start: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          billing_key?: string | null
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          name: string | null
          status: string | null
          preferences: Json | null
          source: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          confirmed: boolean | null
          confirm_token: string | null
          confirm_sent_at: string | null
          confirmed_at: string | null
          unsubscribe_token: string
          unsubscribed_at: string | null
          unsubscribe_reason: string | null
          emails_sent: number | null
          emails_opened: number | null
          emails_clicked: number | null
          last_email_at: string | null
          last_opened_at: string | null
          last_clicked_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          status?: string | null
          preferences?: Json | null
          source?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          confirmed?: boolean | null
          confirm_token?: string | null
          confirm_sent_at?: string | null
          confirmed_at?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          unsubscribe_reason?: string | null
          emails_sent?: number | null
          emails_opened?: number | null
          emails_clicked?: number | null
          last_email_at?: string | null
          last_opened_at?: string | null
          last_clicked_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          status?: string | null
          preferences?: Json | null
          source?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          confirmed?: boolean | null
          confirm_token?: string | null
          confirm_sent_at?: string | null
          confirmed_at?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          unsubscribe_reason?: string | null
          emails_sent?: number | null
          emails_opened?: number | null
          emails_clicked?: number | null
          last_email_at?: string | null
          last_opened_at?: string | null
          last_clicked_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
