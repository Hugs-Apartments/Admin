import { useState } from 'react'
import { Search, XCircle, CheckCircle2, Ban } from 'lucide-react'
import { api } from '../lib/api.js'
import { Card, PageHeader, Button, StatusBadge, ConfirmModal, Field, inputCls } from '../components/ui.jsx'
import { formatNaira, formatDate } from '../lib/format.js'

// Admin cancels a booking ONLY on the customer's instruction. The admin asks
// the guest for their booking reference, looks it up here, confirms the details
// match the caller, then cancels. Cancelling releases the dates automatically.
export default function CancelBooking() {
  const [ref, setRef] = useState('')
  const [booking, setBooking] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [done, setDone] = useState(false)

  const find = async (e) => {
    e.preventDefault()
    if (!ref.trim()) return
    setSearching(true)
    setError('')
    setBooking(null)
    setDone(false)
    try {
      const { booking } = await api.getBookingByReference(ref.trim())
      setBooking(booking)
    } catch (err) {
      setError(err.message || 'No booking found with that reference.')
    } finally {
      setSearching(false)
    }
  }

  const doCancel = async () => {
    setCancelling(true)
    try {
      await api.updateBookingStatus(booking.id, 'cancelled')
      setBooking((b) => ({ ...b, status: 'cancelled' }))
      setDone(true)
      setConfirming(false)
    } catch (err) {
      setError(err.message || 'Could not cancel this booking.')
      setConfirming(false)
    } finally {
      setCancelling(false)
    }
  }

  const alreadyCancelled = booking?.status === 'cancelled'

  return (
    <>
      <PageHeader
        title="Cancel a booking"
        subtitle="Cancel only at the guest’s request. Ask for their booking reference, confirm the details match, then cancel."
      />

      <Card className="mb-6 p-5">
        <form onSubmit={find} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Booking reference / ID">
              <input
                className={inputCls}
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="e.g. HUGS-2026-A1B2C3"
                autoFocus
              />
            </Field>
          </div>
          <Button type="submit" variant="primary" loading={searching} className="sm:w-auto">
            <Search className="h-4 w-4" /> Find booking
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      {booking && (
        <Card className="p-5 sm:p-6">
          {done && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" /> Booking cancelled. The dates are released back to availability.
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-serif text-xl font-semibold text-ink">{booking.reference}</p>
              <p className="mt-1 text-sm text-ink/60">Booked {formatDate(booking.created_at)}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={booking.status} />
              <StatusBadge status={booking.payment_status} />
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Guest</p>
              <p className="mt-1.5 font-medium text-ink">{booking.guest_name}</p>
              <p className="text-sm text-ink/70">{booking.guest_email}</p>
              <p className="text-sm text-ink/70">{booking.guest_phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Apartment</p>
              <p className="mt-1.5 font-medium text-ink">{booking.property?.name}</p>
              <p className="text-sm text-ink/70">{booking.property?.type}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Stay</p>
              <p className="mt-1.5 text-sm text-ink/80">{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</p>
              <p className="text-sm text-ink/60">{booking.nights} night(s) · {booking.guests} guest(s)</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Total</p>
              <p className="mt-1.5 font-serif text-lg font-semibold text-plum">{formatNaira(booking.total_amount)}</p>
              {Number(booking.discount_amount) > 0 && (
                <p className="text-xs text-ink/50">Discount {booking.discount_code ? `(${booking.discount_code})` : ''}: −{formatNaira(booking.discount_amount)}</p>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="mt-5 rounded-lg bg-offwhite px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Notes</p>
              <p className="mt-1 text-sm text-ink/70">{booking.notes}</p>
            </div>
          )}

          <div className="mt-6 border-t border-ink/10 pt-5">
            {alreadyCancelled ? (
              <p className="flex items-center gap-2 text-sm text-ink/60">
                <Ban className="h-4 w-4" /> This booking is already cancelled.
              </p>
            ) : (
              <Button variant="danger" onClick={() => setConfirming(true)}>
                <XCircle className="h-4 w-4" /> Cancel this booking
              </Button>
            )}
          </div>
        </Card>
      )}

      <ConfirmModal
        open={confirming}
        title="Cancel this booking?"
        message={`This will cancel ${booking?.reference} for ${booking?.guest_name} and release the dates. This cannot be undone.`}
        confirmLabel="Cancel booking"
        loading={cancelling}
        onConfirm={doCancel}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
