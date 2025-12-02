// Subscription Plans
export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// User Roles
export enum UserRole {
  OWNER = 'owner',          // Créateur du tenant
  ADMIN = 'admin',          // Administrateur
  MANAGER = 'manager',      // Manager (Pro+)
  AGENT = 'agent',          // Agent immobilier
  VIEWER = 'viewer'         // Lecture seule
}

// Database types
export interface Tenant {
  id: string
  slug: string // sous-domaine unique
  name: string // Nom commercial
  subscription_plan: SubscriptionPlan
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'trial'
  trial_ends_at: string | null
  subscription_ends_at: string | null
  app_type: string

  // White label settings
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  custom_domain: string | null

  // Metadata
  created_at: string
  updated_at: string

  // Usage tracking
  current_users_count: number
}

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null

  // Status
  is_active: boolean
  email_verified: boolean
  last_login_at: string | null

  // Metadata
  created_at: string
  updated_at: string
}

// API Request/Response types
export interface AuthContext {
  user: User
  tenant: Tenant
}

export interface ApiError {
  error: string
  message: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}
