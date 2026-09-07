import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { api } from '../lib/api.js'
import { Card, PageHeader, Spinner, StatusBadge, EmptyState } from '../components/ui.jsx'
import { formatNaira, formatDateTime } from '../lib/format.js'

const STATUS_OPTIONS = ['', 'success', 'pending', 'failed', 'refunded']

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = status ? { status } : {}
    api.listPayments(params).then((r) => setPayments(r.payments)).finally(() => setLoading(false))
  }, [status])

  const total = payments.filter((p) => p.status === 'success').reduce((s, p) => s + Number(p.amount), 0)

  const downloadReceipt = async (bookingId) => {
    try {
      const { receipt } = await api.getReceipt(bookingId)
      const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${receipt.reference}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Transactions and receipts."
        actions={
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink/70">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? `Status: ${s}` : 'All statuses'}</option>)}
          </select>
        }
      />

      {!loading && payments.length > 0 && (
        <Card className="mb-6 p-5">
          <p className="text-sm text-ink/55">Total received (successful)</p>
          <p className="mt-1 font-serif text-3xl font-bold text-plum">{formatNaira(total)}</p>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : payments.length === 0 ? (
        <EmptyState title="No payments found" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-offwhite text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Guest</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Provider</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-offwhite/50">
                    <td className="px-5 py-3 font-medium text-ink">{p.reference}</td>
                    <td className="px-5 py-3 text-ink/70">{p.booking?.guest_name || '—'}</td>
                    <td className="px-5 py-3 font-semibold text-plum">{formatNaira(p.amount)}</td>
                    <td className="px-5 py-3 capitalize text-ink/70">{p.provider}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3 text-ink/60">{formatDateTime(p.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {p.status === 'success' && (
                        <button onClick={() => downloadReceipt(p.booking_id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gold hover:bg-offwhite hover:text-plum">
                          <Download className="h-4 w-4" /> Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
