import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/icons'
import { ApiService, setDeveloperJWT } from '../services/api'
import { STORAGE_KEYS } from '../config/env'
import skrivlyLogoFull from '../assets/skrivly logo.svg'

export default function SignupPage() {
  const navigate = useNavigate()
  const RESEND_SECONDS = 50

  // Redirect if already logged in
  useEffect(() => {
    const developerJWT = localStorage.getItem(STORAGE_KEYS.DEVELOPER_JWT)
    if (developerJWT) {
      navigate('/', { replace: true })
    }
  }, [navigate])
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const id = setTimeout(() => setResendTimer((t) => t - 1), 1000)
      return () => clearTimeout(id)
    }
  }, [step, resendTimer])

  async function sendOTP() {
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      const response = await ApiService.signupSendOTP(email.trim())

      if (response.status === 'success') {
        setSuccessMessage(response.message || 'OTP sent to your email')
        setStep('otp')
        setResendTimer(RESEND_SECONDS)
      } else {
        setError(response.message || 'Failed to send OTP')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    await sendOTP()
  }

  async function handleResendOTP() {
    if (loading || resendTimer > 0) return
    await sendOTP()
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      const response = await ApiService.signupVerifyOTP(email.trim(), otpCode.trim())

      if (response.status === 'success') {
        setSuccessMessage('OTP verified successfully')
        setStep('password')
      } else {
        setError(response.message || 'Failed to verify OTP')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      const response = await ApiService.signupCreateAccount({
        email: email.trim(),
        password: password.trim(),
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      })

      if (response.status === 'success' && response.data) {
        // Store the developer JWT token
        if (response.data.user_details?.access_token) {
          setDeveloperJWT(response.data.user_details.access_token)

          // Handle payment setup if required - check for payment_setup_url directly
          if (response.data.payment_setup_url) {
            console.log('Payment setup required, redirecting to:', response.data.payment_setup_url)
            // Mark card setup as pending so ProtectedRoute blocks access until complete
            localStorage.setItem(STORAGE_KEYS.CARD_SETUP_PENDING, 'true')
            // Redirect to payment setup
            window.location.href = response.data.payment_setup_url
            return
          }

          // Success - redirect to dashboard
          navigate('/')
        } else {
          setError('Account created but no token received')
        }
      } else {
        setError(response.message || 'Failed to create account')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    if (step === 'otp') {
      setStep('email')
      setOtpCode('')
    } else if (step === 'password') {
      setStep('otp')
      setPassword('')
      setConfirmPassword('')
    }
    setError(null)
    setSuccessMessage(null)
    setResendTimer(0)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <img src={skrivlyLogoFull} alt="Skrivly" className="auth-logo" />
          <h1>Create your account</h1>
          <p>Sign up for a developer account</p>
        </div>

        {error && (
          <div className="auth-error">
            <Icon name="alert" size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-success">
            <Icon name="check" size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="auth-form">
            <div className="field">
              <label className="field-label">Email address</label>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <Icon name="mail" size={18} />
                </span>
                <input
                  type="email"
                  className="input"
                  placeholder="developer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="primary-button primary-button-purple auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>

            <p className="auth-footer">
              Already have an account?{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => navigate('/login')}
              >
                Sign in
              </button>
            </p>
          </form>
        ) : step === 'otp' ? (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <div className="field">
              <label className="field-label">Enter OTP code</label>
              <p className="field-hint">We sent a 6-digit code to {email}</p>
              <p className="field-hint">
                {resendTimer > 0 ? (
                  <>Send code again ({Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')})</>
                ) : (
                  <button
                    type="button"
                    className="link-button"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    Send code again
                  </button>
                )}
              </p>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <Icon name="key" size={18} />
                </span>
                <input
                  type="text"
                  className="input"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtpCode(value)
                  }}
                  disabled={loading}
                  required
                  autoFocus
                  maxLength={6}
                />
              </div>
            </div>

            <button type="submit" className="primary-button primary-button-purple auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              className="link-button auth-back"
              onClick={handleBack}
              disabled={loading}
            >
              ← Back to email
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateAccount} className="auth-form">
            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">First Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="field">
                <label className="field-label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <Icon name="lock" size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input input-right-icon"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="input-right-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'eye' : 'eyeOff'} size={18} />
                </button>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Confirm Password</label>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <Icon name="lock" size={18} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input input-right-icon"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="input-right-btn"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon name={showConfirmPassword ? 'eye' : 'eyeOff'} size={18} />
                </button>
              </div>
            </div>

            <button type="submit" className="primary-button primary-button-purple auth-submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>

            <button
              type="button"
              className="link-button auth-back"
              onClick={handleBack}
              disabled={loading}
            >
              ← Back to OTP
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

