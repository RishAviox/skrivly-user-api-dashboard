import { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/icons'
import { ApiService } from '../services/api'
import { STORAGE_KEYS } from '../config/env'
import type { Invoice, CurrentMonthBilling, EnterprisePlanStatus } from '../types/api'
import { addNotification } from '../notifications/notifications'

export default function BillingPage() {
  const PAGE_SIZE = 16
  const [page, setPage] = useState(1)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [currentMonth, setCurrentMonth] = useState<CurrentMonthBilling | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [enterprisePlan, setEnterprisePlan] = useState<EnterprisePlanStatus | null>(null)
  const [enterprisePlanLoading, setEnterprisePlanLoading] = useState(true)
  const [isPurchasingEnterprise, setIsPurchasingEnterprise] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigateToPay = useNavigate()
  const isProcessingPaymentRef = useRef(false)

  // Extract query parameters (used throughout component)
  const sessionId = searchParams.get('session_id')
  const tokenId = searchParams.get('token_id')
  const planId = searchParams.get('plan_id')
  const upgrade = searchParams.get('upgrade')

  // If this is an enterprise plan payment redirect from Stripe, forward to the success page
  useEffect(() => {
    if (upgrade === 'enterprise' && sessionId && tokenId && planId) {
      const params = new URLSearchParams({
        session_id: sessionId,
        token_id: tokenId,
        plan_id: planId,
        upgrade: 'enterprise',
      })
      navigateToPay(`/payment/success?${params.toString()}`, { replace: true })
      return
    }
  }, [upgrade, sessionId, tokenId, planId, navigateToPay])

  // Check for regular payment setup redirect (non-enterprise)
  useEffect(() => {
    // Skip if this is an enterprise redirect (handled above)
    if (upgrade === 'enterprise') return

    // Check for regular payment setup redirect
    if (sessionId && !upgrade) {
      console.log('Stripe checkout session detected (payment setup):', sessionId)

      async function processPaymentSetup() {
        if (!sessionId) return

        try {
          setLoading(true)
          setError(null)
          console.log('Processing payment setup for session:', sessionId)

          const response = await ApiService.processPaymentSetup(sessionId)

          if (response.status === 'success' && response.data) {
            if (response.data.is_setup_complete) {
              console.log('✅ Payment setup completed successfully!', response.data)
              localStorage.removeItem(STORAGE_KEYS.CARD_SETUP_PENDING)
              addNotification({
                type: 'system',
                title: 'Payment Method Added',
                message: `Payment method •••• ${response.data.payment_method?.last4 || ''} has been successfully added.`,
                createdAt: Date.now(),
                read: false,
              })
              // Refresh billing data to show updated payment method
              await fetchBillingData()
            } else {
              console.warn('Payment setup not complete:', response.data)
              setError('Payment setup is still processing. Please wait a moment and refresh.')
            }
          } else {
            setError(response.message || 'Failed to process payment setup')
          }
        } catch (err) {
          console.error('Error processing payment setup:', err)
          setError(err instanceof Error ? err.message : 'Failed to process payment setup')
        } finally {
          setLoading(false)
        }
      }

      processPaymentSetup()

      // Clear URL parameters
      setSearchParams({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, tokenId, planId, upgrade]) // Re-run when query params change

  async function fetchEnterprisePlanStatus() {
    try {
      setEnterprisePlanLoading(true)
      const response = await ApiService.checkEnterprisePlan()
      if (response.status === 'success' && response.data) {
        setEnterprisePlan(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch enterprise plan status:', err)
    } finally {
      setEnterprisePlanLoading(false)
    }
  }

  async function handleDownloadInvoice(invoiceId: string, month: string) {
    try {
      console.log('Downloading invoice:', invoiceId)
      const blob = await ApiService.downloadInvoice(invoiceId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice_${month.replace(' ', '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Failed to download invoice:', err)
      addNotification({
        type: 'system',
        title: 'Error',
        message: err.message || 'Failed to download invoice',
        createdAt: Date.now(),
        read: false,
      })
    }
  }

  async function fetchBillingData() {
    try {
      setLoading(true)
      setError(null)

      // ✅ CRITICAL: Pass query parameters to billing API for automatic payment processing
      // The backend billing endpoint automatically processes enterprise plan payments
      // when it receives session_id, token_id, plan_id, and upgrade parameters.
      // This ensures immediate payment activation without waiting for webhooks.
      const billingParams = (sessionId || upgrade === 'enterprise') ? {
        session_id: sessionId || undefined,
        token_id: tokenId || undefined,
        plan_id: planId || undefined,
        upgrade: upgrade || undefined,
      } : undefined

      if (billingParams) {
        console.log('✅ Fetching billing data with payment parameters for automatic processing:', billingParams)
      } else {
        console.log('Fetching billing data (no payment parameters)')
      }

      const [invoicesResponse, currentMonthResponse] = await Promise.all([
        ApiService.listInvoices({ page, pageSize: PAGE_SIZE }),
        ApiService.getCurrentMonthBilling(billingParams),
      ])

      if (invoicesResponse.status === 'success' && invoicesResponse.data) {
        setInvoices(invoicesResponse.data.invoices)
        setTotalCount(invoicesResponse.data.pagination.total_count)
        setTotalPages(invoicesResponse.data.pagination.total_pages)
      }

      if (currentMonthResponse.status === 'success' && currentMonthResponse.data) {
        console.log('Current Month Billing Response:', currentMonthResponse.data)
        setCurrentMonth(currentMonthResponse.data)

        // Log payment method info for debugging
        if (currentMonthResponse.data.payment_method) {
          console.log('✅ Payment method found:', currentMonthResponse.data.payment_method)
          // If a valid payment method exists, clear the card-setup-pending flag
          localStorage.removeItem(STORAGE_KEYS.CARD_SETUP_PENDING)
        } else {
          const devAccount = currentMonthResponse.data.developer_account
          console.warn('❌ No payment method in response. Developer account:', devAccount)
          if (devAccount?.has_stripe_customer === false) {
            console.error('⚠️ CRITICAL ISSUE: Stripe customer not created (`has_stripe_customer: false`)')
            console.error('This indicates:')
            console.error('1. The Stripe checkout session was completed, but')
            console.error('2. The backend webhook did NOT create/link the Stripe customer to the developer account')
            console.error('3. This is a BACKEND issue - the webhook handler needs to:')
            console.error('   - Process the checkout.session.completed webhook')
            console.error('   - Create or retrieve the Stripe customer')
            console.error('   - Link it to the developer account/organization')
            console.error('   - Set the payment method as default')
            console.error('Developer Account ID:', devAccount?.id)
            console.error('Please check backend logs for webhook processing errors.')
          }
        }
      } else {
        console.warn('Current month billing response:', currentMonthResponse)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }

  // Initial load and refetch when page or query parameters change
  // Skip initial load if we're processing an enterprise payment (handled by payment processing useEffect)
  useEffect(() => {
    // Don't run initial load if we're processing an enterprise payment redirect
    // The payment processing useEffect will handle fetching the data
    if (isProcessingPaymentRef.current || (upgrade === 'enterprise' && sessionId && tokenId && planId)) {
      console.log('Skipping initial load - processing enterprise payment redirect')
      return
    }

    fetchBillingData()
    fetchEnterprisePlanStatus()
  }, [page, sessionId, tokenId, planId, upgrade]) // Refetch when query params change

  const safePage = Math.min(page, totalPages)
  const startIndex = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(safePage * PAGE_SIZE, totalCount)

  const pageButtons = useMemo(() => {
    if (totalPages <= 1) return []
    const windowSize = 5
    let start = Math.max(1, safePage - 1)
    let end = Math.min(totalPages, start + windowSize - 1)
    start = Math.max(1, end - windowSize + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  useEffect(() => {
    if (!isPaymentModalOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPaymentModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPaymentModalOpen])

  return (
    <div className="billing-grid">
      <section className="panel billing-panel">
        <div className="panel-header">
          <div>
            <h3>Billing &amp; Invoices</h3>
            <p>Monthly usage and payment history</p>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={fetchBillingData}
            disabled={loading}
            style={{ fontSize: '14px', padding: '0.5rem 1rem' }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="table">
          <div className="table-row table-header table-billing">
            <span>Month</span>
            <span>Requests</span>
            <span>Total Cost</span>
            <span>Invoice</span>
            <span>Status</span>
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoices...</div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>No invoices found</div>
          ) : (
            invoices.map((invoice) => (
              <div key={invoice.id} className="table-row table-billing">
                <span className="bold">{invoice.month}</span>
                <span>{invoice.requests.toLocaleString()}</span>
                <span className="bold">${invoice.total_cost.toFixed(2)}</span>
                <button
                  type="button"
                  className="link-button link-with-icon"
                  onClick={() => handleDownloadInvoice(invoice.id, invoice.month)}
                >
                  <Icon name="filePdf" size={18} />
                  Download PDF
                </button>
                <span className={`status ${invoice.status}`}>{invoice.status_label}</span>
              </div>
            ))
          )}
        </div>

        <div className="table-footer">
          <span>
            Showing {startIndex} to {endIndex} of {totalCount.toLocaleString()} invoices
          </span>
          {totalPages > 1 ? (
            <div className="pagination">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                Previous
              </button>
              {pageButtons.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`page-btn${p === safePage ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="ghost-button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <div className="stack">
        <section className="panel">
          <div className="panel-header small">
            <div>
              <h3>Current Month</h3>
            </div>
            {currentMonth && (
              <div className="muted-pill">{currentMonth.current_month.month}</div>
            )}
          </div>

          {currentMonth ? (
            <>
              <h2 className="billing-amount">${currentMonth.current_month.total_cost.toFixed(2)}</h2>
              <p className="billing-sub">{currentMonth.current_month.total_requests.toLocaleString()} requests</p>

              <div className="divider" />

              <div className="meta-row">
                <span>Next billing date</span>
                <strong>{currentMonth.next_billing_date}</strong>
              </div>
              {currentMonth.payment_method ? (
                <div className="meta-row">
                  <span>Payment method</span>
                  <strong>•••• {currentMonth.payment_method.last4}</strong>
                </div>
              ) : (
                <div className="meta-row">
                  <span>Payment method</span>
                  <strong>Not set</strong>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header small">
            <div>
              <h3>Payment Method</h3>
            </div>
          </div>

          {currentMonth?.payment_method ? (
            <div className="payment">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="visa">{currentMonth.payment_method.brand.toUpperCase()}</span>
                <div>
                  <div className="bold">•••• {currentMonth.payment_method.last4}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>
                    Expires {currentMonth.payment_method.expires}
                  </div>
                </div>
              </div>
              <div className="payment-actions">
                <div className="payment-actions-note">Default payment method</div>
                <button
                  type="button"
                  className="link-button"
                  onClick={async () => {
                    try {
                      console.log('Initiating payment method update...')
                      const response = await ApiService.updatePaymentMethod()
                      if (response.status === 'success' && response.data?.payment_setup_url) {
                        console.log('Redirecting to payment setup:', response.data.payment_setup_url)
                        window.location.href = response.data.payment_setup_url
                      } else {
                        addNotification({
                          type: 'system',
                          title: 'Error',
                          message: response.message || 'Failed to initiate payment method update',
                          createdAt: Date.now(),
                          read: false,
                        })
                      }
                    } catch (err) {
                      console.error('Failed to update payment method:', err)
                      addNotification({
                        type: 'system',
                        title: 'Error',
                        message: err instanceof Error ? err.message : 'Failed to initiate payment method update',
                        createdAt: Date.now(),
                        read: false,
                      })
                    }
                  }}
                >
                  Update payment method
                </button>
              </div>
            </div>
          ) : currentMonth?.developer_account?.has_stripe_customer ? (
            <div className="payment">
              <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>Stripe customer exists but no default payment method set.</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                  Please log out and log back in to complete payment setup.
                </p>
              </div>
              <div className="payment-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    if (confirm('To add a payment method, you need to log out and log back in. This will redirect you to Stripe payment setup. Continue?')) {
                      // Clear tokens and redirect to login
                      localStorage.removeItem('skrivly_developer_jwt')
                      localStorage.removeItem('skrivly_refresh_token')
                      window.location.href = '/login'
                    }
                  }}
                >
                  Log out to add payment method
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={fetchBillingData}
                  style={{ marginTop: '0.5rem', fontSize: '13px' }}
                >
                  Refresh payment status
                </button>
              </div>
            </div>
          ) : (
            <div className="payment">
              <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>No payment method set</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                  {currentMonth?.developer_account?.has_stripe_customer === false
                    ? 'Stripe customer not created. This usually means the payment setup webhook hasn\'t processed yet. If you just completed payment setup, wait a few moments and refresh. Otherwise, log out and log back in to trigger payment setup again.'
                    : 'To add a payment method, log out and log back in. You will be redirected to payment setup.'}
                </p>
              </div>
              <div className="payment-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    if (confirm('To add a payment method, you need to log out and log back in. This will redirect you to Stripe payment setup. Continue?')) {
                      // Clear tokens and redirect to login
                      localStorage.removeItem('skrivly_developer_jwt')
                      localStorage.removeItem('skrivly_refresh_token')
                      window.location.href = '/login'
                    }
                  }}
                >
                  Log out to add payment method
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={fetchBillingData}
                  style={{ marginTop: '0.5rem', fontSize: '13px' }}
                >
                  Refresh payment status
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header small">
            <div>
              <h3>Enterprise Plan</h3>
            </div>
            {enterprisePlan?.has_enterprise_plan && (
              <div className="muted-pill" style={{ backgroundColor: '#10b981', color: '#fff' }}>
                Active
              </div>
            )}
          </div>

          {enterprisePlanLoading ? (
            <div style={{ padding: '1rem', textAlign: 'center' }}>Loading plan status...</div>
          ) : enterprisePlan?.has_enterprise_plan ? (
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>✅</div>
                <div>
                  <div className="bold" style={{ fontSize: '16px', marginBottom: '4px' }}>
                    Enterprise Plan Active
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    {enterprisePlan.message || 'You have access to all enterprise features including API key generation.'}
                  </div>
                </div>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '1px solid #bbf7d0',
                marginTop: '1rem'
              }}>
                <div style={{ fontSize: '13px', color: '#166534', fontWeight: 500, marginBottom: '4px' }}>
                  Enterprise Features:
                </div>
                <ul style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '13px',
                  color: '#166534',
                  lineHeight: '1.6'
                }}>
                  <li>API Key Generation & Management</li>
                  <li>Advanced API Usage Analytics</li>
                  <li>Priority Support</li>
                  <li>Custom Rate Limits</li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>🔒</div>
                <div>
                  <div className="bold" style={{ fontSize: '16px', marginBottom: '4px' }}>
                    Enterprise Plan Required
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    {enterprisePlan?.message || 'Upgrade to enterprise plan to unlock API key generation and advanced features.'}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                border: '1px solid #fde68a',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 500, marginBottom: '8px' }}>
                  What you'll get:
                </div>
                <ul style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '13px',
                  color: '#92400e',
                  lineHeight: '1.6',
                  marginBottom: '8px'
                }}>
                  <li>Unlimited API Key Generation</li>
                  <li>Advanced Usage Analytics & Reports</li>
                  <li>Priority Customer Support</li>
                  <li>Custom Rate Limits & Quotas</li>
                  <li>Dedicated Account Manager</li>
                </ul>
              </div>

              <button
                type="button"
                className="button"
                onClick={async () => {
                  setIsPurchasingEnterprise(true)
                  try {
                    console.log('Initiating enterprise plan purchase...')
                    const response = await ApiService.purchaseEnterprisePlan()
                    console.log('Enterprise plan purchase response:', response)

                    if (response.status === 'success' && response.data?.checkout_url) {
                      console.log('Redirecting to Stripe checkout:', response.data.checkout_url)
                      // Redirect to Stripe checkout
                      window.location.href = response.data.checkout_url
                    } else {
                      console.error('Failed to get checkout URL:', response)
                      addNotification({
                        type: 'system',
                        title: 'Error',
                        message: response.message || 'Failed to create checkout session',
                        createdAt: Date.now(),
                        read: false,
                      })
                      setIsPurchasingEnterprise(false)
                    }
                  } catch (err) {
                    console.error('Failed to purchase enterprise plan:', err)
                    addNotification({
                      type: 'system',
                      title: 'Error',
                      message: err instanceof Error ? err.message : 'Failed to initiate enterprise plan purchase',
                      createdAt: Date.now(),
                      read: false,
                    })
                    setIsPurchasingEnterprise(false)
                  }
                }}
                disabled={isPurchasingEnterprise}
                style={{
                  width: '100%',
                  marginTop: '0.5rem'
                }}
              >
                {isPurchasingEnterprise ? 'Processing...' : 'Upgrade to Enterprise Plan'}
              </button>
            </div>
          )}
        </section>
      </div>

      {isPaymentModalOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Add Payment Method"
          onMouseDown={() => setIsPaymentModalOpen(false)}
        >
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Payment Method</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label className="field-label">Card Holder Name</label>
                <input className="input" placeholder="Name" />
              </div>

              <div className="field">
                <label className="field-label">Card Number</label>
                <div className="input-with-icon">
                  <span className="input-icon" aria-hidden="true">
                    <Icon name="creditCard" size={18} />
                  </span>
                  <input className="input" placeholder="1234 1234 1234 1234" />
                </div>
              </div>

              <div className="modal-grid-2">
                <div className="field">
                  <label className="field-label">CVC</label>
                  <input className="input" placeholder="CVC-kod" />
                </div>
                <div className="field">
                  <label className="field-label">Expiry</label>
                  <input className="input" placeholder="MM/ÅÅ" />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-save"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

