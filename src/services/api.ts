import { API_BASE_URL, STORAGE_KEYS } from '../config/env'
import type {
  ApiResponse,
  ApiKeysResponse,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RegenerateApiKeyRequest,
  RegenerateApiKeyResponse,
  EnterprisePlanStatus,
  EnterprisePlanUpgradeResponse,
  EnterprisePlanPaymentSuccessResponse,
  ApiUsageOverview,
  UsageLogResponse,
  DailyStatsResponse,
  DashboardData,
  InvoicesResponse,
  CurrentMonthBilling,
  Profile,
  UpdateProfileRequest,
  OrganizationDetailsResponse,
  DeveloperAccountStatus,
  PaymentSetupResponse,
  CreateAccountResponse,
  UpdateOrganizationRequest,
  ChangePasswordRequest,
  UpdatePaymentMethodResponse,
  NotificationsResponse,
  UnreadCountResponse,
  BulkNotificationRequest,
  BulkDeleteNotificationRequest,
} from '../types/api'

class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Get developer JWT token from storage
function getDeveloperJWT(): string | null {
  return localStorage.getItem(STORAGE_KEYS.DEVELOPER_JWT)
}

// Get normal user JWT token from storage
function getNormalUserJWT(): string | null {
  return localStorage.getItem(STORAGE_KEYS.NORMAL_USER_JWT)
}

// Set developer JWT token
export function setDeveloperJWT(token: string): void {
  localStorage.setItem(STORAGE_KEYS.DEVELOPER_JWT, token)
}

// Set normal user JWT token
export function setNormalUserJWT(token: string): void {
  localStorage.setItem(STORAGE_KEYS.NORMAL_USER_JWT, token)
}

// Clear all tokens
export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.DEVELOPER_JWT)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.NORMAL_USER_JWT)
}

// Base fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  useDeveloperJWT = true,
): Promise<T> {
  const token = useDeveloperJWT ? getDeveloperJWT() : getNormalUserJWT()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorData: unknown
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: response.statusText }
    }

    // Log error details for debugging
    console.error('API Error:', {
      url,
      status: response.status,
      error: errorData,
      hasToken: !!token,
    })

    throw new ApiError(
      (errorData as { message?: string })?.message || `HTTP ${response.status}`,
      response.status,
      errorData,
    )
  }

  // Handle CSV exports
  if (response.headers.get('content-type')?.includes('text/csv')) {
    return response.text() as unknown as T
  }

  return response.json() as Promise<T>
}

