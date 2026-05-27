// API Response Types based on curl_commands.md

export interface ApiResponse<T = unknown> {
  action?: string
  status: 'success' | 'error'
  message?: string
  data?: T
  status_code?: number
}

// Developer Account Types
export interface DeveloperAccountStatus {
  has_developer_account: boolean
  developer_account_id?: string
  developer_account_name?: string
  developer_account_email?: string
  suggested_email?: string
}

export interface DeveloperAccount {
  id: string
  name: string
  status: 'active' | 'disabled'
}

export interface UserDetails {
  access_token: string
  refresh_token: string
  user_type: 'developer' | 'normal'
  email?: string
  first_name?: string
  last_name?: string
}

export interface OrganizationDetails {
  organization_name?: string
  organization_number?: string
  organization_vat_id?: string
  organization_domain?: string
}

export interface CreateAccountResponse {
  user_details: UserDetails
  organisation_details: OrganizationDetails
  developer_account: DeveloperAccount
  payment_setup_url?: string
  checkout_session_id?: string
  payment_required?: boolean
}

export interface UpdateOrganizationRequest {
  organization_name?: string
  organization_domain?: string
  organization_number?: string
  organization_vat_id?: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

// API Key Types
export interface ApiKey {
  id: string
  key_name: string
  is_active: boolean
  last_used: string | null
  created_at: string
  expires_at: string | null
  is_expired: boolean
  api_key?: string // Only shown on creation
  api_key_masked?: string // Masked version shown in list
  api_secret?: string // Only shown on creation
  api_secret_masked?: string // Masked version shown in list
}

export interface ApiKeysResponse {
  api_keys: ApiKey[]
  total_count: number
}

export interface CreateApiKeyRequest {
  key_name: string
  expires_in_days?: number
}

export interface CreateApiKeyResponse {
  id: string
  key_name: string
  api_key: string
  api_secret: string
  created_at: string
  expires_at: string | null
  warning: string
}

export interface RegenerateApiKeyRequest {
  key_name?: string
  expires_in_days?: number
}

export interface RegenerateApiKeyResponse extends CreateApiKeyResponse {
  old_key_id: string
}

export interface EnterprisePlanStatus {
  has_enterprise_plan: boolean
  message: string
}

export interface EnterprisePlanUpgradeResponse {
  checkout_url: string
  checkout_session_id: string
  plan_name: string
  plan_price: number
  currency: string
  payment_type: 'one_time'
}

export interface EnterprisePlanPaymentSuccessResponse {
  subscription_id: string
  plan_name: string
  status: 'active'
}

export interface EnterprisePlanPurchaseResponse {
  checkout_url?: string
  checkout_session_id?: string
  payment_setup_url?: string
  message?: string
}

// API Usage Types
export interface ApiUsageOverview {
  api_requests: number
  monthly_cost: number
  active_keys: number
  failed_requests: number
  total_esign_count: number
  total_bankid_count: number
  total_cost: number
  date_range: {
    start_date: string
    end_date: string
  }
  by_api: {
    [key: string]: {
      requests: number
      cost: number
      esign_count: number
      bankid_count: number
    }
  }
}

export interface UsageLog {
  id: string
  api_name: string
  client_id: string
  endpoint: string
  requests: number
  price_per_req: number
  total_cost: number
  date: string
  time: string
  status: 'success' | 'failed'
  esign_count: number
  bankid_count: number
  total_signatures: number
  document_reference_id?: string
}

export interface UsageLogResponse {
  logs: UsageLog[]
  pagination: {
    page: number
    page_size: number
    total_count: number
    total_pages: number
  }
}

export interface DailyStats {
  date: string
  requests: number
  failed: number
  cost?: number
}

export interface DailyStatsResponse {
  daily_requests: DailyStats[]
  daily_costs: Array<{ date: string; cost: number }>
  summary: {
    total_requests: number
    total_failed: number
    total_cost: number
  }
  date_range: {
    start_date: string
    end_date: string
  }
}

// Dashboard Types
export interface DashboardOverview {
  api_requests: {
    value: number
    period: string
    trend_percentage: number
    trend: 'increase' | 'decrease'
  }
  monthly_cost: {
    value: number
    billing_date: string
    month: string
  }
  active_keys: {
    value: number
    note: string
  }
  failed_requests: {
    value: number
    period: string
    percentage: number
  }
}

export interface DashboardChartData {
  date: string
  requests: number
  failed: number
  successful: number
  cost?: number
}

export interface DashboardData {
  overview: DashboardOverview
  daily_api_usage: {
    title: string
    subtitle: string
    period: string
    period_days: number
    summary: {
      requests: number
      failed: number
    }
    chart_data: DashboardChartData[]
  }
  daily_cost: {
    title: string
    subtitle: string
    period: string
    period_days: number
    summary: {
      cost: number
    }
    chart_data: Array<{ date: string; cost: number }>
  }
  developer_account: {
    id: string
    name: string
    organization_name: string
  }
}

// Billing Types
export interface Invoice {
  id: string
  month: string
  invoice_month: number
  invoice_year: number
  billing_period_start: string
  billing_period_end: string
  requests: number
  total_cost: number
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  status_label: string
  due_date: string
  paid_at: string | null
  invoice_pdf_url: string | null
  invoice_url: string | null
  feature_usage: {
    esign: number
    bankid: number
  }
  esign_count: number
  bankid_count: number
}

export interface InvoicesResponse {
  invoices: Invoice[]
  pagination: {
    page: number
    page_size: number
    total_count: number
    total_pages: number
  }
}

export interface CurrentMonthBilling {
  current_month: {
    month: string
    month_number: number
    year: number
    total_cost: number
    total_requests: number
    feature_usage: {
      esign: number
      bankid: number
    }
  }
  next_billing_date: string
  payment_method: {
    type: string
    brand: string
    last4: string
    exp_month: number
    exp_year: number
    expires: string
  } | null
  developer_account: {
    id: string
    name: string
    has_stripe_customer: boolean
  }
}

export interface UpdatePaymentMethodResponse {
  payment_setup_url: string
  checkout_session_id?: string
}


// Profile Types
export interface Profile {
  account_id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  country: string
  address1: string
  address2: string
  zip_code: string
  state: string
  two_fa_enabled: boolean
  profile_picture: string | null
}

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
  country?: string
  address1?: string
  address2?: string
  zip_code?: string
  state?: string
  enable_2fa?: boolean
  profile_picture?: File | string
}

export interface OrganizationDetailsResponse {
  organization_name: string
  organization_number: string
  organization_vat_id: string
  organization_domain: string
}

// Notification Types
export interface Notification {
  id: string
  type: 'api' | 'system'
  title: string
  message?: string
  read: boolean
  created_at: string
}

export interface NotificationsResponse {
  notifications: Notification[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface UnreadCountResponse {
  unread_count: number
}

export interface BulkNotificationRequest {
  ids: string[]
  read: boolean
}

export interface BulkDeleteNotificationRequest {
  ids: string[]
}

export interface PaymentSetupResponse {
  is_setup_complete: boolean
  has_stripe_customer: boolean
  payment_method: {
    type: string
    brand: string
    last4: string
    exp_month: number
    exp_year: number
    expires: string
  } | null
  developer_account: {
    id: string
    name: string
  }
}

