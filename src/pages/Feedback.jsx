import { useEffect, useState } from 'react'
import { Star, MessageSquareQuote } from 'lucide-react'
import { api } from '../lib/api.js'
import { Card, PageHeader, Spinner, EmptyState } from '../components/ui.jsx'
import { formatDate } from '../lib/format.js'

const Stars = ({ n }) => (
  <div className="flex items-center gap-0.5" aria-label={`${n} out of 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < n ? 'fill-gold text-gold' : 'text-ink/20'}`} />
    ))}
  </div>
)

export default function Feedback() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listFeedback().then((r) => setItems(r.feedback)).finally(() => setLoading(false))
  }, [])

  const avg = items.length ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1) : null

  return (
    <>
      <PageHeader
        title="Guest feedback"
        subtitle="Collected after checkout to help improve the experience. This does not change a listing’s displayed rating."
      />

      {!loading && items.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <p className="text-sm text-ink/55">Responses</p>
            <p className="mt-1 font-serif text-3xl font-bold text-plum">{items.length}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-ink/55">Average rating</p>
            <div className="mt-1 flex items-center gap-3">
              <p className="font-serif text-3xl font-bold text-plum">{avg}</p>
              <Stars n={Math.round(avg)} />
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No feedback yet" hint="Guests are emailed a feedback request after they check out." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((f) => (
            <Card key={f.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 shrink-0 text-gold/60" />
                  <div>
                    <p className="font-medium text-ink">{f.guest_name}</p>
                    {f.property?.name && <p className="text-xs text-ink/50">{f.property.name}</p>}
                  </div>
                </div>
                <Stars n={f.rating} />
              </div>
              {f.comment && <p className="mt-3 text-sm leading-relaxed text-ink/75">“{f.comment}”</p>}
              <p className="mt-3 text-xs text-ink/40">
                {formatDate(f.created_at)}{f.reference ? ` · ${f.reference}` : ''}
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
