import { useEffect, useState } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import { api } from '../lib/api.js'
import { Button, Field, inputCls } from './ui.jsx'

const TYPES = ['Studio', '1-Bedroom', '2-Bedroom', 'Penthouse']
const CORE_AMENITIES = ['24/7 Security', 'Power Supply', 'High-Speed WiFi', 'Ample Parking', 'Clean Water Supply']
const EXTRA_AMENITIES = ['Smart TV', 'Air Conditioning', 'Full Kitchen', 'Kitchenette', 'Workspace', 'Washer', 'Balcony', 'Private Balcony', 'City View', 'Concierge']

export default function ListingForm({ property, onClose, onSaved }) {
  const isEdit = !!property
  // Per-listing draft key so an accidental refresh doesn't wipe half-entered
  // work — a new listing and each edited listing keep separate drafts.
  const draftKey = `hugs_listing_draft_${property?.id || 'new'}`

  const defaults = {
    name: property?.name || '',
    type: property?.type || 'Studio',
    description: property?.description || '',
    price_per_night: property?.price_per_night || 0,
    max_guests: property?.max_guests || 1,
    area: property?.area || '',
    location: property?.location || 'Maryland, Lagos',
    map_url: property?.map_url || '',
    rating: property?.rating ?? 5,
    review_count: property?.review_count ?? 0,
    amenities: property?.amenities || [...CORE_AMENITIES],
    images: property?.images || [],
    is_active: property?.is_active ?? true,
  }

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) return { ...defaults, ...JSON.parse(saved) }
    } catch {
      /* corrupt/unavailable storage — fall back to defaults */
    }
    return defaults
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Persist the in-progress form on every change so a reload restores it.
  // Images are now short Cloudinary URLs, so this stays well within quota.
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(form))
    } catch {
      /* storage full/blocked — draft simply won't persist */
    }
  }, [draftKey, form])

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey)
    } catch {
      /* ignore */
    }
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const toggleAmenity = (a) =>
    set('amenities', form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a])

  // Upload each chosen file through the backend to Cloudinary and store the
  // returned HTTPS URLs on the listing. No base64 ever reaches the DB, so large
  // photos work and rows stay small.
  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = '' // let the same file be re-selected later
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const results = await Promise.all(files.map((file) => api.uploadImage(file)))
      const urls = results.map((r) => r.url)
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }))
    } catch (err) {
      setError(err.message || 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }
  const removeImage = (idx) => set('images', form.images.filter((_, i) => i !== idx))

  const submit = async (e) => {
    e.preventDefault()
    if (uploading) return
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      price_per_night: Number(form.price_per_night),
      max_guests: Number(form.max_guests),
      rating: Number(form.rating),
      review_count: Number(form.review_count),
      map_url: form.map_url?.trim() || null,
      images: form.images,
    }
    try {
      if (isEdit) await api.updateProperty(property.id, payload)
      else await api.createProperty(payload)
      clearDraft()
      onSaved()
    } catch (err) {
      setError(err.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h3 className="font-serif text-xl font-semibold text-ink">{isEdit ? 'Edit listing' : 'Add listing'}</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
            </div>
            <Field label="Type">
              <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Area"><input className={inputCls} value={form.area} onChange={(e) => set('area', e.target.value)} placeholder="e.g. Mende" /></Field>
            <Field label="Price per night (₦)"><input type="number" min="0" className={inputCls} value={form.price_per_night} onChange={(e) => set('price_per_night', e.target.value)} required /></Field>
            <Field label="Max guests"><input type="number" min="1" className={inputCls} value={form.max_guests} onChange={(e) => set('max_guests', e.target.value)} required /></Field>
            <Field label="Rating (0–5, admin-set)"><input type="number" min="0" max="5" step="0.1" className={inputCls} value={form.rating} onChange={(e) => set('rating', e.target.value)} /></Field>
            <Field label="Review count (shown on site)"><input type="number" min="0" className={inputCls} value={form.review_count} onChange={(e) => set('review_count', e.target.value)} /></Field>
            <div className="sm:col-span-2">
              <Field label="Description"><textarea rows={3} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Map link (optional)">
                <input
                  className={inputCls}
                  value={form.map_url}
                  onChange={(e) => set('map_url', e.target.value)}
                  placeholder="Google Maps link, address, or 6.5665, 3.3665"
                />
              </Field>
              <p className="mt-1 text-xs text-ink/40">
                Paste a Google Maps link (or an address / coordinates). Leave blank and no map shows on the listing.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/50">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {[...CORE_AMENITIES, ...EXTRA_AMENITIES].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.amenities.includes(a) ? 'border-plum bg-plum text-white' : 'border-ink/20 text-ink/60 hover:border-gold'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/50">Photos</p>
            <label
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 bg-offwhite px-4 py-6 text-center transition-colors hover:border-gold ${
                uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'
              }`}
            >
              <Upload className={`h-6 w-6 text-gold ${uploading ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium text-ink/70">{uploading ? 'Uploading…' : 'Click to select images'}</span>
              <span className="text-xs text-ink/40">JPG or PNG — you can choose several at once (max 8MB each)</span>
              <input type="file" accept="image/*" multiple onChange={onFiles} disabled={uploading} className="hidden" />
            </label>

            {form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {form.images.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-ink/10">
                    <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="h-4 w-4 accent-plum" />
            Active (visible on the public site)
          </label>

          <div className="mt-6 flex justify-end gap-3 border-t border-ink/10 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gold" loading={saving} disabled={uploading}>{isEdit ? 'Save changes' : 'Create listing'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
