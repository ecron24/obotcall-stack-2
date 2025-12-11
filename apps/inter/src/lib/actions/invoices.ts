'use server'

import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011'

/**
 * Get auth token from cookies
 */
async function getAuthToken() {
  const cookieStore = await cookies()
  return cookieStore.get('access_token')?.value
}

/**
 * Récupère une facture par son ID
 */
export async function getInvoice(id: string) {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Non authentifié')
    }

    const response = await fetch(`${API_URL}/api/factures/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('Erreur récupération facture:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return null
  }
}

/**
 * Récupère toutes les factures
 */
export async function getInvoices() {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Non authentifié')
    }

    const response = await fetch(`${API_URL}/api/factures?page=1&per_page=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('Erreur récupération factures:', response.status)
      return []
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return []
  }
}

