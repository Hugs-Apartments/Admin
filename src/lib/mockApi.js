// In-memory mock backend for the admin dashboard, so it runs standalone.
// Mirrors the shape of the real API responses in ../Backend. Data resets on
// page reload. Set VITE_API_URL to talk to the real backend instead.

const CORE = ['24/7 Security', 'Power Supply', 'High-Speed WiFi', 'Ample Parking', 'Clean Water Supply']
const img = (s) => `https://picsum.photos/seed/${s}/1200/800`
const uid = () => Math.random().toString(36).slice(2, 10)
const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms))

const daysFromNow = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
const isoDaysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// ---- Seed data ------------------------------------------------------------
let properties = [
  { id: uid(), name: 'The Plum Suite', type: 'Studio', area: 'Mende', location: 'Maryland, Lagos', price_per_night: 85000, max_guests: 2, rating: 4.9, review_count: 128, amenities: [...CORE, 'Smart TV', 'Kitchenette'], images: [img('hugs1a'), img('hugs1b')], description: 'A warm, light-filled studio for couples and solo travellers.', is_active: true, created_at: isoDaysAgo(40) },
  { id: uid(), name: 'Champagne One-Bedroom', type: '1-Bedroom', area: 'Mende', location: 'Maryland, Lagos', price_per_night: 120000, max_guests: 3, rating: 4.8, review_count: 96, amenities: [...CORE, 'Full Kitchen', 'Workspace'], images: [img('hugs2a'), img('hugs2b')], description: 'An elegant one-bedroom retreat with a full kitchen and workspace.', is_active: true, created_at: isoDaysAgo(35) },
  { id: uid(), name: 'The Gold Two-Bedroom', type: '2-Bedroom', area: 'Anthony', location: 'Maryland, Lagos', price_per_night: 180000, max_guests: 5, rating: 5.0, review_count: 74, amenities: [...CORE, 'Full Kitchen', 'Washer', 'Balcony'], images: [img('hugs3a'), img('hugs3b')], description: 'Spacious two-bedroom apartment with a private balcony.', is_active: true, created_at: isoDaysAgo(30) },
  { id: uid(), name: 'Maryland Penthouse', type: 'Penthouse', area: 'Ikorodu Road', location: 'Maryland, Lagos', price_per_night: 350000, max_guests: 6, rating: 5.0, review_count: 52, amenities: [...CORE, 'City View', 'Concierge'], images: [img('hugs4a'), img('hugs4b')], description: 'Our signature penthouse with floor-to-ceiling views.', is_active: true, created_at: isoDaysAgo(25) },
  { id: uid(), name: 'The Velvet Studio', type: 'Studio', area: 'Mende', location: 'Maryland, Lagos', price_per_night: 78000, max_guests: 2, rating: 4.7, review_count: 141, amenities: [...CORE, 'Kitchenette'], images: [img('hugs5a')], description: 'Cosy and refined, with a soft-glow palette.', is_active: false, created_at: isoDaysAgo(20) },
]

const GUESTS = ['Adaeze Okafor', 'Tunde Adeyemi', 'Chioma Nwosu', 'Fatima Bello', 'Emeka Obi', 'Ngozi Eze', 'Bola Ahmed', 'Ifeoma Uche']
// A booking is `pending` until payment succeeds (then `completed`), or
// `cancelled` at the customer's request. There is no manual "confirmed" step —
// successful payment is what confirms a booking.
const STATUSES = ['pending', 'completed', 'cancelled']

let bookings = Array.from({ length: 24 }).map((_, i) => {
  const p = properties[i % properties.length]
  const inDays = -20 + i * 2
  const nights = 2 + (i % 4)
  const subtotal = p.price_per_night * nights
  const service_fee = Math.round(subtotal * 0.05)
  const status = STATUSES[i % STATUSES.length]
  const paid = status === 'completed'
  return {
    id: uid(),
    reference: `HUGS-2026-${uid().slice(0, 6).toUpperCase()}`,
    property_id: p.id,
    property: { name: p.name, type: p.type },
    guest_name: GUESTS[i % GUESTS.length],
    guest_email: `${GUESTS[i % GUESTS.length].split(' ')[0].toLowerCase()}@example.com`,
    guest_phone: '+234 80' + (10000000 + i * 137).toString().slice(0, 8),
    check_in: daysFromNow(inDays),
    check_out: daysFromNow(inDays + nights),
    guests: 1 + (i % 4),
    nights,
    subtotal,
    service_fee,
    total_amount: subtotal + service_fee,
    status,
    payment_status: paid ? 'success' : status === 'cancelled' ? 'refunded' : 'pending',
    created_at: isoDaysAgo(20 - Math.floor(i / 2)),
    notes: i % 5 === 0 ? 'Early check-in requested.' : null,
  }
})

let payments = bookings
  .filter((b) => b.payment_status === 'success')
  .map((b) => ({
    id: uid(),
    booking_id: b.id,
    booking: { reference: b.reference, guest_name: b.guest_name },
    provider: 'paystack',
    reference: b.reference,
    amount: b.total_amount,
    status: 'success',
    created_at: b.created_at,
  }))

let blocks = {} // propertyId -> [{id, start_date, end_date, reason}]

let admins = [
  { id: uid(), email: 'admin@hugsapartments.ng', name: 'Hugs Admin', role: 'superadmin', created_at: isoDaysAgo(60) },
]

