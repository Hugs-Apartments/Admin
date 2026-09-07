import { Loader2 } from 'lucide-react'
import { STATUS_STYLES } from '../lib/format.js'

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50'
const btnSizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2', lg: 'px-6 py-3' }
const btnVariants = {
  primary: 'bg-plum text-white hover:bg-plum-dark',
  gold: 'bg-gold text-plum hover:bg-champagne',
  outline: 'border border-ink/20 text-ink hover:border-plum hover:text-plum',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-ink/60 hover:bg-ink/5 hover:text-ink',
}

export function Button({ variant = 'primary', size = 'md', loading, className = '', children, ...props }) {
  return (
    <button className={`${btnBase} ${btnSizes[size]} ${btnVariants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Card({ className = '', children }) {
  return (
    <div className={`rounded-xl border-t-2 border-gold bg-white shadow-sm ${className}`}>{children}</div>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        <span className="gold-rule mt-2 block" />
        {subtitle && <p className="mt-2 text-sm text-ink/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ink/50">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  )
}

export function EmptyState({ title, hint }) {
  return (
    <div className="rounded-xl border border-dashed border-ink/20 bg-white p-12 text-center">
      <p className="font-serif text-lg text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink/50">{hint}</p>}
    </div>
  )
}

// Confirmation modal for destructive actions.
export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, loading, danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="font-serif text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

// Generic modal shell.
export function Modal({ open, title, onClose, children, wide = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-xl bg-white p-6 shadow-2xl`}>
        <h3 className="font-serif text-xl font-semibold text-ink">{title}</h3>
        <span className="gold-rule mt-2 block" />
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/50">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold'