// API Service Class
export class ApiService {
  // Authentication - Login Flow (Passwordless)
  static async loginSendOTP(email: string): Promise<ApiResponse> {
    return apiFetch('/api/v1/developer-settings/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false)
  }

  static async loginVerifyOTP(email: string, otpCode: string): Promise<ApiResponse<CreateAccountResponse>> {
    return apiFetch('/api/v1/developer-settings/auth/login-otp-verify/', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code: otpCode }),
    }, false)
  }

  // Authentication - Fresh User Signup Flow (uses unified endpoints without auth)
  static async signupSendOTP(email: string): Promise<ApiResponse> {
    return apiFetch('/api/v1/developer-settings/auth/signup/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false)
  }

  static async signupVerifyOTP(email: string, otpCode: string): Promise<ApiResponse> {
    return apiFetch('/api/v1/developer-settings/auth/verify-otp/', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code: otpCode }),
    }, false)
  }

  static async signupCreateAccount(data: {
    email: string
    password: string
    first_name?: string
    last_name?: string
    phone_number?: string
  }): Promise<ApiResponse<CreateAccountResponse>> {
    return apiFetch('/api/v1/developer-settings/auth/create-account/', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, false)
  }

  // Developer Account
  static async checkDeveloperAccountStatus(): Promise<ApiResponse<DeveloperAccountStatus>> {
    return apiFetch('/api/v1/developer-settings/auth/account-status/', {
      method: 'GET',
    }, false)
  }

  // API Keys
  static async checkEnterprisePlan(): Promise<ApiResponse<EnterprisePlanStatus>> {
    return apiFetch('/api/v1/developer-settings/api-keys/check-plan/', {
      method: 'GET',
    })
  }

  // Enterprise Plan Upgrade
  static async upgradeToEnterprisePlan(): Promise<ApiResponse<EnterprisePlanUpgradeResponse>> {
    return apiFetch('/api/v1/developer-settings/enterprise-plan/upgrade/', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  // Alias for purchaseEnterprisePlan (calls upgradeToEnterprisePlan)
  static async purchaseEnterprisePlan(): Promise<ApiResponse<EnterprisePlanUpgradeResponse>> {
    return this.upgradeToEnterprisePlan()
  }

  // Enterprise Plan Payment Success Handler
  static async verifyEnterprisePlanPayment(params: {
    sessionId: string
    tokenId: string
    planId: string
  }): Promise<ApiResponse<EnterprisePlanPaymentSuccessResponse>> {
    const queryParams = new URLSearchParams({
      session_id: params.sessionId,
      token_id: params.tokenId,
      plan_id: params.planId,
    })
    return apiFetch(`/api/v1/developer-settings/enterprise-plan/payment-success/?${queryParams.toString()}`, {
      method: 'GET',
    })
  }

  static async listApiKeys(includeInactive = false): Promise<ApiResponse<ApiKeysResponse>> {
    const params = includeInactive ? '?include_inactive=true' : ''
    return apiFetch(`/api/v1/developer-settings/api-keys/${params}`, {
      method: 'GET',
    })
  }

  static async createApiKey(data: CreateApiKeyRequest): Promise<ApiResponse<CreateApiKeyResponse>> {
    return apiFetch('/api/v1/developer-settings/api-keys/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async revokeApiKey(apiKeyId: string): Promise<ApiResponse> {
    return apiFetch(`/api/v1/developer-settings/api-keys/${apiKeyId}/revoke/`, {
      method: 'DELETE',
    })
  }

  static async regenerateApiKey(
    apiKeyId: string,
    data: RegenerateApiKeyRequest,
  ): Promise<ApiResponse<RegenerateApiKeyResponse>> {
    return apiFetch(`/api/v1/developer-settings/api-keys/${apiKeyId}/regenerate/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // API Usage
  static async getUsageOverview(
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<ApiUsageOverview>> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiFetch(`/api/v1/developer-settings/usage/overview/${query}`, {
      method: 'GET',
    })
  }

  static async getUsageLog(params: {
    startDate?: string
    endDate?: string
    apiName?: string
    status?: 'success' | 'failed'
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<UsageLogResponse>> {
    const searchParams = new URLSearchParams()
    if (params.startDate) searchParams.append('start_date', params.startDate)
    if (params.endDate) searchParams.append('end_date', params.endDate)
    if (params.apiName) searchParams.append('api_name', params.apiName)
    if (params.status) searchParams.append('status', params.status)
    if (params.page) searchParams.append('page', String(params.page))
    if (params.pageSize) searchParams.append('page_size', String(params.pageSize))

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return apiFetch(`/api/v1/developer-settings/usage/log/${query}`, {
      method: 'GET',
    })
  }

  static async exportUsageLog(params: {
    startDate?: string
    endDate?: string
    apiName?: string
    status?: 'success' | 'failed'
    apiKeyId?: string
    apiKeyActive?: boolean
  }): Promise<string> {
    const searchParams = new URLSearchParams()
    if (params.startDate) searchParams.append('start_date', params.startDate)
    if (params.endDate) searchParams.append('end_date', params.endDate)
    if (params.apiName) searchParams.append('api_name', params.apiName)
    if (params.status) searchParams.append('status', params.status)
    if (params.apiKeyId) searchParams.append('api_key_id', params.apiKeyId)
    if (params.apiKeyActive !== undefined) searchParams.append('api_key_active', String(params.apiKeyActive))

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return apiFetch(`/api/v1/developer-settings/usage/log/export/${query}`, {
      method: 'GET',
    })
  }

  static async getDailyStats(
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<DailyStatsResponse>> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiFetch(`/api/v1/developer-settings/usage/daily-stats/${query}`, {
      method: 'GET',
    })
  }

  // Dashboard
  static async getDashboard(period?: 7 | 14 | 31): Promise<ApiResponse<DashboardData>> {
    const params = new URLSearchParams()
    if (period) params.append('period', String(period))
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiFetch(`/api/v1/developer-settings/dashboard/${query}`, {
      method: 'GET',
    })
  }

  // Billing
  static async listInvoices(params: {
    status?: 'pending' | 'paid' | 'failed' | 'cancelled'
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<InvoicesResponse>> {
    const searchParams = new URLSearchParams()
    if (params.status) searchParams.append('status', params.status)
    if (params.page) searchParams.append('page', String(params.page))
    if (params.pageSize) searchParams.append('page_size', String(params.pageSize))

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return apiFetch(`/api/v1/developer-settings/billing/invoices/${query}`, {
      method: 'GET',
    })
  }

  static async getCurrentMonthBilling(params?: {
    session_id?: string
    token_id?: string
    plan_id?: string
    upgrade?: string
  }): Promise<ApiResponse<CurrentMonthBilling>> {
    const searchParams = new URLSearchParams()
    if (params?.session_id) searchParams.append('session_id', params.session_id)
    if (params?.token_id) searchParams.append('token_id', params.token_id)
    if (params?.plan_id) searchParams.append('plan_id', params.plan_id)
    if (params?.upgrade) searchParams.append('upgrade', params.upgrade)

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return apiFetch(`/api/v1/developer-settings/billing/current-month/${query}`, {
      method: 'GET',
    })
  }

  static async processPaymentSetup(checkoutSessionId: string): Promise<ApiResponse<PaymentSetupResponse>> {
    return apiFetch('/api/v1/developer-settings/billing/process-payment-setup/', {
      method: 'POST',
      body: JSON.stringify({ checkout_session_id: checkoutSessionId }),
    })
  }

  static async updatePaymentMethod(): Promise<ApiResponse<UpdatePaymentMethodResponse>> {
    return apiFetch('/api/v1/developer-settings/billing/update-payment-method/', {
      method: 'POST',
    })
  }

  static async downloadInvoice(invoiceId: string): Promise<Blob> {
    const token = getDeveloperJWT()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/developer-settings/billing/invoices/${invoiceId}/download/`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: response.statusText }
      }
      throw new ApiError(
        errorData?.message || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }

    return response.blob()
  }

  // Profile
  static async getProfile(): Promise<ApiResponse<Profile>> {
    return apiFetch('/api/v1/developer-settings/profile/', {
      method: 'GET',
    })
  }

  static async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<Profile>> {
    const formData = new FormData()

    if (data.first_name !== undefined) formData.append('first_name', data.first_name)
    if (data.last_name !== undefined) formData.append('last_name', data.last_name)
    if (data.email !== undefined) formData.append('email', data.email)
    if (data.phone_number !== undefined) formData.append('phone_number', data.phone_number)
    if (data.country !== undefined) formData.append('country', data.country)
    if (data.address1 !== undefined) formData.append('address1', data.address1)
    if (data.address2 !== undefined) formData.append('address2', data.address2)
    if (data.zip_code !== undefined) formData.append('zip_code', data.zip_code)
    if (data.state !== undefined) formData.append('state', data.state)
    if (data.enable_2fa !== undefined) formData.append('enable_2fa', String(data.enable_2fa))
    if (data.profile_picture instanceof File) {
      formData.append('profile_picture', data.profile_picture)
    } else if (data.profile_picture === '') {
      formData.append('profile_picture', '')
    }

    const token = getDeveloperJWT()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/developer-settings/profile/`, {
      method: 'PATCH',
      headers,
      body: formData,
    })

    if (!response.ok) {
      let errorData: unknown
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: response.statusText }
      }
      throw new ApiError(
        (errorData as { message?: string })?.message || `HTTP ${response.status}`,
        response.status,
        errorData,
      )
    }

    return response.json() as Promise<ApiResponse<Profile>>
  }

  static async getOrganizationDetails(): Promise<ApiResponse<OrganizationDetailsResponse>> {
    return apiFetch('/api/v1/developer-settings/profile/organization/', {
      method: 'GET',
    })
  }

  static async deleteDeveloperAccount(): Promise<ApiResponse> {
    return apiFetch('/api/v1/developer-settings/profile/delete-account/', {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    })
  }

  static async updateOrganizationDetails(data: UpdateOrganizationRequest): Promise<ApiResponse<OrganizationDetailsResponse>> {
    return apiFetch('/api/v1/developer-settings/profile/organization/update/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  static async changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
    return apiFetch('/api/v1/developer-settings/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Notifications
  static async listNotifications(params?: {
    page?: number
    limit?: number
    unread_only?: boolean
  }): Promise<ApiResponse<NotificationsResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.limit) searchParams.append('limit', String(params.limit))
    if (params?.unread_only) searchParams.append('unread_only', 'true')

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return apiFetch(`/api/v1/developer-settings/notifications/${query}`, {
      method: 'GET',
    })
  }

  static async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    return apiFetch('/api/v1/developer-settings/notifications/unread-count/', {
      method: 'GET',
    })
  }

  static async markNotification(notificationId: string, read: boolean): Promise<ApiResponse> {
    return apiFetch(`/api/v1/developer-settings/notifications/${notificationId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
    })
  }

  static async bulkMarkNotifications(data: BulkNotificationRequest): Promise<ApiResponse> {
    return apiFetch('/api/v1/developer-settings/notifications/bulk/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  static async bulkDeleteNotifications(data: BulkDeleteNotificationRequest): Promise<ApiResponse> {
    return apiFetch('/api/v1/developer-settings/notifications/bulk/delete/', {
      method: 'DELETE',
      body: JSON.stringify(data),
    })
  }
}

