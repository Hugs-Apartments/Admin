import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Listings from './pages/Listings.jsx'
import Bookings from './pages/Bookings.jsx'
import CancelBooking from './pages/CancelBooking.jsx'
import Availability from './pages/Availability.jsx'
import Payments from './pages/Payments.jsx'
import Discounts from './pages/Discounts.jsx'
import Feedback from './pages/Feedback.jsx'
import Subscribers from './pages/Subscribers.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="listings" element={<Listings />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="cancel" element={<CancelBooking />} />
            <Route path="availability" element={<Availability />} />
            <Route path="payments" element={<Payments />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="subscribers" element={<Subscribers />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
