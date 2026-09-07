// API client for the Hugs backend.
//
// If VITE_API_URL is set, it talks to the real backend. Otherwise it falls
// back to an in-memory MOCK so the dashboard is fully clickable standalone
// (the backend build lives in ../Backend). Swap by setting VITE_API_URL.

import { mockApi } from './mockApi.js'

const API_URL = import.meta.env.VITE_API_URL || ''
export const USING_MOCK = !API_URL

const TOKEN_KEY = 'hugs_admin_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request(path, { method = 'GET', body, auth = true } = {}) {
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

// Each method delegates to the mock when no API_URL is configured.
export const api = {
  // Auth
  login: (email, password) =>
    USING_MOCK ? mockApi.login(email, password) : request('/api/auth/admin/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => (USING_MOCK ? mockApi.me() : request('/api/auth/admin/me')),

  // Stats
  overview: () => (USING_MOCK ? mockApi.overview() : request('/api/stats/overview')),
  revenue: (days = 30) => (USING_MOCK ? mockApi.revenue(days) : request(`/api/stats/revenue?days=${days}`)),

  // Properties
  listProperties: () => (USING_MOCK ? mockApi.listProperties() : request('/api/properties?all=true')),
  getProperty: (id) => (USING_MOCK ? mockApi.getProperty(id) : request(`/api/properties/${id}`)),
  createProperty: (body) => (USING_MOCK ? mockApi.createProperty(body) : request('/api/properties', { method: 'POST', body })),
  updateProperty: (id, body) => (USING_MOCK ? mockApi.updateProperty(id, body) : request(`/api/properties/${id}`, { method: 'PUT', body })),
  deleteProperty: (id) => (USING_MOCK ? mockApi.deleteProperty(id) : request(`/api/properties/${id}`, { method: 'DELETE' })),

  // Availability / blocks
  getAvailability: (id) => (USING_MOCK ? mockApi.getAvailability(id) : request(`/api/properties/${id}/availability`, { auth: false })),
  listBlocks: (id) => (USING_MOCK ? mockApi.listBlocks(id) : request(`/api/properties/${id}/blocks`)),
  createBlock: (id, body) => (USING_MOCK ? mockApi.createBlock(id, body) : request(`/api/properties/${id}/blocks`, { method: 'POST', body })),
  deleteBlock: (id, blockId) => (USING_MOCK ? mockApi.deleteBlock(id, blockId) : request(`/api/properties/${id}/blocks/${blockId}`, { method: 'DELETE' })),

  // Bookings
  listBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return USING_MOCK ? mockApi.listBookings(params) : request(`/api/bookings${qs ? `?${qs}` : ''}`)
  },
  getBooking: (id) => (USING_MOCK ? mockApi.getBooking(id) : request(`/api/bookings/${id}`)),
  updateBookingStatus: (id, status) =>
    USING_MOCK ? mockApi.updateBookingStatus(id, status) : request(`/api/bookings/${id}/status`, { method: 'PATCH', body: { status } }),

  // Payments
  listPayments: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return USING_MOCK ? mockApi.listPayments(params) : request(`/api/payments${qs ? `?${qs}` : ''}`)
  },
  getReceipt: (bookingId) => (USING_MOCK ? mockApi.getReceipt(bookingId) : request(`/api/payments/receipt/${bookingId}`)),

  // Admins
  listAdmins: () => (USING_MOCK ? mockApi.listAdmins() : request('/api/auth/admin')),
  createAdmin: (body) => (USING_MOCK ? mockApi.createAdmin(body) : request('/api/auth/admin', { method: 'POST', body })),
  deleteAdmin: (id) => (USING_MOCK ? mockApi.deleteAdmin(id) : request(`/api/auth/admin/${id}`, { method: 'DELETE' })),

  // Subscribers (newsletter list)
  listSubscribers: () => (USING_MOCK ? mockApi.listSubscribers() : request('/api/subscribe')),
}
