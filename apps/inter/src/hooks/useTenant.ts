'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BusinessType } from '@/types'

interface Tenant {
  id: string
  slug: string
  name: string
  business_type_id: string | null
  business_type?: BusinessType | null
  subscription_plan: string
  subscription_status: string
  app_type: string
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true)

        // Get tenant from localStorage first (set during login/register)
        const storedTenant = localStorage.getItem('tenant')
        if (storedTenant) {
          const tenantData = JSON.parse(storedTenant)
          setTenant(tenantData)

          // If tenant has a business_type_id, fetch the business type
          if (tenantData.business_type_id) {
            const supabase = createClient()
            const { data: businessTypeData, error: btError } = await supabase
              .from('business_types')
              .select('*')
              .eq('id', tenantData.business_type_id)
              .single()

            if (!btError && businessTypeData) {
              setBusinessType(businessTypeData)
            }
          }
        } else {
          // Fallback: fetch from API if not in localStorage
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            // Get tenant from user_tenant_roles
            const { data: userRole } = await supabase
              .from('user_tenant_roles')
              .select('tenant_id')
              .eq('user_id', user.id)
              .single()

            if (userRole) {
              const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', userRole.tenant_id)
                .single()

              if (!tenantError && tenantData) {
                setTenant(tenantData)
                localStorage.setItem('tenant', JSON.stringify(tenantData))

                // Fetch business type if exists
                if (tenantData.business_type_id) {
                  const { data: businessTypeData } = await supabase
                    .from('business_types')
                    .select('*')
                    .eq('id', tenantData.business_type_id)
                    .single()

                  if (businessTypeData) {
                    setBusinessType(businessTypeData)
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTenant()
  }, [])

  return { tenant, businessType, loading, error }
}
