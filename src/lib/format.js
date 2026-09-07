export function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

export function formatNairaShort(amount) {
  const n = Number(amount) || 0
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
  return `₦${n}`
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  confirmed: 'bg-green-100 text-green-800', // legacy — payment success now marks bookings "completed"
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-200 text-gray-700',
  // Non-booking badges (property visibility, admin roles)
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-200 text-gray-700',
  superadmin: 'bg-purple-100 text-purple-800',
  admin: 'bg-gray-100 text-gray-700',
}
