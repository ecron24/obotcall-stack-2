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
 * Récupère un client par son ID
 */
export async function getClient(id: string) {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Non authentifié')
    }

    const response = await fetch(`${API_URL}/api/clients/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('Erreur récupération client:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching client:', error)
    return null
  }
}

/**
 * Récupère tous les clients
 */
export async function getClients() {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Non authentifié')
    }

    const response = await fetch(`${API_URL}/api/clients?page=1&per_page=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('Erreur récupération clients:', response.status)
      return []
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
}

/**
 * Recherche de clients par nom, email ou téléphone
 */
export async function searchClients(query: string) {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Non authentifié')
    }

    const response = await fetch(`${API_URL}/api/clients?search=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('Erreur recherche clients:', response.status)
      return []
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error searching clients:', error)
    return []
  }
}

