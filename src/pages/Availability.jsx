import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api.js'
import { Card, PageHeader, Spinner, Button, Modal, Field, inputCls, ConfirmModal } from '../components/ui.jsx'
import { formatDate } from '../lib/format.js'

// Normalises a Date to yyyy-mm-dd.
const iso = (d) => d.toISOString().slice(0, 10)

function buildMonth(year, month) {
  const first = new Date(year, month, 1)
  const startDay = first.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

// Is `day` (Date) within any [start,end) range?
function statusFor(day, occupied) {
  const s = iso(day)
  for (const r of occupied) {
    if (s >= r.start && s < r.end) return r.kind
  }
  return 'available'
}

export default function Availability() {
  const [properties, setProperties] = useState([])
  const [propertyId, setPropertyId] = useState('')
  const [occupied, setOccupied] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState(new Date())
  const [showBlock, setShowBlock] = useState(false)
  const [deletingBlock, setDeletingBlock] = useState(null)

  useEffect(() => {
    api.listProperties().then((r) => {
      setProperties(r.properties)
      if (r.properties[0]) setPropertyId(r.properties[0].id)
      setLoading(false)
    })
  }, [])

  const loadAvailability = () => {
    if (!propertyId) return
    Promise.all([api.getAvailability(propertyId), api.listBlocks(propertyId)]).then(([a, b]) => {
      const blockRanges = b.blocks.map((bl) => ({ start: bl.start_date, end: bl.end_date, kind: 'blocked' }))
      const blockSet = new Set(blockRanges.map((r) => `${r.start}|${r.end}`))
      // Anything occupied that isn't a manual block is a booking.
      const bookingRanges = a.occupied
        .filter((r) => !blockSet.has(`${r.start}|${r.end}`))
        .map((r) => ({ ...r, kind: 'booked' }))
      setOccupied([...bookingRanges, ...blockRanges])
      setBlocks(b.blocks)
    })
  }
  useEffect(loadAvailability, [propertyId])

  const cells = useMemo(() => buildMonth(cursor.getFullYear(), cursor.getMonth()), [cursor])

  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1))

  return (
    <>
      <PageHeader
        title="Availability"
        subtitle="View bookings and manually block dates for maintenance or owner use."
        actions={
          <Button variant="gold" disabled={!propertyId} onClick={() => setShowBlock(true)}>
            <Plus className="h-4 w-4" /> Block dates
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Property selector */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm">
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Legend />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Calendar */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-ink">
                  {cursor.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => shift(-1)} className="rounded-lg p-2 text-ink/50 hover:bg-ink/5"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={() => shift(1)} className="rounded-lg p-2 text-ink/50 hover:bg-ink/5"><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-ink/40">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-1">{d}</div>)}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />
                  const status = statusFor(day, occupied)
                  const styles = {
                    available: 'bg-white text-ink/70 border-ink/10',
                    booked: 'bg-plum/10 text-plum border-plum/20',
                    blocked: 'bg-red-50 text-red-600 border-red-200',
                  }[status]
                  return (
                    <div key={i} className={`aspect-square rounded-lg border text-sm ${styles} flex items-center justify-center`}>
                      {day.getDate()}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Blocks list */}
            <Card className="p-6">
              <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Manual blocks</h2>
              {blocks.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink/50">No blocked ranges.</p>
              ) : (
                <div className="space-y-2">
                  {blocks.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-ink/10 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-ink">{formatDate(b.start_date)} → {formatDate(b.end_date)}</p>
                        {b.reason && <p className="text-xs text-ink/50">{b.reason}</p>}
                      </div>
                      <button onClick={() => setDeletingBlock(b)} className="rounded-lg p-2 text-ink/40 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {showBlock && (
        <BlockForm
          propertyId={propertyId}
          onClose={() => setShowBlock(false)}
          onSaved={() => { setShowBlock(false); loadAvailability() }}
        />
      )}

      <ConfirmModal
        open={!!deletingBlock}
        title="Remove block?"
        message="These dates will become available for booking again."
        confirmLabel="Remove block"
        onConfirm={async () => { await api.deleteBlock(propertyId, deletingBlock.id); setDeletingBlock(null); loadAvailability() }}
        onCancel={() => setDeletingBlock(null)}
      />
    </>
  )
}

function Legend() {
  const items = [
    { label: 'Available', cls: 'bg-white border-ink/20' },
    { label: 'Booked', cls: 'bg-plum/10 border-plum/30' },
    { label: 'Blocked', cls: 'bg-red-50 border-red-200' },
  ]
  return (
    <div className="flex items-center gap-4 text-xs text-ink/60">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded border ${i.cls}`} /> {i.label}
        </span>
      ))}
    </div>
  )
}

function BlockForm({ propertyId, onClose, onSaved }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!(end > start)) { setError('End date must be after start date.'); return }
    setSaving(true)
    try {
      await api.createBlock(propertyId, { start_date: start, end_date: end, reason: reason || undefined })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Block dates" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start date"><input type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} required /></Field>
          <Field label="End date"><input type="date" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} required /></Field>
        </div>
        <Field label="Reason (optional)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Maintenance, owner use…" /></Field>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="gold" loading={saving}>Block dates</Button>
        </div>
      </form>
    </Modal>
  )
}
