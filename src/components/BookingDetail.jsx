import { useEffect, useState } from 'react'
import { X, Mail, Phone, Ban, FileText } from 'lucide-react'
import { api } from '../lib/api.js'
import { Button, StatusBadge, Spinner, ConfirmModal } from './ui.jsx'
import { formatNaira, formatDate, formatDateTime } from '../lib/format.js'

export default function BookingDetail({ bookingId, onClose, onChanged }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)

  const load = () => {
    setLoading(true)
    api.getBooking(bookingId).then((r) => setBooking(r.booking)).finally(() => setLoading(false))
  }
  useEffect(load, [bookingId])

  // Admins never confirm bookings — payment does. The only status change an
  // admin makes is cancelling, and only at the guest's request.
  const cancelBooking = async () => {
    setBusy(true)
    try {
      await api.updateBookingStatus(bookingId, 'cancelled')
      setCancelling(false)
      load()
      onChanged?.()
    } finally {
      setBusy(false)
    }
  }

  const viewReceipt = async () => {
    const r = await api.getReceipt(bookingId)
    setReceipt(r.receipt)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-y-auto bg-offwhite shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-ink/10 bg-white px-6 py-4">
          <h3 className="font-serif text-xl font-semibold text-ink">Booking detail</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        {loading || !booking ? (
          <Spinner />
        ) : (
          <div className="space-y-5 p-6">
            {/* Summary */}
            <div className="rounded-xl border-t-2 border-gold bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-serif text-lg font-semibold text-ink">{booking.guest_name}</p>
                  <p className="text-sm text-ink/50">{booking.reference}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={booking.status} />
                  <StatusBadge status={booking.payment_status} />
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <a href={`mailto:${booking.guest_email}`} className="flex items-center gap-2 text-ink/70 hover:text-plum"><Mail className="h-4 w-4 text-gold" /> {booking.guest_email}</a>
                <a href={`tel:${booking.guest_phone}`} className="flex items-center gap-2 text-ink/70 hover:text-plum"><Phone className="h-4 w-4 text-gold" /> {booking.guest_phone}</a>
              </div>
              {booking.notes && <p className="mt-3 rounded-lg bg-offwhite px-3 py-2 text-sm text-ink/60">“{booking.notes}”</p>}
            </div>

            {/* Stay */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h4 className="font-serif text-base font-semibold text-ink">Stay</h4>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Apartment" value={booking.property?.name} />
                <Row label="Type" value={booking.property?.type} />
                <Row label="Check-in" value={formatDate(booking.check_in)} />
                <Row label="Check-out" value={formatDate(booking.check_out)} />
                <Row label="Guests" value={booking.guests} />
                <Row label="Nights" value={booking.nights} />
              </dl>
            </div>

            {/* Charges */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h4 className="font-serif text-base font-semibold text-ink">Charges</h4>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Subtotal" value={formatNaira(booking.subtotal)} />
                <Row label="Service fee" value={formatNaira(booking.service_fee)} />
                <div className="flex justify-between border-t border-ink/10 pt-2 font-serif text-base font-bold text-plum">
                  <dt>Total</dt><dd>{formatNaira(booking.total_amount)}</dd>
                </div>
              </dl>
              {booking.payments?.length > 0 && (
                <p className="mt-3 text-xs text-ink/50">Paid via {booking.payments[0].provider} · {formatDateTime(booking.payments[0].created_at)}</p>
              )}
            </div>

            {/* Payment — not the admin — confirms a booking. Once a Paystack
                payment succeeds the booking is marked "completed" and the guest
                is emailed a PDF receipt. Admins only cancel, at the guest's
                request, or re-view the receipt. */}
            <div className="rounded-lg bg-champagne/25 px-4 py-2.5 text-xs text-ink/60">
              A successful payment marks a booking <strong>completed</strong> and emails the guest
              their receipt automatically — there is no manual confirmation. Only cancel a booking
              when the guest asks you to.
            </div>
            <div className="flex flex-wrap gap-2">
              {booking.status !== 'cancelled' && (
                <Button variant="danger" onClick={() => setCancelling(true)}><Ban className="h-4 w-4" /> Cancel booking</Button>
              )}
              {(booking.status === 'completed' || booking.payment_status === 'success') && (
                <Button variant="outline" onClick={viewReceipt}><FileText className="h-4 w-4" /> Receipt</Button>
              )}
            </div>

            {receipt && (
              <div className="rounded-xl border border-ink/10 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-base font-semibold text-ink">Receipt</h4>
                  <button onClick={() => window.print()} className="text-xs font-semibold text-gold hover:text-plum">Print</button>
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <Row label="Reference" value={receipt.reference} />
                  <Row label="Guest" value={receipt.guest.name} />
                  <Row label="Total paid" value={formatNaira(receipt.charges.total)} />
                  <Row label="Status" value={receipt.status} />
                </dl>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={cancelling}
        title="Cancel this booking?"
        message="Only do this at the guest’s request. It releases the dates back to availability; if the guest has already paid, arrange any refund separately. Remember to notify the guest."
        confirmLabel="Cancel booking"
        danger
        loading={busy}
        onConfirm={cancelBooking}
        onCancel={() => setCancelling(false)}
      />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-ink/70">
      <dt>{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  )
}
