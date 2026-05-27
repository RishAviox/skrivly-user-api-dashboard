import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { STORAGE_KEYS } from '../config/env'

export default function ProtectedRoute() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const developerJWT = localStorage.getItem(STORAGE_KEYS.DEVELOPER_JWT)

  if (!developerJWT) {
    return <Navigate to="/login" replace />
  }

  // If the user has a JWT but hasn't completed card setup, block dashboard access
  const cardSetupPending = localStorage.getItem(STORAGE_KEYS.CARD_SETUP_PENDING)

  if (cardSetupPending === 'true') {
    // Allow payment success page
    const isPaymentSuccessRoute = location.pathname.startsWith('/payment/success')
    // Allow billing page when returning from Stripe (has session_id param)
    const isStripeCallback = location.pathname.startsWith('/billing') && searchParams.has('session_id')

    if (!isPaymentSuccessRoute && !isStripeCallback) {
      return <Navigate to="/card-setup-required" replace />
    }
  }

  return <Outlet />
}
