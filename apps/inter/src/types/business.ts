// ============================================
// Types pour le système multi-métiers
// ============================================

export interface BusinessType {
  id: string
  code: string
  name: string
  emoji: string
  color: string
  terminology: BusinessTerminology
  default_labor_rate: number
  default_travel_fee: number
  is_active: boolean
  created_at: string
}

export interface BusinessTerminology {
  intervention: string
  client: string
  technician: string
  quote: string
  invoice: string
  equipment: string
  product: string
  service: string
}

export interface InterventionType {
  id: string
  business_type_id: string
  code: string
  name: string
  description: string | null
  emoji: string | null
  color: string | null
  requires_quote: boolean
  default_duration: number | null
  default_priority: 'low' | 'medium' | 'high' | 'urgent' | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  business_type_id: string
  parent_category_id: string | null
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProductType = 'product' | 'service' | 'labor'

export interface Product {
  id: string
  business_type_id: string
  category_id: string | null
  code: string
  name: string
  description: string | null
  type: ProductType
  unit: string
  unit_price_ht: number
  tax_rate: number
  has_stock: boolean
  stock_quantity: number
  stock_alert_threshold: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  category?: ProductCategory
}

export interface InterventionItem {
  id: string
  intervention_id: string
  product_id: string | null
  description: string
  quantity: number
  unit_price_ht: number
  tax_rate: number
  total_ht: number
  total_tax: number
  total_ttc: number
  display_order: number
  created_at: string
  updated_at: string
  // Relations
  product?: Product
}

export interface InterventionTotals {
  subtotal_ht: number
  total_tax: number
  total_ttc: number
  items_count: number
}

// ============================================
// Types pour les formulaires
// ============================================

export interface CreateInterventionItemInput {
  product_id?: string
  description: string
  quantity: number
  unit_price_ht: number
  tax_rate: number
  display_order?: number
}

export interface UpdateInterventionItemInput {
  description?: string
  quantity?: number
  unit_price_ht?: number
  tax_rate?: number
  display_order?: number
}

// ============================================
// Types pour les filtres
// ============================================

export interface ProductFilters {
  type?: ProductType
  category_id?: string
  search?: string
  is_active?: boolean
}

export interface InterventionTypeFilters {
  business_type_id?: string
  is_active?: boolean
}