// ---- Mock API surface -----------------------------------------------------
export const mockApi = {
  async login(email, password) {
    await delay()
    if (!email || !password) throw new Error('Invalid credentials.')
    return { token: 'mock-token', admin: { id: admins[0].id, email, name: 'Hugs Admin', role: 'superadmin' } }
  },
  async me() {
    await delay(80)
    return { admin: { ...admins[0], type: 'admin', sub: admins[0].id } }
  },

  async overview() {
    await delay()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthBookings = bookings.filter((b) => new Date(b.created_at) >= monthStart)
    const revenue = monthBookings.filter((b) => b.payment_status === 'success').reduce((s, b) => s + b.total_amount, 0)
    const upcoming = bookings
      .filter((b) => b.status === 'completed' && b.check_in >= daysFromNow(0))
      .sort((a, b) => a.check_in.localeCompare(b.check_in))
      .slice(0, 10)
    return {
      metrics: {
        bookings_this_month: monthBookings.length,
        revenue_this_month: revenue,
        active_properties: properties.filter((p) => p.is_active).length,
        upcoming_count: upcoming.length,
      },
      upcoming_checkins: upcoming,
      recent_bookings: [...bookings].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10),
    }
  },
  async revenue(days = 30) {
    await delay()
    const series = []
    for (let i = days - 1; i >= 0; i--) {
      const date = daysFromNow(-i)
      const revenue = bookings
        .filter((b) => b.payment_status === 'success' && b.created_at.slice(0, 10) === date)
        .reduce((s, b) => s + b.total_amount, 0)
      // Add a little baseline so the chart looks alive in the mock.
      series.push({ date, revenue: revenue || Math.round(Math.random() * 180000) })
    }
    return { series }
  },

  async listProperties() {
    await delay()
    return { properties: [...properties].sort((a, b) => b.created_at.localeCompare(a.created_at)) }
  },
  async getProperty(id) {
    await delay()
    const property = properties.find((p) => p.id === id)
    if (!property) throw new Error('Property not found.')
    return { property }
  },
  async createProperty(body) {
    await delay()
    const property = { id: uid(), rating: 5.0, review_count: 0, location: 'Maryland, Lagos', is_active: true, amenities: [], images: [], created_at: new Date().toISOString(), ...body }
    properties.unshift(property)
    return { property }
  },
  async updateProperty(id, body) {
    await delay()
    properties = properties.map((p) => (p.id === id ? { ...p, ...body } : p))
    return { property: properties.find((p) => p.id === id) }
  },
  async deleteProperty(id) {
    await delay()
    const active = bookings.some((b) => b.property_id === id && ['pending', 'completed'].includes(b.status))
    if (active) throw new Error('Cannot delete: this property has active bookings. Deactivate it instead.')
    properties = properties.filter((p) => p.id !== id)
    return { ok: true }
  },

  async getAvailability(id) {
    await delay()
    const occupied = bookings
      .filter((b) => b.property_id === id && ['pending', 'completed'].includes(b.status))
      .map((b) => ({ start: b.check_in, end: b.check_out }))
    ;(blocks[id] || []).forEach((bl) => occupied.push({ start: bl.start_date, end: bl.end_date }))
    return { property_id: id, occupied }
  },
  async listBlocks(id) {
    await delay()
    return { blocks: blocks[id] || [] }
  },
  async createBlock(id, body) {
    await delay()
    const block = { id: uid(), property_id: id, ...body }
    blocks[id] = [...(blocks[id] || []), block]
    return { block }
  },
  async deleteBlock(id, blockId) {
    await delay()
    blocks[id] = (blocks[id] || []).filter((b) => b.id !== blockId)
    return { ok: true }
  },

  async listBookings(params = {}) {
    await delay()
    let out = [...bookings]
    if (params.status) out = out.filter((b) => b.status === params.status)
    if (params.payment_status) out = out.filter((b) => b.payment_status === params.payment_status)
    if (params.property_id) out = out.filter((b) => b.property_id === params.property_id)
    out.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return { bookings: out }
  },
  async getBooking(id) {
    await delay()
    const b = bookings.find((x) => x.id === id)
    if (!b) throw new Error('Booking not found.')
    const property = properties.find((p) => p.id === b.property_id)
    return { booking: { ...b, property, payments: payments.filter((p) => p.booking_id === id) } }
  },
  async updateBookingStatus(id, status) {
    await delay()
    bookings = bookings.map((b) => (b.id === id ? { ...b, status } : b))
    return { booking: bookings.find((b) => b.id === id) }
  },

  async listPayments(params = {}) {
    await delay()
    let out = [...payments]
    if (params.status) out = out.filter((p) => p.status === params.status)
    out.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return { payments: out }
  },
  async getReceipt(bookingId) {
    await delay()
    const b = bookings.find((x) => x.id === bookingId)
    if (!b) throw new Error('Booking not found.')
    const property = properties.find((p) => p.id === b.property_id)
    return {
      receipt: {
        reference: b.reference,
        issued_at: new Date().toISOString(),
        guest: { name: b.guest_name, email: b.guest_email },
        property: { name: property?.name, type: property?.type },
        stay: { check_in: b.check_in, check_out: b.check_out, nights: b.nights, guests: b.guests },
        charges: { subtotal: b.subtotal, service_fee: b.service_fee, total: b.total_amount, currency: 'NGN' },
        status: b.status,
      },
    }
  },

  async listAdmins() {
    await delay()
    return { admins: [...admins] }
  },
  async createAdmin(body) {
    await delay()
    const admin = { id: uid(), created_at: new Date().toISOString(), role: 'admin', ...body }
    delete admin.password
    admins.push(admin)
    return { admin }
  },
  async deleteAdmin(id) {
    await delay()
    admins = admins.filter((a) => a.id !== id)
    return { ok: true }
  },
}
