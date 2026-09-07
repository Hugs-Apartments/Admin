import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Card, PageHeader, Button, Field, inputCls, Spinner, ConfirmModal, Modal, StatusBadge } from '../components/ui.jsx'
import { formatDate } from '../lib/format.js'

const DEFAULT_BUSINESS = {
  name: 'Hugs Luxury Apartments',
  whatsapp: '+234 800 000 0000',
  email: 'stay@hugsapartments.ng',
  address: 'Maryland, Lagos, Nigeria',
}

const CORE_AMENITIES = ['24/7 Security', 'Power Supply', 'High-Speed WiFi', 'Ample Parking', 'Clean Water Supply']

// Business info + amenity list are stored locally for now (no backend endpoint
// in this build). Admin management uses the real API.
export default function Settings() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Business information, amenities and admin accounts." />
      <div className="space-y-6">
        <BusinessInfo />
        <AmenityList />
        <AdminUsers />
      </div>
    </>
  )
}

function BusinessInfo() {
  const [info, setInfo] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hugs_business') || '') } catch { return DEFAULT_BUSINESS }
  })
  const [saved, setSaved] = useState(false)
  const set = (k, v) => setInfo((i) => ({ ...i, [k]: v }))

  const save = (e) => {
    e.preventDefault()
    localStorage.setItem('hugs_business', JSON.stringify(info))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card className="p-6">
      <h2 className="font-serif text-lg font-semibold text-ink">Business information</h2>
      <span className="gold-rule mt-2 block" />
      <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Business name"><input className={inputCls} value={info.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="WhatsApp / phone"><input className={inputCls} value={info.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
        <Field label="Email"><input className={inputCls} value={info.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Address"><input className={inputCls} value={info.address} onChange={(e) => set('address', e.target.value)} /></Field>
        <div className="sm:col-span-2 flex items-center gap-3">
          <Button type="submit" variant="gold"><Save className="h-4 w-4" /> Save</Button>
          {saved && <span className="text-sm text-available">Saved.</span>}
        </div>
      </form>
    </Card>
  )
}

function AmenityList() {
  const [amenities, setAmenities] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hugs_amenities') || '') } catch { return [...CORE_AMENITIES] }
  })
  const [value, setValue] = useState('')

  const persist = (next) => {
    setAmenities(next)
    localStorage.setItem('hugs_amenities', JSON.stringify(next))
  }
  const add = (e) => {
    e.preventDefault()
    const v = value.trim()
    if (v && !amenities.includes(v)) persist([...amenities, v])
    setValue('')
  }

  return (
    <Card className="p-6">
      <h2 className="font-serif text-lg font-semibold text-ink">Amenity list</h2>
      <span className="gold-rule mt-2 block" />
      <div className="mt-4 flex flex-wrap gap-2">
        {amenities.map((a) => (
          <span key={a} className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-offwhite px-3 py-1.5 text-sm text-ink/80">
            {a}
            <button onClick={() => persist(amenities.filter((x) => x !== a))} className="text-ink/40 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
          </span>
        ))}
      </div>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add an amenity…" />
        <Button type="submit" variant="outline"><Plus className="h-4 w-4" /> Add</Button>
      </form>
    </Card>
  )
}

function AdminUsers() {
  const { admin } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const isSuper = admin?.role === 'superadmin'

  const load = () => {
    setLoading(true)
    api.listAdmins().then((r) => setAdmins(r.admins)).catch(() => setAdmins([])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (!isSuper) {
    return (
      <Card className="p-6">
        <h2 className="font-serif text-lg font-semibold text-ink">Admin accounts</h2>
        <span className="gold-rule mt-2 block" />
        <p className="mt-4 text-sm text-ink/50">Only superadmins can manage admin accounts.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">Admin accounts</h2>
          <span className="gold-rule mt-2 block" />
        </div>
        <Button variant="gold" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add admin</Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-4 space-y-2">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{a.name} <span className="ml-1 text-xs text-ink/40">{a.email}</span></p>
                <p className="text-xs text-ink/50">Added {formatDate(a.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.role === 'superadmin' ? 'superadmin' : 'admin'} />
                {a.id !== admin.sub && a.id !== admin.id && (
                  <button onClick={() => setDeleting(a)} className="rounded-lg p-2 text-ink/40 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddAdminForm onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}

      <ConfirmModal
        open={!!deleting}
        title="Remove admin?"
        message={`${deleting?.name} will lose access to the dashboard.`}
        confirmLabel="Remove"
        onConfirm={async () => { await api.deleteAdmin(deleting.id); setDeleting(null); load() }}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  )
}

function AddAdminForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.createAdmin(form)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Add admin" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
        <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} required /></Field>
        <Field label="Password"><input type="password" className={inputCls} value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} /></Field>
        <Field label="Role">
          <select className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="gold" loading={saving}>Create admin</Button>
        </div>
      </form>
    </Modal>
  )
}
