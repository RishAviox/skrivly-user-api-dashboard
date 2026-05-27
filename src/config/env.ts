// Environment configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export const DOCS_URL = import.meta.env.VITE_DOCS_URL || 'http://localhost:3000'

// Storage keys
export const STORAGE_KEYS = {
  DEVELOPER_JWT: 'skrivly_developer_jwt',
  REFRESH_TOKEN: 'skrivly_refresh_token',
  NORMAL_USER_JWT: 'skrivly_normal_user_jwt',
  CARD_SETUP_PENDING: 'skrivly_card_setup_pending',
} as const


