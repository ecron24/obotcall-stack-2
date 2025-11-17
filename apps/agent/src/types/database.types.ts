export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_tenant_roles: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          role: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          role: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          role?: string
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_tenant_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
  agent_app: {
    Tables: {
      contacts: {
        Row: {
          id: string
          tenant_id: string
          contact_type: 'individual' | 'professional'
          status: 'prospect' | 'client' | 'inactive' | 'archived'
          title: string | null
          first_name: string
          last_name: string
          email: string | null
          mobile_phone: string | null
          home_phone: string | null
          work_phone: string | null
          address_line1: string | null
          address_line2: string | null
          postal_code: string | null
          city: string | null
          country: string | null
          birth_date: string | null
          birth_place: string | null
          nationality: string | null
          profession: string | null
          employer: string | null
          marital_status: string | null
          number_of_children: number | null
          is_smoker: boolean | null
          referral_source: string | null
          is_pep: boolean
          lcb_ft_verified: boolean
          lcb_ft_verification_date: string | null
          data_retention_end_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          contact_type: 'individual' | 'professional'
          status?: 'prospect' | 'client' | 'inactive' | 'archived'
          title?: string | null
          first_name: string
          last_name: string
          email?: string | null
          mobile_phone?: string | null
          home_phone?: string | null
          work_phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          postal_code?: string | null
          city?: string | null
          country?: string | null
          birth_date?: string | null
          birth_place?: string | null
          nationality?: string | null
          profession?: string | null
          employer?: string | null
          marital_status?: string | null
          number_of_children?: number | null
          is_smoker?: boolean | null
          referral_source?: string | null
          is_pep?: boolean
          lcb_ft_verified?: boolean
          lcb_ft_verification_date?: string | null
          data_retention_end_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          contact_type?: 'individual' | 'professional'
          status?: 'prospect' | 'client' | 'inactive' | 'archived'
          title?: string | null
          first_name?: string
          last_name?: string
          email?: string | null
          mobile_phone?: string | null
          home_phone?: string | null
          work_phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          postal_code?: string | null
          city?: string | null
          country?: string | null
          birth_date?: string | null
          birth_place?: string | null
          nationality?: string | null
          profession?: string | null
          employer?: string | null
          marital_status?: string | null
          number_of_children?: number | null
          is_smoker?: boolean | null
          referral_source?: string | null
          is_pep?: boolean
          lcb_ft_verified?: boolean
          lcb_ft_verification_date?: string | null
          data_retention_end_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
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

// Helper types
export type Tables<T extends keyof Database[keyof Database]['Tables']> =
  Database[keyof Database]['Tables'][T]['Row']

export type Inserts<T extends keyof Database[keyof Database]['Tables']> =
  Database[keyof Database]['Tables'][T]['Insert']

export type Updates<T extends keyof Database[keyof Database]['Tables']> =
  Database[keyof Database]['Tables'][T]['Update']

// Agent App specific types
export type Contact = Database['agent_app']['Tables']['contacts']['Row']
export type ContactInsert = Database['agent_app']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['agent_app']['Tables']['contacts']['Update']
