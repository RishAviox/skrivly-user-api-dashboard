import { Icon } from '../ui/icons'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiService } from '../services/api'
import type { ApiKey, Profile, OrganizationDetailsResponse } from '../types/api'

export default function SettingsPage() {
  const navigate = useNavigate()
  const PROFILE_STORAGE_KEY = 'skrivly_profile_v1'

  type StoredProfile = {
    firstName: string
    lastName: string
    email: string
    avatarDataUrl?: string
  }

  function readProfile(): StoredProfile {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (!raw) {
        return { firstName: '', lastName: '', email: '' }
      }
      const parsed = JSON.parse(raw) as Partial<StoredProfile>
      return {
        firstName: parsed.firstName ?? '',
        lastName: parsed.lastName ?? '',
        email: parsed.email ?? '',
        avatarDataUrl: parsed.avatarDataUrl,
      }
    } catch {
      return { firstName: '', lastName: '', email: '' }
    }
  }

  function writeProfile(next: StoredProfile) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('skrivly:profile-updated'))
  }

  const initialProfile = readProfile()
  const [profileFirstName, setProfileFirstName] = useState(initialProfile.firstName)
  const [profileLastName, setProfileLastName] = useState(initialProfile.lastName)
  const [profileEmail, setProfileEmail] = useState(initialProfile.email)
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(initialProfile.avatarDataUrl)
  const [profilePhone, setProfilePhone] = useState('')
  const [profileCountry, setProfileCountry] = useState('')
  const [profileAddress1, setProfileAddress1] = useState('')
  const [profileAddress2, setProfileAddress2] = useState('')
  const [profileZipCode, setProfileZipCode] = useState('')
  const [profileState, setProfileState] = useState('')
  const [profileTwoFa, setProfileTwoFa] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const currentUserName = `${profileFirstName} ${profileLastName}`.trim() || 'User'
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false)
  const [isGenerateKeyModalOpen, setIsGenerateKeyModalOpen] = useState(false)
  const [isRegenerateKeyModalOpen, setIsRegenerateKeyModalOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [openKeyActionsFor, setOpenKeyActionsFor] = useState<string | null>(null)
  const [copiedToast, setCopiedToast] = useState<{ text: string; x: number; y: number } | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [expirationMode, setExpirationMode] = useState<'never' | 'date'>('never')
  const [expiresOn, setExpiresOn] = useState('') // YYYY-MM-DD
  const [regeneratingKeyId, setRegeneratingKeyId] = useState<string | null>(null)

  const [orgName, setOrgName] = useState('')
  const [orgNumber, setOrgNumber] = useState('')
  const [orgVatId, setOrgVatId] = useState('')
  const [orgDomain, setOrgDomain] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!newlyCreatedKey) {
          setIsOrgModalOpen(false)
          setIsGenerateKeyModalOpen(false)
          setIsRegenerateKeyModalOpen(false)
          setIsChangePasswordOpen(false)
          setIsDeleteAccountOpen(false)
          setOpenKeyActionsFor(null)
        }
      }
    }
    const onMouseDown = () => setOpenKeyActionsFor(null)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    // If another tab updated profile, refresh local state.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PROFILE_STORAGE_KEY) return
      const p = readProfile()
      setProfileFirstName(p.firstName)
      setProfileLastName(p.lastName)
      setProfileEmail(p.email)
      setProfileAvatar(p.avatarDataUrl)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<OrganizationDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKeysLoading, setApiKeysLoading] = useState(true)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ api_key: string; api_secret: string } | null>(null)
  const [createKeyError, setCreateKeyError] = useState<string | null>(null)
  const [regenerateKeyError, setRegenerateKeyError] = useState<string | null>(null)

  const ENTERPRISE_ROASTS = [
    "Bold move trying to generate an API key without an Enterprise plan. We admire the audacity. 😤",
    "Ah yes, API keys — the velvet rope of developer tools. Upgrade to Enterprise to get past the bouncer. 🚪",
    "Your free-tier subscription called. It said API keys aren't included. Plot twist, right? 😬",
    "Error 402: Not Enough Hustle. Or just upgrade to Enterprise. One of those. 💸",
    "You came, you clicked, you got roasted. API key generation is an Enterprise feature. No hard feelings. 🔥",
    "Generating API keys on a free plan? We like your confidence. Now upgrade and channel it productively. 🚀",
    "This door is locked, bestie. The Enterprise plan has the key... to your API keys. Get it? 🗝️",
  ]

  function isPlanError(err: unknown): boolean {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase()
      if (msg.includes('enterprise') || msg.includes('plan') || msg.includes('upgrade') || msg.includes('permission') || msg.includes('forbidden')) return true
    }
    if (typeof err === 'object' && err !== null && 'status' in err) {
      if ((err as { status: number }).status === 403) return true
    }
    return false
  }

  function getRandomRoast(): string {
    return ENTERPRISE_ROASTS[Math.floor(Math.random() * ENTERPRISE_ROASTS.length)]
  }

  useEffect(() => {
    if (!copiedToast) return
    const t = window.setTimeout(() => setCopiedToast(null), 1400)
    return () => window.clearTimeout(t)
  }, [copiedToast])

  function showCopiedToast(anchorEl: HTMLElement) {
    const rect = anchorEl.getBoundingClientRect()
    const toastWidth = 84
    const toastHeight = 34
    const offset = 10

    // Prefer above-right of the clicked icon.
    let x = rect.left + rect.width / 2
    let y = rect.top - offset

    // Clamp within viewport.
    const minX = 8 + toastWidth / 2
    const maxX = window.innerWidth - 8 - toastWidth / 2
    x = Math.max(minX, Math.min(maxX, x))

    const minY = 8 + toastHeight
    if (y < minY) y = rect.bottom + offset + toastHeight

    setCopiedToast({ text: 'Copied', x, y })
  }

  async function copyToClipboard(text: string, anchorEl?: HTMLElement) {
    try {
      await navigator.clipboard.writeText(text)
      if (anchorEl) showCopiedToast(anchorEl)
      else setCopiedToast({ text: 'Copied', x: window.innerWidth / 2, y: 80 })
      return
    } catch {
      // Fallback for older browsers / permission issues.
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      ta.style.top = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try {
        document.execCommand('copy')
        if (anchorEl) showCopiedToast(anchorEl)
        else setCopiedToast({ text: 'Copied', x: window.innerWidth / 2, y: 80 })
      } finally {
        document.body.removeChild(ta)
      }
    }
  }


  // Fetch API keys
  useEffect(() => {
    async function fetchApiKeys() {
      try {
        setApiKeysLoading(true)
        const response = await ApiService.listApiKeys(true) // Include inactive
        if (response.status === 'success' && response.data) {
          setApiKeys(response.data.api_keys)
        }
      } catch (err) {
        console.error('Failed to fetch API keys:', err)
      } finally {
        setApiKeysLoading(false)
      }
    }
    fetchApiKeys()
  }, [])

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await ApiService.getProfile()
        if (response.status === 'success' && response.data) {
          const d = response.data
          setProfile(d)
          setProfileFirstName(d.first_name ?? '')
          setProfileLastName(d.last_name ?? '')
          setProfileEmail(d.email ?? '')
          setProfileAvatar(d.profile_picture || undefined)
          setProfilePhone(d.phone_number ?? '')
          setProfileCountry(d.country ?? '')
          setProfileAddress1(d.address1 ?? '')
          setProfileAddress2(d.address2 ?? '')
          setProfileZipCode(d.zip_code ?? '')
          setProfileState(d.state ?? '')
          setProfileTwoFa(d.two_fa_enabled ?? false)
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // Fetch organization details
  useEffect(() => {
    async function fetchOrganization() {
      try {
        const response = await ApiService.getOrganizationDetails()
        if (response.status === 'success' && response.data) {
          const d = response.data
          setOrganization(d)
          setOrgName(d.organization_name ?? '')
          setOrgNumber(d.organization_number ?? '')
          setOrgVatId(d.organization_vat_id ?? '')
          setOrgDomain(d.organization_domain ?? '')
        }
      } catch (err) {
        console.error('Failed to fetch organization:', err)
      }
    }
    fetchOrganization()
  }, [])

  function openGenerateKeyModal() {
    setNewKeyName('')
    setExpirationMode('never')
    setExpiresOn('')
    setNewlyCreatedKey(null)
    setCreateKeyError(null)
    setIsGenerateKeyModalOpen(true)
  }

  function openRegenerateKeyModal(keyId: string, currentKeyName: string) {
    setRegeneratingKeyId(keyId)
    setNewKeyName(currentKeyName)
    setExpirationMode('never')
    setExpiresOn('')
    setNewlyCreatedKey(null)
    setRegenerateKeyError(null)
    setIsRegenerateKeyModalOpen(true)
    setOpenKeyActionsFor(null)
  }

  async function createNewKey() {
    setCreateKeyError(null)
    try {
      const name = newKeyName.trim() || 'New API Key'
      const expiresInDays =
        expirationMode === 'date' && expiresOn
          ? Math.ceil((new Date(expiresOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : undefined

      const response = await ApiService.createApiKey({
        key_name: name,
        expires_in_days: expiresInDays,
      })

      if (response.status === 'success' && response.data) {
        setNewlyCreatedKey({
          api_key: response.data.api_key,
          api_secret: response.data.api_secret,
        })
        // Don't close the modal - keep it open to show the keys
        // Refresh API keys list
        const listResponse = await ApiService.listApiKeys(true)
        if (listResponse.status === 'success' && listResponse.data) {
          setApiKeys(listResponse.data.api_keys)
        }
      }
    } catch (err) {
      console.error('Failed to create API key:', err)
      if (isPlanError(err)) {
        setCreateKeyError(getRandomRoast())
      } else {
        setCreateKeyError(err instanceof Error ? err.message : 'Failed to create API key')
      }
    }
  }

  async function regenerateKey() {
    if (!regeneratingKeyId) return
    setRegenerateKeyError(null)

    try {
      const expiresInDays =
        expirationMode === 'date' && expiresOn
          ? Math.ceil((new Date(expiresOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : undefined

      const response = await ApiService.regenerateApiKey(regeneratingKeyId, {
        key_name: newKeyName.trim() || undefined,
        expires_in_days: expiresInDays,
      })

      if (response.status === 'success' && response.data) {
        setNewlyCreatedKey({
          api_key: response.data.api_key,
          api_secret: response.data.api_secret,
        })
        // Refresh API keys list
        const listResponse = await ApiService.listApiKeys(true)
        if (listResponse.status === 'success' && listResponse.data) {
          setApiKeys(listResponse.data.api_keys)
        }
      }
    } catch (err) {
      console.error('Failed to regenerate API key:', err)
      if (isPlanError(err)) {
        setRegenerateKeyError(getRandomRoast())
      } else {
        setRegenerateKeyError(err instanceof Error ? err.message : 'Failed to regenerate API key')
      }
    }
  }

  async function revokeKey(keyId: string) {
    try {
      const response = await ApiService.revokeApiKey(keyId)
      if (response.status === 'success') {
        // Refresh API keys list
        const listResponse = await ApiService.listApiKeys(true)
        if (listResponse.status === 'success' && listResponse.data) {
          setApiKeys(listResponse.data.api_keys)
        }
        setOpenKeyActionsFor(null)
      }
    } catch (err) {
      console.error('Failed to revoke API key:', err)
      alert(err instanceof Error ? err.message : 'Failed to revoke API key')
    }
  }

  function getIconForKey(keyName: string): 'plug' | 'code' | 'key' {
    const lower = keyName.toLowerCase()
    if (lower.includes('production') || lower.includes('live')) return 'plug'
    if (lower.includes('development') || lower.includes('dev') || lower.includes('test')) return 'code'
    return 'key'
  }

  function maskKey(key: string): string {
    if (key.length <= 20) return key
    return `${key.slice(0, 12)}...${key.slice(-6)}`
  }

  function getMaskedApiKeyDisplay(key: ApiKey): string {
    // If we have the actual key (only during creation), show it masked
    if (key.api_key) {
      return maskKey(key.api_key)
    }
    // Use the masked key from backend if available
    if (key.api_key_masked) {
      return key.api_key_masked
    }
    // Fallback: show a masked format using the key ID
    // Format: sk_...{last 4 chars of ID}
    const lastFour = key.id.slice(-4)
    return `sk_...${lastFour}`
  }

  function getMaskedSecretKeyDisplay(key: ApiKey): string {
    // If we have the actual secret (only during creation), show it masked
    if (key.api_secret) {
      return maskKey(key.api_secret)
    }
    // Use the masked secret from backend if available
    if (key.api_secret_masked) {
      return key.api_secret_masked
    }
    // Fallback: show generic masked format
    return '••••••••'
  }

  function getInitials(first: string, last: string) {
    const a = (first || '').trim().slice(0, 1).toUpperCase()
    const b = (last || '').trim().slice(0, 1).toUpperCase()
    return (a + b) || 'U'
  }

  async function onPickAvatar(file: File) {
    if (!file.type.startsWith('image/')) return
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
    setProfileAvatar(dataUrl)
    writeProfile({
      firstName: profileFirstName,
      lastName: profileLastName,
      email: profileEmail,
      avatarDataUrl: dataUrl,
    })
  }

  async function saveProfile() {
    try {
      const fileInput = fileInputRef.current
      let profilePicture: File | string | undefined = profileAvatar

      if (fileInput?.files?.[0]) {
        profilePicture = fileInput.files[0]
      } else if (!profileAvatar) {
        profilePicture = ''
      }

      const response = await ApiService.updateProfile({
        first_name: profileFirstName.trim() || undefined,
        last_name: profileLastName.trim() || undefined,
        email: profileEmail.trim() || undefined,
        phone_number: profilePhone.trim() || undefined,
        country: profileCountry.trim() || undefined,
        address1: profileAddress1.trim() || undefined,
        address2: profileAddress2.trim() || undefined,
        zip_code: profileZipCode.trim() || undefined,
        state: profileState.trim() || undefined,
        enable_2fa: profileTwoFa,
        profile_picture: profilePicture,
      })

      if (response.status === 'success' && response.data) {
        const d = response.data
        setProfile(d)
        setProfilePhone(d.phone_number ?? '')
        setProfileCountry(d.country ?? '')
        setProfileAddress1(d.address1 ?? '')
        setProfileAddress2(d.address2 ?? '')
        setProfileZipCode(d.zip_code ?? '')
        setProfileState(d.state ?? '')
        setProfileTwoFa(d.two_fa_enabled ?? false)
        writeProfile({
          firstName: d.first_name,
          lastName: d.last_name,
          email: d.email,
          avatarDataUrl: d.profile_picture || undefined,
        })
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      alert(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  function openChangePassword() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setIsChangePasswordOpen(true)
  }

  function generateStrongPassword(length = 16) {
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const digits = '0123456789'
    const symbols = '!@#$%^&*()-_=+[]{};:,.?'
    const all = lower + upper + digits + symbols

    const rnd = (max: number) => {
      const buf = new Uint32Array(1)
      window.crypto.getRandomValues(buf)
      return buf[0] % max
    }

    const pick = (s: string) => s[rnd(s.length)]

    const out: string[] = [pick(lower), pick(upper), pick(digits), pick(symbols)]
    while (out.length < length) out.push(pick(all))

    // Shuffle (Fisher–Yates)
    for (let i = out.length - 1; i > 0; i--) {
      const j = rnd(i + 1)
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out.join('')
  }

  function onGeneratePassword() {
    const pwd = generateStrongPassword(16)
    setNewPassword(pwd)
    setConfirmPassword(pwd)
    setShowNewPassword(true)
    setShowConfirmPassword(true)
  }

  async function saveOrganization() {
    try {
      setLoading(true)
      const response = await ApiService.updateOrganizationDetails({
        organization_name: orgName.trim() || undefined,
        organization_number: orgNumber.trim() || undefined,
        organization_vat_id: orgVatId.trim() || undefined,
        organization_domain: orgDomain.trim() || undefined,
      })

      if (response.status === 'success' && response.data) {
        setOrganization(response.data)
        setIsOrgModalOpen(false)
        alert('Organization details updated successfully')
      }
    } catch (err) {
      console.error('Failed to update organization:', err)
      alert(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setLoading(false)
    }
  }

  async function submitChangePassword() {
    if (!currentPassword) {
      alert('Please enter your current password')
      return
    }
    if (!newPassword) {
      alert('Please enter a new password')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    try {
      setLoading(true)
      const response = await ApiService.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
      })

      if (response.status === 'success') {
        alert('Password changed successfully')
        setIsChangePasswordOpen(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      console.error('Failed to change password:', err)
      alert(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  function openDeleteAccount() {
    setDeleteConfirmText('')
    setIsDeleteAccountOpen(true)
  }

  async function confirmDeleteAccount() {
    try {
      const response = await ApiService.deleteDeveloperAccount()
      if (response.status === 'success') {
        setIsDeleteAccountOpen(false)
        // Clear tokens and redirect
        localStorage.clear()
        window.location.href = '/'
      }
    } catch (err) {
      console.error('Failed to delete account:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete account')
    }
  }

  return (
    <div className="settings-stack">
      <section className="panel keys-panel">
        <div className="panel-header">
          <div>
            <h3>API Keys Management</h3>
            <p>Create and manage your API credentials</p>
          </div>
          <button type="button" className="primary-button primary-button-purple" onClick={openGenerateKeyModal}>
            <Icon name="plus" size={18} />
            Generate New Key
          </button>
        </div>

        <div className="callout">
          <span className="callout-icon" aria-hidden="true">
            <Icon name="alert" size={18} />
          </span>
          <div>
            <p>Make sure to copy and store your secret key securely.</p>
          </div>
        </div>

        <div className="table">
          <div className="table-row table-header table-keys">
            <span>Key Name</span>
            <span>API Key</span>
            <span>Secret Key</span>
            <span>Created At</span>
            <span>Created by user</span>
            <span>Last Used</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {apiKeysLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>No API keys found</div>
          ) : (
            apiKeys.map((key) => {
              const icon = getIconForKey(key.key_name)
              const maskedKey = getMaskedApiKeyDisplay(key)
              return (
                <div key={key.id} className="table-row table-keys">
                  <div className="table-cell">
                    <span className={`row-icon ${icon}`} aria-hidden="true">
                      <Icon name={icon} size={22} />
                    </span>
                    {key.key_name}
                  </div>
                  <div className="key-cell">
                    <span className="muted-pill" title={key.api_key ? 'Full key available (shown on creation only)' : 'Key value not available (only shown once on creation)'}>
                      {maskedKey}
                    </span>
                    {key.api_key && (
                      <button
                        className="icon-button-sm"
                        aria-label="Copy API key"
                        title="Copy"
                        type="button"
                        onClick={(e) => copyToClipboard(key.api_key!, e.currentTarget)}
                      >
                        <Icon name="copy" size={20} />
                      </button>
                    )}
                  </div>
                  <div className="key-cell">
                    <span className="muted-pill" title={key.api_secret ? 'Full secret available (shown on creation only)' : 'Secret value not available (only shown once on creation)'}>
                      {getMaskedSecretKeyDisplay(key)}
                    </span>
                    {key.api_secret && (
                      <button
                        className="icon-button-sm"
                        aria-label="Copy secret key"
                        title="Copy"
                        type="button"
                        onClick={(e) => copyToClipboard(key.api_secret!, e.currentTarget)}
                      >
                        <Icon name="copy" size={20} />
                      </button>
                    )}
                  </div>
                  <span>{new Date(key.created_at).toLocaleDateString()}</span>
                  <span>{currentUserName}</span>
                  <span>{key.last_used ? new Date(key.last_used).toLocaleString() : '-'}</span>
                  <span className={`status ${key.is_active ? 'success' : 'revoked'}`}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </span>
                  <span className="actions-cell" onMouseDown={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="icon-button-sm actions-trigger"
                      aria-label="Actions"
                      aria-haspopup="menu"
                      aria-expanded={openKeyActionsFor === key.id}
                      onClick={() => setOpenKeyActionsFor((prev) => (prev === key.id ? null : key.id))}
                    >
                      <Icon name="moreVertical" size={20} />
                    </button>
                    {openKeyActionsFor === key.id ? (
                      <div className="actions-menu" role="menu">
                        <button
                          type="button"
                          className="actions-menu-item"
                          role="menuitem"
                          onClick={() => openRegenerateKeyModal(key.id, key.key_name)}
                        >
                          Regenerate
                        </button>
                        {key.is_active && (
                          <button
                            type="button"
                            className="actions-menu-item danger"
                            role="menuitem"
                            onClick={() => revokeKey(key.id)}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ) : null}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="panel profile-panel">
        <div className="panel-header">
          <div>
            <h3>My Profile</h3>
          </div>
          <button type="button" className="primary-button primary-button-purple" onClick={openChangePassword}>
            Change password
          </button>
        </div>

        <div className="profile-layout">
          <div className="profile-aside">
            <button
              type="button"
              className="profile-avatar-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload profile image"
            >
              {profileAvatar ? (
                <img className="profile-avatar-img" src={profileAvatar} alt="Profile" />
              ) : (
                <span className="profile-avatar-initials" aria-hidden="true">
                  {getInitials(profileFirstName, profileLastName)}
                </span>
              )}
              <span className="profile-avatar-cta">Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onPickAvatar(f)
                // allow re-selecting same file
                e.currentTarget.value = ''
              }}
            />
          </div>

          <div className="profile-form">
            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">First Name</label>
                <input
                  className="input"
                  placeholder="First name"
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Last Name</label>
                <input
                  className="input"
                  placeholder="Last name"
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Phone Number</label>
                <input
                  className="input"
                  placeholder="+1234567890"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Email</label>
                <input
                  className="input"
                  placeholder="Email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Country</label>
                <input
                  className="input"
                  placeholder="Country"
                  value={profileCountry}
                  onChange={(e) => setProfileCountry(e.target.value)}
                />
              </div>
              {profile && (
                <div className="field">
                  <label className="field-label">Account ID</label>
                  <div className="input-with-action">
                    <input className="input" readOnly value={profile.account_id} />
                    <button
                      type="button"
                      className="icon-button-sm"
                      aria-label="Copy account id"
                      title="Copy"
                      onClick={(e) => copyToClipboard(profile.account_id, e.currentTarget)}
                    >
                      <Icon name="copy" size={20} />
                    </button>
                  </div>
                </div>
              )}
              <div className="field">
                <label className="field-label">Address 1</label>
                <input
                  className="input"
                  placeholder="Street address"
                  value={profileAddress1}
                  onChange={(e) => setProfileAddress1(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Address 2</label>
                <input
                  className="input"
                  placeholder="Apt, suite, etc. (optional)"
                  value={profileAddress2}
                  onChange={(e) => setProfileAddress2(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Zip Code</label>
                <input
                  className="input"
                  placeholder="Zip / Postal code"
                  value={profileZipCode}
                  onChange={(e) => setProfileZipCode(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Province/Region/State</label>
                <input
                  className="input"
                  placeholder="State / Region"
                  value={profileState}
                  onChange={(e) => setProfileState(e.target.value)}
                />
              </div>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={profileTwoFa}
                onChange={(e) => setProfileTwoFa(e.target.checked)}
              />
              Enable Two-Factor Authentication for account security
            </label>

            <div className="profile-actions">
              <button
                type="button"
                className="primary-button primary-button-purple profile-update-btn"
                onClick={saveProfile}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="company-grid">
        <section className="panel company-panel">
          <div className="panel-header">
            <div>
              <h3>Company</h3>
              <p>Manage organization details used for invoices</p>
            </div>
            <button
              type="button"
              className="primary-button primary-button-purple"
              onClick={() => setIsOrgModalOpen(true)}
            >
              Organization details
            </button>
          </div>

          {organization ? (
            <div className="form-grid-2">
              <div className="meta-row">
                <span>Organization Name</span>
                <strong>{organization.organization_name}</strong>
              </div>
              <div className="meta-row">
                <span>Organization Number</span>
                <strong>{organization.organization_number}</strong>
              </div>
              <div className="meta-row">
                <span>Organization VAT ID</span>
                <strong>{organization.organization_vat_id}</strong>
              </div>
              <div className="meta-row">
                <span>Organization Domain</span>
                <strong>{organization.organization_domain}</strong>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center' }}>Loading organization details...</div>
          )}
        </section>

        <section className="panel danger-panel">
          <div className="panel-header">
            <div>
              <h3>Delete account</h3>
              <p>Permanently remove your account and associated data.</p>
            </div>
          </div>

          <button type="button" className="danger-button" onClick={openDeleteAccount}>
            Delete account
          </button>
        </section>
      </div>

      {isOrgModalOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Organization Details"
          onMouseDown={() => setIsOrgModalOpen(false)}
        >
          <div className="modal modal-lg" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Organization Details</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setIsOrgModalOpen(false)}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-grid-2">
                <div className="field">
                  <label className="field-label">Organization Name*</label>
                  <input
                    className="input"
                    placeholder="Organization Name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Organization Number</label>
                  <input
                    className="input"
                    placeholder="Organization Number"
                    value={orgNumber}
                    onChange={(e) => setOrgNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-grid-2">
                <div className="field">
                  <label className="field-label">Organization VAT Id*</label>
                  <input
                    className="input"
                    placeholder="VAT ID"
                    value={orgVatId}
                    onChange={(e) => setOrgVatId(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Organization Domain*</label>
                  <input
                    className="input"
                    placeholder="example.com"
                    value={orgDomain}
                    onChange={(e) => setOrgDomain(e.target.value)}
                  />
                </div>
              </div>

              <label className="checkbox-row">
                <input type="checkbox" defaultChecked />
                Do you want to show this information on the invoice?
              </label>
            </div>

            <div className="modal-footer modal-footer-center">
              <button
                type="button"
                className="modal-save"
                onClick={saveOrganization}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Organisation'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isGenerateKeyModalOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Generate New Key"
          onMouseDown={() => {
            if (!newlyCreatedKey) {
              setIsGenerateKeyModalOpen(false)
            }
          }}
        >
          <div className="modal modal-lg" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {newlyCreatedKey ? 'API Key Created Successfully' : 'Generate New Key'}
              </h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => {
                  setIsGenerateKeyModalOpen(false)
                  setNewlyCreatedKey(null)
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="modal-body">
              {newlyCreatedKey ? (
                <>
                  <div className="callout" style={{ marginBottom: '1.5rem', backgroundColor: '#fef3c7', borderColor: '#fde68a' }}>
                    <span className="callout-icon" aria-hidden="true">
                      <Icon name="alert" size={18} />
                    </span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: '#92400e' }}>
                        ⚠️ Important: Copy your API key and secret key now. These values will not be shown again.
                      </p>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">API Key</label>
                    <div className="input-with-action">
                      <input
                        className="input"
                        readOnly
                        value={newlyCreatedKey.api_key}
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        className="icon-button-sm"
                        aria-label="Copy API key"
                        title="Copy"
                        onClick={(e) => copyToClipboard(newlyCreatedKey.api_key, e.currentTarget)}
                      >
                        <Icon name="copy" size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Secret Key</label>
                    <div className="input-with-action">
                      <input
                        className="input"
                        readOnly
                        value={newlyCreatedKey.api_secret}
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        className="icon-button-sm"
                        aria-label="Copy secret key"
                        title="Copy"
                        onClick={(e) => copyToClipboard(newlyCreatedKey.api_secret, e.currentTarget)}
                      >
                        <Icon name="copy" size={20} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <label className="field-label">Key name</label>
                    <input
                      className="input"
                      placeholder="e.g. Send Document"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Expiration</label>
                    <select
                      className="input"
                      value={expirationMode}
                      onChange={(e) => setExpirationMode(e.target.value as 'never' | 'date')}
                    >
                      <option value="never">Never expires</option>
                      <option value="date">Expires on date</option>
                    </select>
                  </div>

                  {expirationMode === 'date' ? (
                    <div className="field">
                      <label className="field-label">Select date</label>
                      <div className="input-with-icon">
                        <span className="input-icon" aria-hidden="true">
                          <Icon name="calendar" size={18} />
                        </span>
                        <input
                          type="date"
                          className="input"
                          value={expiresOn}
                          onChange={(e) => setExpiresOn(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : null}

                  {createKeyError ? (
                    <div className="key-error-banner">
                      <div className="key-error-emoji">🔐</div>
                      <div className="key-error-body">
                        <p className="key-error-message">{createKeyError}</p>
                        <button
                          type="button"
                          className="key-error-upgrade-btn"
                          onClick={() => {
                            setIsGenerateKeyModalOpen(false)
                            navigate('/billing')
                          }}
                        >
                          Upgrade to Enterprise →
                        </button>
                      </div>
                      <button
                        type="button"
                        className="key-error-dismiss"
                        aria-label="Dismiss"
                        onClick={() => setCreateKeyError(null)}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="modal-footer">
              {newlyCreatedKey ? (
                <button
                  type="button"
                  className="modal-save"
                  onClick={() => {
                    setIsGenerateKeyModalOpen(false)
                    setNewlyCreatedKey(null)
                  }}
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="modal-cancel"
                    onClick={() => setIsGenerateKeyModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="button" className="modal-save" onClick={createNewKey}>
                    Continue
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isRegenerateKeyModalOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Regenerate API Key"
          onMouseDown={() => {
            if (!newlyCreatedKey) {
              setIsRegenerateKeyModalOpen(false)
            }
          }}
        >
          <div className="modal modal-lg" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {newlyCreatedKey ? 'API Key Regenerated Successfully' : 'Regenerate API Key'}
              </h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => {
                  setIsRegenerateKeyModalOpen(false)
                  setNewlyCreatedKey(null)
                  setRegeneratingKeyId(null)
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="modal-body">
              {newlyCreatedKey ? (
                <>
                  <div className="callout" style={{ marginBottom: '1.5rem', backgroundColor: '#fef3c7', borderColor: '#fde68a' }}>
                    <span className="callout-icon" aria-hidden="true">
                      <Icon name="alert" size={18} />
                    </span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: '#92400e' }}>
                        ⚠️ Important: Copy your new API key and secret key now. These values will not be shown again.
                      </p>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">API Key</label>
                    <div className="input-with-action">
                      <input
                        className="input"
                        readOnly
                        value={newlyCreatedKey.api_key}
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        className="icon-button-sm"
                        aria-label="Copy API key"
                        title="Copy"
                        onClick={(e) => copyToClipboard(newlyCreatedKey.api_key, e.currentTarget)}
                      >
                        <Icon name="copy" size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Secret Key</label>
                    <div className="input-with-action">
                      <input
                        className="input"
                        readOnly
                        value={newlyCreatedKey.api_secret}
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        className="icon-button-sm"
                        aria-label="Copy secret key"
                        title="Copy"
                        onClick={(e) => copyToClipboard(newlyCreatedKey.api_secret, e.currentTarget)}
                      >
                        <Icon name="copy" size={20} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <label className="field-label">Key name</label>
                    <input
                      className="input"
                      placeholder="e.g. Send Document"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Expiration</label>
                    <select
                      className="input"
                      value={expirationMode}
                      onChange={(e) => setExpirationMode(e.target.value as 'never' | 'date')}
                    >
                      <option value="never">Never expires</option>
                      <option value="date">Expires on date</option>
                    </select>
                  </div>

                  {expirationMode === 'date' ? (
                    <div className="field">
                      <label className="field-label">Select date</label>
                      <div className="input-with-icon">
                        <span className="input-icon" aria-hidden="true">
                          <Icon name="calendar" size={18} />
                        </span>
                        <input
                          type="date"
                          className="input"
                          value={expiresOn}
                          onChange={(e) => setExpiresOn(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : null}

                  {regenerateKeyError ? (
                    <div className="key-error-banner">
                      <div className="key-error-emoji">🔐</div>
                      <div className="key-error-body">
                        <p className="key-error-message">{regenerateKeyError}</p>
                        <button
                          type="button"
                          className="key-error-upgrade-btn"
                          onClick={() => {
                            setIsRegenerateKeyModalOpen(false)
                            navigate('/billing')
                          }}
                        >
                          Upgrade to Enterprise →
                        </button>
                      </div>
                      <button
                        type="button"
                        className="key-error-dismiss"
                        aria-label="Dismiss"
                        onClick={() => setRegenerateKeyError(null)}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="modal-footer">
              {newlyCreatedKey ? (
                <button
                  type="button"
                  className="modal-save"
                  onClick={() => {
                    setIsRegenerateKeyModalOpen(false)
                    setNewlyCreatedKey(null)
                    setRegeneratingKeyId(null)
                  }}
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="modal-cancel"
                    onClick={() => {
                      setIsRegenerateKeyModalOpen(false)
                      setRegeneratingKeyId(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button type="button" className="modal-save" onClick={regenerateKey}>
                    Regenerate
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isChangePasswordOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Change password"
          onMouseDown={() => setIsChangePasswordOpen(false)}
        >
          <div className="modal modal-sm" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close modal-close-plain"
              aria-label="Close"
              onClick={() => setIsChangePasswordOpen(false)}
            >
              <Icon name="x" size={18} />
            </button>

            <div className="password-form">
              <div className="password-field">
                <input
                  className="input input-right-icon"
                  placeholder="Old password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="input-right-btn"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowCurrentPassword((v) => !v)}
                >
                  <Icon name={showCurrentPassword ? 'eye' : 'eyeOff'} size={18} />
                </button>
              </div>

              <div className="password-field">
                <input
                  className="input input-right-icon input-right-icon-two"
                  placeholder="New password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <div className="input-right-actions">
                  <button
                    type="button"
                    className="input-right-btn"
                    aria-label="Generate strong password"
                    title="Generate password"
                    onClick={onGeneratePassword}
                  >
                    <Icon name="sparkles" size={18} />
                  </button>
                  <button
                    type="button"
                    className="input-right-btn"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowNewPassword((v) => !v)}
                  >
                    <Icon name={showNewPassword ? 'eye' : 'eyeOff'} size={18} />
                  </button>
                </div>
              </div>

              <div className="password-field">
                <input
                  className="input input-right-icon"
                  placeholder="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="input-right-btn"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  <Icon name={showConfirmPassword ? 'eye' : 'eyeOff'} size={18} />
                </button>
              </div>

              <button
                type="button"
                className="primary-button primary-button-purple password-submit"
                onClick={submitChangePassword}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteAccountOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Delete account"
          onMouseDown={() => setIsDeleteAccountOpen(false)}
        >
          <div className="modal modal-delete" onMouseDown={(e) => e.stopPropagation()}>
            <div className="delete-icon" aria-hidden="true">
              <Icon name="alert" size={64} />
            </div>

            <h3 className="delete-title">Are you sure you want to permanently remove this user</h3>

            <p className="delete-desc">
              This action is irreversible and will result in the user being permanently removed. By removing your
              account, all associated APIs, details, and data will be permanently deleted. Please confirm if you wish
              to proceed with the decision
            </p>

            <div className="delete-hint">Please enter 'Confirm' to delete</div>

            <input
              className="input"
              placeholder="For Delete please enter the 'Confirm'"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />

            <div className="delete-actions">
              <button
                type="button"
                className="danger-button"
                disabled={deleteConfirmText !== 'Confirm'}
                onClick={confirmDeleteAccount}
              >
                Delete User
              </button>
              <button type="button" className="modal-cancel" onClick={() => setIsDeleteAccountOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {copiedToast ? (
        <div
          className="toast toast-near"
          style={{
            left: copiedToast.x,
            top: copiedToast.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {copiedToast.text}
        </div>
      ) : null}
    </div>
  )
}

