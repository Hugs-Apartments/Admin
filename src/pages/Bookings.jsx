import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { Card, PageHeader, Spinner, StatusBadge, EmptyState } from '../components/ui.jsx'
import { formatNaira, formatDate } from '../lib/format.js'
import BookingDetail from '../components/BookingDetail.jsx'

const STATUS_OPTIONS = ['', 'completed', 'cancelled']
const PAY_OPTIONS = ['', 'success', 'refunded']

const STATUS_LEGEND = [
  { status: 'completed', text: 'Payment received via Paystack — this is what confirms a booking and holds the dates. The guest is emailed a PDF receipt automatically.' },
  { status: 'cancelled', text: 'Cancelled at the guest’s request. The dates are released back to availability, and the payment is refunded.' },
]

export default function Bookings() {
  const [searchParams] = useSearchParams()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [focus, setFocus] = useState(null)

  const load = () => {
    setLoading(true)
    const params = {}
    if (status) params.status = status
    if (paymentStatus) params.payment_status = paymentStatus
    api.listBookings(params).then((r) => setBookings(r.bookings)).finally(() => setLoading(false))
  }
  useEffect(load, [status, paymentStatus])

  // Deep-link focus from dashboard.
  useEffect(() => {
    const id = searchParams.get('focus')
    if (id) setFocus(id)
  }, [searchParams])

  const selectCls = 'rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink/70 outline-none focus:border-gold'

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="All reservations across your apartments."
        actions={
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? `Status: ${s}` : 'All statuses'}</option>)}
            </select>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={selectCls}>
              {PAY_OPTIONS.map((s) => <option key={s} value={s}>{s ? `Payment: ${s}` : 'All payments'}</option>)}
            </select>
          </div>
        }
      />

      {/* Legend — what each booking status means */}
      <Card className="mb-5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">What the statuses mean</p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {STATUS_LEGEND.map((l) => (
            <li key={l.status} className="flex items-start gap-2.5">
              <span className="shrink-0"><StatusBadge status={l.status} /></span>
              <span className="text-xs leading-relaxed text-ink/60">{l.text}</span>
            </li>
          ))}
        </ul>
      </Card>

      {loading ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings found" hint="Try adjusting the filters." />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-offwhite text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">Guest</th>
                  <th className="px-5 py-3 font-semibold">Apartment</th>
                  <th className="px-5 py-3 font-semibold">Dates</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {bookings.map((b) => (
                  <tr key={b.id} onClick={() => setFocus(b.id)} className="cursor-pointer hover:bg-offwhite/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{b.guest_name}</p>
                      <p className="text-xs text-ink/50">{b.reference}</p>
                    </td>
                    <td className="px-5 py-3 text-ink/70">{b.property?.name}</td>
                    <td className="px-5 py-3 text-ink/70">{formatDate(b.check_in)} → {formatDate(b.check_out)}</td>
                    <td className="px-5 py-3 font-semibold text-plum">{formatNaira(b.total_amount)}</td>
                    <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3"><StatusBadge status={b.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-ink/5 md:hidden">
            {bookings.map((b) => (
              <button key={b.id} onClick={() => setFocus(b.id)} className="w-full p-4 text-left hover:bg-offwhite/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{b.guest_name}</p>
                    <p className="text-xs text-ink/50">{b.reference}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-plum">{formatNaira(b.total_amount)}</p>
                </div>
                <p className="mt-2 text-sm text-ink/70">{b.property?.name}</p>
                <p className="mt-0.5 text-xs text-ink/60">{formatDate(b.check_in)} → {formatDate(b.check_out)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={b.status} />
                  <StatusBadge status={b.payment_status} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {focus && (
        <BookingDetail bookingId={focus} onClose={() => setFocus(null)} onChanged={load} />
      )}
    </>
  )
}
