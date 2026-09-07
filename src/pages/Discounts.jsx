import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Power, Tag } from 'lucide-react'
import { api } from '../lib/api.js'
import { Card, PageHeader, Button, Spinner, StatusBadge, ConfirmModal, EmptyState, Modal, Field, inputCls } from '../components/ui.jsx'
import { formatNaira, formatDate } from '../lib/format.js'

const describe = (c) => (c.type === 'percent' ? `${Number(c.value)}% off` : `${formatNaira(c.value)} off`)
const usesLabel = (c) => `${c.used_count || 0}${c.max_uses != null ? ` / ${c.max_uses}` : ''}`

export default function Discounts() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // code | 'new' | null
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.listDiscounts().then((r) => setCodes(r.codes)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleActive = async (c) => {
    await api.updateDiscount(c.id, { active: !c.active })
    load()
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await api.deleteDiscount(deleting.id)
      setDeleting(null)
      load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Discount codes"
        subtitle="Promo codes guests can apply at checkout. The discount is validated and applied by the backend before payment."
        actions={<Button variant="gold" onClick={() => { setError(''); setEditing('new') }}><Plus className="h-4 w-4" /> New code</Button>}
      />

      {loading ? (
        <Spinner />
      ) : codes.length === 0 ? (
        <EmptyState title="No discount codes yet" hint="Create one to offer guests a percentage or fixed amount off." />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-offwhite text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Discount</th>
                  <th className="px-5 py-3 font-semibold">Uses</th>
                  <th className="px-5 py-3 font-semibold">Min nights</th>
                  <th className="px-5 py-3 font-semibold">Expires</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {codes.map((c) => (
                  <tr key={c.id} className="hover:bg-offwhite/50">
                    <td className="px-5 py-3"><span className="font-mono font-semibold text-plum">{c.code}</span></td>
                    <td className="px-5 py-3 text-ink/80">{describe(c)}</td>
                    <td className="px-5 py-3 text-ink/70">{usesLabel(c)}</td>
                    <td className="px-5 py-3 text-ink/70">{c.min_nights || 0}</td>
                    <td className="px-5 py-3 text-ink/70">{c.expires_on ? formatDate(c.expires_on) : '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.active ? 'active' : 'inactive'} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleActive(c)} title={c.active ? 'Deactivate' : 'Activate'} className="rounded-lg p-2 text-ink/50 hover:bg-ink/5 hover:text-ink"><Power className="h-4 w-4" /></button>
                        <button onClick={() => { setError(''); setEditing(c) }} title="Edit" className="rounded-lg p-2 text-ink/50 hover:bg-ink/5 hover:text-plum"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleting(c)} title="Delete" className="rounded-lg p-2 text-ink/50 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-ink/5 md:hidden">
            {codes.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-semibold text-plum">{c.code}</p>
                    <p className="mt-0.5 text-sm text-ink/80">{describe(c)}</p>
                  </div>
                  <StatusBadge status={c.active ? 'active' : 'inactive'} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-ink/60">
                  <span>Uses: <span className="text-ink/80">{usesLabel(c)}</span></span>
                  <span>Min: <span className="text-ink/80">{c.min_nights || 0}n</span></span>
                  <span>Exp: <span className="text-ink/80">{c.expires_on ? formatDate(c.expires_on) : '—'}</span></span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(c)}><Power className="h-4 w-4" /> {c.active ? 'Deactivate' : 'Activate'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setError(''); setEditing(c) }}><Pencil className="h-4 w-4" /> Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {editing && (
        <DiscountForm
          code={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      <ConfirmModal
        open={!!deleting}
        title="Delete code?"
        message={`This permanently removes “${deleting?.code}”. Guests will no longer be able to use it.`}
        confirmLabel="Delete"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}

function DiscountForm({ code, onClose, onSaved }) {
  const isEdit = !!code
  const [form, setForm] = useState({
    code: code?.code || '',
    type: code?.type || 'percent',
    value: code?.value ?? 10,
    min_nights: code?.min_nights ?? 0,
    max_uses: code?.max_uses ?? '',
    starts_on: code?.starts_on || '',
    expires_on: code?.expires_on || '',
    active: code?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_nights: Number(form.min_nights) || 0,
      max_uses: form.max_uses === '' || form.max_uses == null ? null : Number(form.max_uses),
      starts_on: form.starts_on || null,
      expires_on: form.expires_on || null,
      active: form.active,
    }
    try {
      if (isEdit) await api.updateDiscount(code.id, payload)
      else await api.createDiscount(payload)
      onSaved()
    } catch (err) {
      setError(err.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit code' : 'New discount code'} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Code">
              <input className={`${inputCls} font-mono uppercase`} value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WELCOME10" required />
            </Field>
          </div>
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed ₦ off</option>
            </select>
          </Field>
          <Field label={form.type === 'percent' ? 'Percent (0–100)' : 'Amount off (₦)'}>
            <input type="number" min="0" className={inputCls} value={form.value} onChange={(e) => set('value', e.target.value)} required />
          </Field>
          <Field label="Minimum nights">
            <input type="number" min="0" className={inputCls} value={form.min_nights} onChange={(e) => set('min_nights', e.target.value)} />
          </Field>
          <Field label="Max uses (blank = unlimited)">
            <input type="number" min="1" className={inputCls} value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} placeholder="Unlimited" />
          </Field>
          <Field label="Starts on (optional)">
            <input type="date" className={inputCls} value={form.starts_on} onChange={(e) => set('starts_on', e.target.value)} />
          </Field>
          <Field label="Expires on (optional)">
            <input type="date" className={inputCls} value={form.expires_on} onChange={(e) => set('expires_on', e.target.value)} />
          </Field>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-plum" />
          Active (guests can use this code)
        </label>

        <div className="mt-6 flex justify-end gap-3 border-t border-ink/10 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="gold" loading={saving}><Tag className="h-4 w-4" /> {isEdit ? 'Save changes' : 'Create code'}</Button>
        </div>
      </form>
    </Modal>
  )
}
