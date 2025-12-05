'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserSettings, updateUserSettings, type UserSettings } from '@/lib/actions/settings'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserSettings | null>(null)

  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      setLoading(true)
      const data = await getUserSettings()
      setUser(data)
    } catch (err) {
      console.error('Error loading user settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleNotifications = async () => {
    if (!user) return

    try {
      const updated = await updateUserSettings({
        notifications_enabled: !user.notifications_enabled
      })
      setUser({ ...user, notifications_enabled: updated.notifications_enabled })
    } catch (err) {
      console.error('Error toggling notifications:', err)
      alert('❌ Erreur lors de la mise à jour des notifications')
    }
  }

  const handleLanguageChange = async (language: string) => {
    if (!user) return

    try {
      const updated = await updateUserSettings({ language })
      setUser({ ...user, language: updated.language })
    } catch (err) {
      console.error('Error updating language:', err)
      alert('❌ Erreur lors de la mise à jour de la langue')
    }
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear()

    // Redirect to login
    router.push('/auth/login')
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'admin': 'Administrateur',
      'manager': 'Manager',
      'technician': 'Technicien',
      'user': 'Utilisateur'
    }
    return roles[role] || role
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Impossible de charger les paramètres utilisateur</p>
        <button
          onClick={() => router.push('/auth/login')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Se connecter
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez votre compte et vos préférences
        </p>
      </div>

      {/* Profil utilisateur */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(user.full_name)
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Rôle */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Rôle</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">{getRoleLabel(user.role)}</div>
        </div>

        {/* Notifications */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Notifications</div>
            </div>
          </div>
          <button
            onClick={toggleNotifications}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              user.notifications_enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                user.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Langue */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Langue</div>
            </div>
          </div>
          <select
            value={user.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </section>

      {/* Configuration entreprise */}
      <Link
        href="/dashboard/settings/company"
        className="block bg-white rounded-lg shadow-sm p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-base font-medium text-gray-900">Configuration entreprise</div>
              <div className="text-sm text-gray-500">Mentions légales, CGV, informations</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Import de données */}
      <button
        onClick={() => alert('Fonctionnalité en cours de développement')}
        className="w-full text-left bg-white rounded-lg shadow-sm p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <div className="text-base font-medium text-gray-900">Import de données</div>
          </div>
        </div>
      </button>

      {/* Déconnexion */}
      <button
        onClick={handleLogout}
        className="w-full text-left bg-white rounded-lg shadow-sm p-6 hover:bg-red-50 transition-colors border border-red-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <div className="text-base font-medium text-red-600">Déconnexion</div>
          </div>
        </div>
      </button>

      {/* Footer version */}
      <div className="text-center py-6 text-sm text-gray-500">
        <div>Inter App v1.0.0</div>
        <div className="mt-1">© 2024 Tous droits réservés</div>
      </div>
    </div>
  )
}
