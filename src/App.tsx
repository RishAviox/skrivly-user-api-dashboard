import './App.css'
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import ApiUsagePage from './pages/ApiUsagePage'
import BillingPage from './pages/BillingPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NotificationsPage from './pages/NotificationsPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import SettingsPage from './pages/SettingsPage'
import SignupPage from './pages/SignupPage'
import DocsPage from './pages/DocsPage'
import ProtectedRoute from './components/ProtectedRoute'
import CardSetupRequiredPage from './pages/CardSetupRequiredPage'

/**
 * Catches backend redirects to /developer-settings/billing?...
 * - session_id present → card setup flow (CardSetupRequiredPage processes it)
 * - canceled=true or anything else → redirect to /billing with the same params
 */
function DevSettingsBillingRedirect() {
  const [searchParams] = useSearchParams()

  // If this is a Stripe card setup callback, let CardSetupRequiredPage handle it
  if (searchParams.has('session_id')) {
    return <CardSetupRequiredPage />
  }

  // For everything else (canceled, enterprise redirects, etc.) forward to /billing
  const params = searchParams.toString()
  return <Navigate to={`/billing${params ? `?${params}` : ''}`} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="card-setup-required" element={<CardSetupRequiredPage />} />
      {/* Catch Stripe/backend redirects to /developer-settings/billing */}
      <Route path="developer-settings/billing" element={<DevSettingsBillingRedirect />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="usage" element={<ApiUsagePage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        {/* Payment success page (protected but without layout) */}
        <Route path="payment/success" element={<PaymentSuccessPage />} />
      </Route>
    </Routes>
  )
}
