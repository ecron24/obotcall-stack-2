'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getTechnicians } from '@/lib/actions/technicians'

interface Technician {
  id: string
  name: string
  email: string
  phone?: string
  specialties?: string[]
  is_active: boolean
  interventions_count?: number
  rating?: number
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function TechniciansPage() {
  const router = useRouter()
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTechnicians()
  }, [])

  const fetchTechnicians = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const data = await getTechnicians()
      setTechnicians(data as any || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Error fetching technicians:', err)
      setTechnicians([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Techniciens</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez votre équipe terrain
          </p>
        </div>
        <Link
          href="/dashboard/technicians/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          ➕ Nouveau technicien
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Total techniciens</div>
          <div className="text-2xl font-bold text-gray-900">{technicians.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Actifs</div>
          <div className="text-2xl font-bold text-green-600">
            {technicians.filter(t => t.is_active).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Interventions totales</div>
          <div className="text-2xl font-bold text-blue-600">
            {technicians.reduce((sum, t) => sum + (t.interventions_count || 0), 0)}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ API techniciens en développement - Fonctionnalité disponible prochainement
          </p>
        </div>
      )}

      {/* Liste */}
      {technicians.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <span className="text-6xl mb-4 block">👷</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun technicien
          </h3>
          <p className="text-gray-500 mb-6">
            Ajoutez les membres de votre équipe terrain
          </p>
          <Link
            href="/dashboard/technicians/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            ➕ Ajouter un technicien
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech) => (
            <div key={tech.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tech.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {tech.is_active ? '✓ Actif' : 'Inactif'}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">{tech.name}</h3>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <div>📧 {tech.email}</div>
                {tech.phone && <div>📱 {tech.phone}</div>}
              </div>

              {tech.specialties && tech.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {tech.specialties.map((specialty, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{tech.interventions_count || 0}</span> interventions
                </div>
                {tech.rating && (
                  <div className="text-sm">
                    ⭐ {tech.rating.toFixed(1)}
                  </div>
                )}
              </div>

              <Link
                href={`/dashboard/technicians/${tech.id}`}
                className="mt-4 block w-full text-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                Voir le profil
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
