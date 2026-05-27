import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ApiService } from '../services/api'
import { addNotification } from '../notifications/notifications'
import { STORAGE_KEYS } from '../config/env'
import skrivlyLogoFull from '../assets/skrivly logo.svg'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState<string>('Processing your payment method...')
  const [isEnterprise, setIsEnterprise] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Always clear card setup pending flag — if we reached this page, Stripe completed
    localStorage.removeItem(STORAGE_KEYS.CARD_SETUP_PENDING)

    const sessionId = searchParams.get('session_id')
    const tokenId = searchParams.get('token_id')
    const planId = searchParams.get('plan_id')
    const upgrade = searchParams.get('upgrade')
    const processed = searchParams.get('processed')
    const hasStripeCustomer = searchParams.get('has_stripe_customer') === 'true'

    // Check if this is an enterprise plan payment
    if (upgrade === 'enterprise' && sessionId && tokenId && planId) {
      setIsEnterprise(true)
      console.log('Enterprise plan payment success detected:', { sessionId, tokenId, planId })

      async function handleEnterprisePaymentSuccess() {
        if (!sessionId || !tokenId || !planId) {
          setStatus('error')
          setMessage('Missing payment information. Please try again.')
          setTimeout(() => {
            navigate('/billing')
          }, 3000)
          return
        }

        try {
          setStatus('processing')
          setMessage('Processing your enterprise plan purchase...')

          const response = await ApiService.verifyEnterprisePlanPayment({
            sessionId,
            tokenId,
            planId,
          })

          if (response.status === 'success') {
            console.log('Enterprise plan activated successfully!', response.data)
            setStatus('success')
            setMessage('Your enterprise plan has been activated!')

            addNotification({
              type: 'system',
              title: 'Enterprise Plan Activated',
              message: 'Enterprise plan activated successfully! You now have access to all enterprise features.',
              createdAt: Date.now(),
              read: false,
            })
          } else {
            console.warn('Payment verification response:', response)
            setStatus('error')
            setMessage('Payment verification failed. Please check your billing page.')
            setTimeout(() => {
              navigate('/billing')
            }, 3000)
          }
        } catch (err) {
          console.error('Error verifying enterprise plan payment:', err)
          setStatus('error')
          setMessage('Failed to verify payment. Please check your billing page.')
          setTimeout(() => {
            navigate('/billing')
          }, 3000)
        }
      }

      handleEnterprisePaymentSuccess()
      return
    }

    // Regular payment setup flow
    if (!sessionId || processed !== 'true') {
      // Not a valid redirect from backend
      setStatus('error')
      setMessage('Invalid payment setup redirect. Please try again.')
      setTimeout(() => {
        navigate('/billing')
      }, 3000)
      return
    }

    if (hasStripeCustomer) {
      localStorage.removeItem(STORAGE_KEYS.CARD_SETUP_PENDING)
      setStatus('success')
      setMessage('Payment method saved successfully!')

      addNotification({
        type: 'system',
        title: 'Payment Method Added',
        message: 'Your payment method has been successfully added.',
        createdAt: Date.now(),
        read: false,
      })

      setTimeout(() => {
        navigate('/billing')
      }, 2000)
    } else {
      setStatus('processing')
      setMessage('Payment setup is processing. Please wait...')

      async function processPaymentSetup() {
        if (!sessionId) {
          setStatus('error')
          setMessage('Missing session ID. Please try again.')
          setTimeout(() => {
            navigate('/billing')
          }, 3000)
          return
        }

        try {
          const response = await ApiService.processPaymentSetup(sessionId)
          if (response.status === 'success' && response.data?.is_setup_complete) {
            localStorage.removeItem(STORAGE_KEYS.CARD_SETUP_PENDING)
            setStatus('success')
            setMessage('Payment method saved successfully!')
            addNotification({
              type: 'system',
              title: 'Payment Method Added',
              message: `Payment method •••• ${response.data.payment_method?.last4 || ''} has been successfully added.`,
              createdAt: Date.now(),
              read: false,
            })
            setTimeout(() => {
              navigate('/billing')
            }, 2000)
          } else {
            setStatus('error')
            setMessage('Payment setup is still processing. Please check your billing page in a few moments.')
            setTimeout(() => {
              navigate('/billing')
            }, 3000)
          }
        } catch (err) {
          console.error('Error processing payment setup:', err)
          setStatus('error')
          setMessage('Failed to process payment setup. Please check your billing page.')
          setTimeout(() => {
            navigate('/billing')
          }, 3000)
        }
      }

      processPaymentSetup()
    }
  }, [searchParams, navigate])

  // Countdown timer for enterprise success — redirect to dashboard
  useEffect(() => {
    if (!(isEnterprise && status === 'success')) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isEnterprise, status, navigate])

  // Enterprise success page
  if (isEnterprise && status === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ maxWidth: '560px', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
            animation: 'successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 0.5rem',
            letterSpacing: '-0.02em',
          }}>
            Payment Successful!
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0 0 2rem',
            lineHeight: 1.5,
          }}>
            Your Enterprise Plan is now active. You have access to all premium features.
          </p>

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
          }}>
            <p style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#166534',
              margin: '0 0 0.75rem',
            }}>
              What you now have access to:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                'API Key Generation & Management',
                'Advanced API Usage Analytics',
                'Priority Support',
                'Custom Rate Limits',
                'Full API Access',
              ].map(feature => (
                <div key={feature} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '14px',
                  color: '#15803d',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="primary-button primary-button-purple"
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              color: 'white',
              background: '#7065f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </button>

          <p style={{
            fontSize: '13px',
            color: '#9ca3af',
            marginTop: '1rem',
          }}>
            Redirecting to dashboard in {countdown}s...
          </p>

          <style>{`
            @keyframes successPop {
              0% { transform: scale(0); opacity: 0; }
              60% { transform: scale(1.1); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Enterprise processing page
  if (isEnterprise && status === 'processing') {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ maxWidth: '560px', textAlign: 'center' }}>
          <img src={skrivlyLogoFull} alt="Skrivly" className="auth-logo" />
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 0.5rem',
          }}>
            Processing Your Payment
          </h1>
          <p style={{ color: '#6b7280', margin: '0 0 2rem' }}>{message}</p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '1.5rem',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#7065f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Please do not close this page...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Default (non-enterprise) states
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <img src={skrivlyLogoFull} alt="Skrivly" className="auth-logo" />
          <h1>Payment Setup</h1>
          <p>{message}</p>
        </div>

        {status === 'processing' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#7065f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <p style={{ color: '#6b7280' }}>Please wait while we process your payment method...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ color: '#10b981', fontWeight: 500 }}>Payment method saved successfully!</p>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '0.5rem' }}>
              Redirecting to billing page...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p style={{ color: '#ef4444', fontWeight: 500 }}>{message}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '0.5rem' }}>
              Redirecting to billing page...
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/billing')}
          >
            Go to Billing Page
          </button>
        </div>
      </div>
    </div>
  )
}

