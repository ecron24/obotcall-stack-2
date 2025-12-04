import { createClient } from '@/lib/supabase/client'

// API Client uses same domain - requests go through Next.js API routes which proxy to Hono backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Type definitions for API responses
interface LoginResponse {
  access_token: string
  user: {
    id: string
    email: string
    full_name: string
    role: string
  }
  tenant: {
    id: string
    slug: string
    name: string
    subscription_plan: string
  }
}

interface RegisterResponse extends LoginResponse {}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * Get the current access token from Supabase Auth
   * This ensures we always use the latest token (including refreshed ones)
   */
  private async getToken(): Promise<string | null> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Une erreur est survenue' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth
  async register(data: any): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: any): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Interventions
  async getInterventions(page = 1, per_page = 20) {
    return this.request(`/api/interventions?page=${page}&per_page=${per_page}`)
  }

  async getIntervention(id: string) {
    return this.request(`/api/interventions/${id}`)
  }

  async createIntervention(data: any) {
    return this.request('/api/interventions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateIntervention(id: string, data: any) {
    return this.request(`/api/interventions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteIntervention(id: string) {
    return this.request(`/api/interventions/${id}`, {
      method: 'DELETE',
    })
  }

  // Clients
  async getClients(page = 1, per_page = 20) {
    return this.request(`/api/clients?page=${page}&per_page=${per_page}`)
  }

  async getClient(id: string) {
    return this.request(`/api/clients/${id}`)
  }

  async createClient(data: any) {
    return this.request('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateClient(id: string, data: any) {
    return this.request(`/api/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteClient(id: string) {
    return this.request(`/api/clients/${id}`, {
      method: 'DELETE',
    })
  }

  // Devis
  async getDevis(page = 1, per_page = 20) {
    return this.request(`/api/devis?page=${page}&per_page=${per_page}`)
  }

  async createDevis(data: any) {
    return this.request('/api/devis', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Factures
  async getFactures(page = 1, per_page = 20) {
    return this.request(`/api/factures?page=${page}&per_page=${per_page}`)
  }

  async createFacture(data: any) {
    return this.request('/api/factures', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Tenant
  async getTenant() {
    return this.request('/api/tenants/me')
  }

  async getSubscription() {
    return this.request('/api/tenants/me/subscription')
  }

  async getStats() {
    return this.request('/api/tenants/me/stats')
  }
}

export const apiClient = new ApiClient(API_URL)
