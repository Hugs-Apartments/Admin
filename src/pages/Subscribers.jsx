import { useEffect, useMemo, useState } from 'react'
import { Mail, Download, Search } from 'lucide-react'
import { api } from '../lib/api.js'
import { Card, PageHeader, Button, Spinner, EmptyState } from '../components/ui.jsx'
import { formatDate } from '../lib/format.js'

// Build a CSV string from the subscriber rows. Fields are quoted/escaped so
// commas, quotes and newlines in names can't break the columns. A leading BOM
// makes Excel open it as UTF-8.
function toCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [['Email', 'Name', 'Subscribed'].join(',')]
  for (const r of rows) {
    lines.push([esc(r.email), esc(r.name), esc(formatDate(r.created_at))].join(','))
  }
  // Prepend a UTF-8 BOM so Excel opens the file with correct encoding.
  return '﻿' + lines.join('\r\n')
}

function downloadCsv(rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hugs-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .listSubscribers()
      .then((r) => setSubscribers(r.subscribers || []))
      .catch(() => setSubscribers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return subscribers
    return subscribers.filter(
      (s) => (s.email || '').toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q),
    )
  }, [subscribers, query])

  return (
    <>
      <PageHeader
        title="Subscribers"
        subtitle="Everyone who signed up for the newsletter."
        actions={
          <Button variant="gold" onClick={() => downloadCsv(filtered)} disabled={!filtered.length}>
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        }
      />

      <Card className="mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-ink/60">
          <Mail className="h-4 w-4 text-gold" />
          <span>
            <strong className="text-ink">{subscribers.length}</strong> subscriber{subscribers.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email or name…"
            className="w-full rounded-lg border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-gold"
          />
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? 'No matches' : 'No subscribers yet'}
          hint={query ? 'Try a different search.' : 'Newsletter signups will appear here.'}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-offwhite text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filtered.map((s) => (
                  <tr key={s.id || s.email} className="hover:bg-offwhite/50">
                    <td className="px-5 py-3">
                      <a href={`mailto:${s.email}`} className="font-medium text-ink hover:text-plum">{s.email}</a>
                    </td>
                    <td className="px-5 py-3 text-ink/70">{s.name || <span className="text-ink/30">—</span>}</td>
                    <td className="px-5 py-3 text-ink/60">{formatDate(s.created_at)}</td>
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
