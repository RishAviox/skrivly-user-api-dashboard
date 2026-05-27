import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { STORAGE_KEYS } from '../config/env'
import { ApiService } from '../services/api'
import skrivlyLogoFull from '../assets/skrivly logo.svg'

type PageState = 'checking' | 'setup-required' | 'processing' | 'success' | 'error'

/**
 * CardSetupRequiredPage
 *
 * Shown when a user has authenticated (JWT exists) but has not yet completed
 * Stripe card setup. On mount it checks whether card setup was already completed
 * (e.g. user returned from Stripe but the flag wasn't cleared). If so, it shows
 * a success state. Otherwise it prompts the user to enter payment details or go back.
 */
export default function CardSetupRequiredPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [pageState, setPageState] = useState<PageState>('checking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // On mount: check if Stripe callback params are present, or verify with backend
  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    async function processStripeReturn() {
      if (!sessionId) return false

      try {
        setPageState('processing')
        const response = await ApiService.processPaymentSetup(sessionId)

        if (response.status === 'success' && response.data?.is_setup_complete) {
          localStorage.removeItem(STORAGE_KEYS.CARD_SETUP_PENDING)
          setPageState('success')
          return true
        }
      } catch {
        // Fall through to billing check
      }
      return false
    }

    async function checkBillingStatus() {
      try {
        const response = await ApiService.getCurrentMonthBilling()

        if (
          response.status === 'success' &&
          response.data?.developer_account?.has_stripe_customer
        ) {
          // Card is already set up — clear the flag
          localStorage.removeItem(STORAGE_KEYS.CARD_SETUP_PENDING)
          setPageState('success')
          return true
        }
      } catch {
        // Ignore — show setup required
      }
      return false
    }

    async function init() {
      // First try processing Stripe session if present
      if (sessionId) {
        const processed = await processStripeReturn()
        if (processed) return
      }

      // Otherwise check if card is already on file
      const hasCard = await checkBillingStatus()
      if (hasCard) return

      // Card setup is genuinely needed
      setPageState('setup-required')
    }

    init()
  }, [searchParams])

  async function handleEnterPaymentDetails() {
    try {
      setLoading(true)
      setError(null)

      const response = await ApiService.updatePaymentMethod()

      if (response.status === 'success' && response.data?.payment_setup_url) {
        window.location.href = response.data.payment_setup_url
      } else {
        setError(response.message || 'Unable to get payment setup link. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleGoBack() {
    localStorage.removeItem(STORAGE_KEYS.DEVELOPER_JWT)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.CARD_SETUP_PENDING)
    navigate('/login', { replace: true })
  }

  function handleGoToDashboard() {
    navigate('/', { replace: true })
  }

  // Loading / checking state
  if (pageState === 'checking' || pageState === 'processing') {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <img src={skrivlyLogoFull} alt="Skrivly" className="auth-logo" />
          <h1>{pageState === 'processing' ? 'Processing Payment' : 'Verifying...'}</h1>
          <p style={{ color: '#9ca3af' }}>
            {pageState === 'processing'
              ? 'Processing your payment details, please wait...'
              : 'Checking your payment status...'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255,255,255,0.1)',
                borderTopColor: '#7065f6',
                borderRadius: '50%',
                animation: 'cardSpinner 0.8s linear infinite',
              }}
            />
          </div>
          <style>{`
            @keyframes cardSpinner {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Success state — card details are on file
  if (pageState === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1>Payment Details Saved</h1>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
            Your card details have been saved successfully. You can now access the dashboard.
          </p>

          <button
            type="button"
            className="primary-button primary-button-purple auth-submit"
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Setup required state — prompt user to enter card details
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <img src={skrivlyLogoFull} alt="Skrivly" className="auth-logo" />
          <h1>Payment Setup Required</h1>
          <p>
            A payment method is required to access the dashboard. Please add your
            card details to continue.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '0.75rem',
            padding: '1.25rem 1.5rem',
            marginTop: '1.25rem',
            fontSize: '14px',
            color: '#a5b4fc',
            lineHeight: 1.6,
          }}
        >
          Your card will not be charged until you select a paid plan. We require a
          payment method on file to get started.
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              marginTop: '1rem',
              fontSize: '14px',
              color: '#fca5a5',
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="primary-button primary-button-purple auth-submit"
            onClick={handleEnterPaymentDetails}
            disabled={loading}
          >
            {loading ? 'Redirecting...' : 'Enter payment details'}
          </button>

          <button
            type="button"
            className="primary-button auth-submit"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#9ca3af',
            }}
            onClick={handleGoBack}
            disabled={loading}
          >
            Go back to login
          </button>
        </div>
      </div>
    </div>
  )
}
