'use client'

import { useState, useEffect } from 'react'
import { BusinessTypeSelector } from '@/components/business'
import type { BusinessType } from '@/types'

export default function SettingsPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null)
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    siret: '',
    address: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    // Charger les paramètres depuis localStorage ou API
    const savedSettings = localStorage.getItem('company_settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setCompanyInfo(settings)
      } catch (e) {
        console.error('Error loading settings:', e)
      }
    }
  }, [])

  const handleSave = () => {
    // Sauvegarder dans localStorage (ou API)
    localStorage.setItem('company_settings', JSON.stringify(companyInfo))
    alert('✅ Paramètres enregistrés')
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configurez votre entreprise
        </p>
      </div>

      {/* Type de métier */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Type de métier</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez le type d'activité principale de votre entreprise
        </p>
        <BusinessTypeSelector
          onChange={(business) => {
            setSelectedBusiness(business)
            localStorage.setItem('selected_business_type', JSON.stringify(business))
          }}
        />
      </section>

      {/* Informations entreprise */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Informations entreprise</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'entreprise
            </label>
            <input
              type="text"
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mon Entreprise SARL"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SIRET
              </label>
              <input
                type="text"
                value={companyInfo.siret}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, siret: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 456 789 00012"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={companyInfo.phone}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={companyInfo.email}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contact@monentreprise.fr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <textarea
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="123 rue de la République, 75001 Paris"
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          💾 Enregistrer les paramètres
        </button>
      </div>
    </div>
  )
}
