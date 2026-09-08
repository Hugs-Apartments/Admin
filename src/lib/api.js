// API client for the Hugs backend.
//
// The admin dashboard is 100% backend-driven — every screen reads and writes
// through the real API at VITE_API_URL. There is no mock/offline fallback:
// without VITE_API_URL the client throws a clear error so the UI shows a proper
// state instead of silently faking data. No Supabase keys or Paystack secrets
// ever live in the admin; it holds only a short-lived admin JWT that the backend
// issues on login.

const API_URL = import.meta.env.VITE_API_URL || ''

const TOKEN_KEY = 'hugs_admin_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request(path, { method = 'GET', body, auth = true } = {}) {
  if (!API_URL) {
    throw new Error('The dashboard is not configured (missing VITE_API_URL).')
  }
  const headers = { 'Content-Type': 'application/json' }
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    err.details = data.details
    throw err
  }
  return data
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/api/auth/admin/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/api/auth/admin/me'),

  // Stats
  overview: () => request('/api/stats/overview'),
  revenue: (days = 30) => request(`/api/stats/revenue?days=${days}`),

  // Properties — ?all=true returns inactive listings too (admin only).
  listProperties: () => request('/api/properties?all=true'),
  getProperty: (id) => request(`/api/properties/${id}`),
  createProperty: (body) => request('/api/properties', { method: 'POST', body }),
  updateProperty: (id, body) => request(`/api/properties/${id}`, { method: 'PUT', body }),
  deleteProperty: (id) => request(`/api/properties/${id}`, { method: 'DELETE' }),

  // Availability / blocks
  getAvailability: (id) => request(`/api/properties/${id}/availability`, { auth: false }),
  listBlocks: (id) => request(`/api/properties/${id}/blocks`),
  createBlock: (id, body) => request(`/api/properties/${id}/blocks`, { method: 'POST', body }),
  deleteBlock: (id, blockId) => request(`/api/properties/${id}/blocks/${blockId}`, { method: 'DELETE' }),

  // Bookings — admin sees all; the only status change is cancellation.
  listBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/bookings${qs ? `?${qs}` : ''}`)
  },
  getBooking: (id) => request(`/api/bookings/${id}`),
  getBookingByReference: (reference) =>
    request(`/api/bookings/reference/${encodeURIComponent(reference)}`, { auth: false }),
  updateBookingStatus: (id, status) =>
    request(`/api/bookings/${id}/status`, { method: 'PATCH', body: { status } }),

  // Discounts / promo codes
  listDiscounts: () => request('/api/discounts'),
  createDiscount: (body) => request('/api/discounts', { method: 'POST', body }),
  updateDiscount: (id, body) => request(`/api/discounts/${id}`, { method: 'PATCH', body }),
  deleteDiscount: (id) => request(`/api/discounts/${id}`, { method: 'DELETE' }),

  // Feedback (read-only for admins)
  listFeedback: () => request('/api/feedback'),

  // Payments
  listPayments: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/payments${qs ? `?${qs}` : ''}`)
  },
  getReceipt: (bookingId) => request(`/api/payments/receipt/${bookingId}`),

  // Admin accounts (superadmin only)
  listAdmins: () => request('/api/auth/admin'),
  createAdmin: (body) => request('/api/auth/admin', { method: 'POST', body }),
  deleteAdmin: (id) => request(`/api/auth/admin/${id}`, { method: 'DELETE' }),

  // Subscribers (newsletter list)
  listSubscribers: () => request('/api/subscribe'),
}
