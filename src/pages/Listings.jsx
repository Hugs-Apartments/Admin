import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Power } from 'lucide-react'
import { api } from '../lib/api.js'
import { Card, PageHeader, Button, Spinner, StatusBadge, ConfirmModal, EmptyState } from '../components/ui.jsx'
import { formatNaira } from '../lib/format.js'
import ListingForm from '../components/ListingForm.jsx'

export default function Listings() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // property | 'new' | null
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.listProperties().then((r) => setProperties(r.properties)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleActive = async (p) => {
    await api.updateProperty(p.id, { is_active: !p.is_active })
    load()
  }

  const confirmDelete = async () => {
    setBusy(true)
    setError('')
    try {
      await api.deleteProperty(deleting.id)
      setDeleting(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Listings"
        subtitle="Manage your apartments."
        actions={<Button variant="gold" onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add listing</Button>}
      />

      {loading ? (
        <Spinner />
      ) : properties.length === 0 ? (
        <EmptyState title="No listings yet" hint="Add your first apartment to get started." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-offwhite text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">Apartment</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Price/night</th>
                  <th className="px-5 py-3 font-semibold">Guests</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-offwhite/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]} alt="" className="h-10 w-14 rounded object-cover" />
                        <span className="font-medium text-ink">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink/70">{p.type}</td>
                    <td className="px-5 py-3 font-semibold text-plum">{formatNaira(p.price_per_night)}</td>
                    <td className="px-5 py-3 text-ink/70">{p.max_guests}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleActive(p)} title={p.is_active ? 'Deactivate' : 'Activate'} className="rounded-lg p-2 text-ink/50 hover:bg-ink/5 hover:text-ink">
                          <Power className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditing(p)} title="Edit" className="rounded-lg p-2 text-ink/50 hover:bg-ink/5 hover:text-plum">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setError(''); setDeleting(p) }} title="Delete" className="rounded-lg p-2 text-ink/50 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editing && (
        <ListingForm
          property={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      <ConfirmModal
        open={!!deleting}
        title="Delete listing?"
        message={
          error
            ? error
            : `This will permanently remove “${deleting?.name}”. This cannot be undone.`
        }
        confirmLabel="Delete"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}
