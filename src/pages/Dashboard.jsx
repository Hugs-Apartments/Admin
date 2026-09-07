import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Wallet, BedDouble, CalendarClock, ArrowUpRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../lib/api.js'
import { Card, PageHeader, Spinner, StatusBadge } from '../components/ui.jsx'
import { formatNaira, formatNairaShort, formatDate, formatDateTime } from '../lib/format.js'

const METRICS = [
  { key: 'bookings_this_month', label: 'Bookings (month)', icon: CalendarCheck, fmt: (v) => v },
  { key: 'revenue_this_month', label: 'Revenue (month)', icon: Wallet, fmt: formatNaira },
  { key: 'active_properties', label: 'Active listings', icon: BedDouble, fmt: (v) => v },
  { key: 'upcoming_count', label: 'Upcoming check-ins', icon: CalendarClock, fmt: (v) => v },
]

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.overview(), api.revenue(30)])
      .then(([o, r]) => {
        setData(o)
        setSeries(r.series)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <>
      <PageHeader title="Overview" subtitle="Your business at a glance." />

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map(({ key, label, icon: Icon, fmt }) => (
          <Card key={key} className="p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-plum/5 text-plum">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
            </div>
            <p className="mt-4 font-serif text-3xl font-bold text-ink">{fmt(data.metrics[key])}</p>
            <p className="mt-1 text-sm text-ink/55">{label}</p>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card className="mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-ink">Revenue</h2>
            <p className="text-sm text-ink/55">Last 30 days</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A45C" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#C9A45C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                tick={{ fontSize: 11, fill: '#21112288' }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis tickFormatter={formatNairaShort} tick={{ fontSize: 11, fill: '#21112288' }} width={48} />
              <Tooltip
                formatter={(v) => [formatNaira(v), 'Revenue']}
                labelFormatter={(d) => formatDate(d)}
                contentStyle={{ borderRadius: 12, border: '1px solid #00000015', fontSize: 13 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3B1445" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent bookings */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-ink">Recent bookings</h2>
            <Link to="/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:text-plum">
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_bookings.slice(0, 6).map((b) => (
              <Link key={b.id} to={`/bookings?focus=${b.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-offwhite">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{b.guest_name}</p>
                  <p className="truncate text-xs text-ink/50">{b.property?.name} · {b.reference}</p>
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-ink">{formatNaira(b.total_amount)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Upcoming check-ins */}
        <Card className="p-6">
          <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Upcoming check-ins</h2>
          {data.upcoming_checkins.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/50">No upcoming check-ins.</p>
          ) : (
            <div className="space-y-3">
              {data.upcoming_checkins.slice(0, 6).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg px-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{b.guest_name}</p>
                    <p className="truncate text-xs text-ink/50">{b.property?.name}</p>
                  </div>
                  <span className="ml-3 shrink-0 text-sm text-ink/70">{formatDate(b.check_in)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
