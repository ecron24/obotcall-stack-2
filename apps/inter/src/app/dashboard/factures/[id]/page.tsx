'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  tva_rate: number
  subtotal_ht: number
  tva_amount: number
  total_ttc: number
}

interface Invoice {
  id: string
  invoice_number: string
  invoice_type: 'proforma' | 'final'
  client_id: string
  intervention_id?: string
  issue_date: string
  due_date: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal_ht: number
  total_tax: number
  total_ttc: number
  payment_terms?: string
  notes?: string
  validated_at?: string
  validated_by?: string
  converted_to_final_at?: string
  converted_to_final_by?: string
  sent_at?: string
  sent_by?: string
  created_at: string
  updated_at: string
  client?: {
    id: string
    first_name: string
    last_name: string
    company_name?: string
    email: string
    phone?: string
    address?: string
    city?: string
    postal_code?: string
  }
  intervention_items?: any[]
}

export default function FactureDetailPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params?.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la facture')
      }

      const data = await response.json()
      setInvoice(data)

      // Fetch invoice items
      const itemsResponse = await fetch(`${API_URL}/api/invoices/${invoiceId}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setItems(itemsData.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Error fetching invoice:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleValidateProforma = async () => {
    if (!confirm('Voulez-vous valider cette facture proforma ?')) {
      return
    }

    try {
      setActionLoading(true)
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la validation')
      }

      await fetchInvoice()
      alert('✅ Facture proforma validée avec succès')
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleConvertToFinal = async () => {
    if (!confirm('Voulez-vous convertir cette proforma en facture finale ? Un nouveau numéro sera généré.')) {
      return
    }

    try {
      setActionLoading(true)
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/convert-to-final`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la conversion')
      }

      await fetchInvoice()
      alert('✅ Facture convertie en facture finale avec succès')
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendInvoice = async () => {
    if (!confirm('Marquer cette facture comme envoyée ?')) {
      return
    }

    try {
      setActionLoading(true)
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de l\'envoi')
      }

      await fetchInvoice()
      alert('✅ Facture marquée comme envoyée')
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette facture ?')) {
      return
    }

    try {
      setActionLoading(true)
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la suppression')
      }

      router.push('/dashboard/factures')
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const generatePDF = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `facture-${invoice?.invoice_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('⚠️ Génération PDF non disponible pour le moment')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Envoyée', className: 'bg-blue-100 text-blue-800' },
      paid: { label: 'Payée', className: 'bg-green-100 text-green-800' },
      overdue: { label: 'En retard', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-500' },
    }
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      proforma: { label: 'PROFORMA', className: 'bg-yellow-100 text-yellow-800' },
      final: { label: 'FINALE', className: 'bg-purple-100 text-purple-800' },
    }
    const badge = badges[type] || { label: type, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Facture introuvable'}
        </div>
        <Link
          href="/dashboard/factures"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Retour aux factures
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/factures"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          ← Retour aux factures
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {invoice.invoice_number}
              </h1>
              {getTypeBadge(invoice.invoice_type)}
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-sm text-gray-500">
              Créée le {formatDate(invoice.created_at)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {invoice.invoice_type === 'proforma' && !invoice.validated_at && (
              <button
                onClick={handleValidateProforma}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                ✓ Valider Proforma
              </button>
            )}

            {invoice.invoice_type === 'proforma' && invoice.validated_at && (
              <button
                onClick={handleConvertToFinal}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                → Convertir en Finale
              </button>
            )}

            {invoice.invoice_type === 'final' && !invoice.sent_at && (
              <button
                onClick={handleSendInvoice}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                📧 Marquer Envoyée
              </button>
            )}

            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
            >
              📄 PDF
            </button>

            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Client */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Client</h3>
          {invoice.client ? (
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">
                {invoice.client.company_name || `${invoice.client.first_name} ${invoice.client.last_name}`}
              </p>
              <p className="text-sm text-gray-600">{invoice.client.email}</p>
              {invoice.client.phone && (
                <p className="text-sm text-gray-600">{invoice.client.phone}</p>
              )}
              {invoice.client.address && (
                <p className="text-sm text-gray-600">
                  {invoice.client.address}
                  {invoice.client.postal_code && invoice.client.city && (
                    <><br />{invoice.client.postal_code} {invoice.client.city}</>
                  )}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Non renseigné</p>
          )}
        </div>

        {/* Dates */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Dates</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Date d'émission</p>
              <p className="font-semibold text-gray-900">{formatDate(invoice.issue_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date d'échéance</p>
              <p className="font-semibold text-gray-900">{formatDate(invoice.due_date)}</p>
            </div>
            {invoice.payment_terms && (
              <div>
                <p className="text-xs text-gray-500">Conditions</p>
                <p className="font-semibold text-gray-900">{invoice.payment_terms}</p>
              </div>
            )}
          </div>
        </div>

        {/* Montants */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Montants</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total HT</span>
              <span className="font-medium text-gray-900">{formatPrice(invoice.subtotal_ht)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">TVA</span>
              <span className="font-medium text-gray-900">{formatPrice(invoice.total_tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold text-gray-900">Total TTC</span>
              <span className="font-bold text-lg text-gray-900">{formatPrice(invoice.total_ttc)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Status */}
      {(invoice.validated_at || invoice.converted_to_final_at || invoice.sent_at) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">📋 Historique workflow</h3>
          <div className="space-y-1 text-sm text-blue-800">
            {invoice.validated_at && (
              <p>✓ Validée le {formatDate(invoice.validated_at)}</p>
            )}
            {invoice.converted_to_final_at && (
              <p>→ Convertie en finale le {formatDate(invoice.converted_to_final_at)}</p>
            )}
            {invoice.sent_at && (
              <p>📧 Envoyée le {formatDate(invoice.sent_at)}</p>
            )}
          </div>
        </div>
      )}

      {/* Invoice Items */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lignes de facturation</h3>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Aucune ligne de facturation
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Prix Unit. HT
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    TVA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total HT
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total TTC
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {formatPrice(item.unit_price_ht)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {item.tva_rate}%
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      {formatPrice(item.subtotal_ht)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      {formatPrice(item.total_ttc)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
          <p className="text-gray-900 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </div>
  )
}
