import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/icons'
import { ApiService } from '../services/api'
import type { Profile } from '../types/api'
import {
  deleteNotifications,
  fetchNotifications,
  fetchUnreadCount,
  markNotifications,
  NOTIFICATIONS_UPDATED_EVENT,
  toggleNotificationRead,
  type NotificationItem,
} from '../notifications/notifications'
import skrivlyLogoMark from '../assets/skrivly logo 1 (1).svg'
import skrivlyLogoFull from '../assets/skrivly logo.svg'

function NavItem({
  to,
  icon,
  label,
  end,
  isCollapsed,
}: {
  to: string
  icon:
  | 'dashboard'
  | 'apiUsage'
  | 'billing'
  | 'docs'
  | 'settings'
  label: string
  end?: boolean
  isCollapsed?: boolean
}) {
  const isExternal = to.startsWith('http') || to.startsWith('//')

  if (isExternal) {
    return (
      <div className="nav-item-wrapper">
        <a
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item"
          title={isCollapsed ? label : undefined}
        >
          <span className="nav-icon" aria-hidden="true">
            <Icon name={icon} size={22} />
          </span>
          {!isCollapsed && <span className="nav-label">{label}</span>}
        </a>
        {isCollapsed && (
          <div className="tooltip" role="tooltip">
            {label}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="nav-item-wrapper">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        title={isCollapsed ? label : undefined}
      >
        <span className="nav-icon" aria-hidden="true">
          <Icon name={icon} size={22} />
        </span>
        {!isCollapsed && <span className="nav-label">{label}</span>}
      </NavLink>
      {isCollapsed && (
        <div className="tooltip" role="tooltip">
          {label}
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
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
      if (!raw) return { firstName: '', lastName: '', email: '' }
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

  const [profile, setProfile] = useState<StoredProfile>(() => readProfile())

  // Fetch profile from API on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await ApiService.getProfile()
        if (response.status === 'success' && response.data) {
          const apiProfile: Profile = response.data
          const updatedProfile: StoredProfile = {
            firstName: apiProfile.first_name || '',
            lastName: apiProfile.last_name || '',
            email: apiProfile.email || '',
            avatarDataUrl: apiProfile.profile_picture || undefined,
          }
          setProfile(updatedProfile)
          // Also update localStorage to keep it in sync
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile))
          // Dispatch event to notify other components
          window.dispatchEvent(new Event('skrivly:profile-updated'))
        }
      } catch (err) {
        console.error('Failed to fetch profile in AppLayout:', err)
        // Fall back to localStorage if API fails
        const stored = readProfile()
        setProfile(stored)
      }
    }

    fetchProfile()
  }, [])

  useEffect(() => {
    const refresh = () => setProfile(readProfile())
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PROFILE_STORAGE_KEY) return
      refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('skrivly:profile-updated', refresh as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('skrivly:profile-updated', refresh as EventListener)
    }
  }, [])

  const fullName = `${profile.firstName} ${profile.lastName}`.trim()
  const initials =
    (profile.firstName?.trim().slice(0, 1).toUpperCase() ?? '') +
    (profile.lastName?.trim().slice(0, 1).toUpperCase() ?? '')

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<Record<string, boolean>>({})
  const notifWrapRef = useRef<HTMLDivElement | null>(null)
  const selectAllRef = useRef<HTMLInputElement | null>(null)

  const shownNotifications = notifications.slice(0, 50)
  const shownIds = shownNotifications.map((n) => n.id)
  const selectedShownIds = shownIds.filter((id) => selectedNotificationIds[id])
  const hasSelection = selectedShownIds.length > 0
  const allSelected = shownIds.length > 0 && selectedShownIds.length === shownIds.length
  const someSelected = selectedShownIds.length > 0 && !allSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const refreshNotifications = async () => {
    try {
      const [listResult, count] = await Promise.all([
        fetchNotifications({ page: 1, limit: 50 }),
        fetchUnreadCount(),
      ])
      setNotifications(listResult.items)
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    refreshNotifications()

    // Poll unread count every 30s so the badge stays current
    const interval = setInterval(async () => {
      try {
        const count = await fetchUnreadCount()
        setUnreadCount(count)
      } catch { /* ignore */ }
    }, 30_000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications as EventListener)
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!isNotificationsOpen) return

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (notifWrapRef.current && !notifWrapRef.current.contains(target)) {
        setIsNotificationsOpen(false)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsNotificationsOpen(false)
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isNotificationsOpen])

  function toggleSelectedNotification(id: string, checked: boolean) {
    setSelectedNotificationIds((prev) => {
      const next = { ...prev }
      next[id] = checked
      return next
    })
  }

  function setAllShownSelected(checked: boolean) {
    setSelectedNotificationIds((prev) => {
      const next = { ...prev }
      for (const id of shownIds) next[id] = checked
      return next
    })
  }

  function clearSelection() {
    setSelectedNotificationIds({})
  }

  async function bulkMark(read: boolean) {
    if (!hasSelection) return
    await markNotifications(selectedShownIds, read)
    clearSelection()
    refreshNotifications()
  }

  async function bulkDelete() {
    if (!hasSelection) return
    await deleteNotifications(selectedShownIds)
    clearSelection()
    refreshNotifications()
  }

  function logout() {
    localStorage.removeItem(PROFILE_STORAGE_KEY)
    localStorage.removeItem('skrivly_developer_jwt')
    localStorage.removeItem('skrivly_refresh_token')
    localStorage.removeItem('skrivly_normal_user_jwt')
    window.dispatchEvent(new Event('skrivly:profile-updated'))
    navigate('/login', { replace: true })
  }

  return (
    <div className={`dashboard ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <img
                src={isCollapsed ? skrivlyLogoMark : skrivlyLogoFull}
                alt="Skrivly"
                className="brand-logo"
              />
            </span>
          </div>

          <div className="nav-item-wrapper sidebar-toggle-wrapper">
            <button
              className="sidebar-toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              type="button"
            >
              <Icon name={isCollapsed ? 'chevronRight' : 'chevronLeft'} size={18} />
            </button>
            {isCollapsed && (
              <div className="tooltip" role="tooltip">
                Expand sidebar
              </div>
            )}
          </div>
        </div>

        <nav className="nav">
          <NavItem to="/" end icon="dashboard" label="Dashboard" isCollapsed={isCollapsed} />
          <NavItem to="/usage" icon="apiUsage" label="API Usage" isCollapsed={isCollapsed} />
          <NavItem to="/billing" icon="billing" label="Billing" isCollapsed={isCollapsed} />
          <NavItem to="/docs" icon="docs" label="Documentation" isCollapsed={isCollapsed} />
          <NavItem to="/settings" icon="settings" label="Settings" isCollapsed={isCollapsed} />
        </nav>

        <div className="nav-item-wrapper sidebar-footer">
          <button
            type="button"
            className="nav-item sidebar-logout"
            onClick={logout}
            aria-label="Log out"
            title={isCollapsed ? 'Log out' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              <Icon name="logOut" size={22} />
            </span>
            {!isCollapsed && <span className="nav-label">Log out</span>}
          </button>
          {isCollapsed && (
            <div className="tooltip" role="tooltip">
              Log out
            </div>
          )}
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="title-block">
            <h1>Overview</h1>
            <p> Rexett AB - Enterprise API</p>
          </div>

          <div className="topbar-actions">
            <div className="notif-wrap" ref={notifWrapRef}>
              <button
                className="icon-button"
                aria-label="Notifications"
                aria-haspopup="menu"
                aria-expanded={isNotificationsOpen}
                type="button"
                onClick={() => {
                  const willOpen = !isNotificationsOpen
                  setIsNotificationsOpen(willOpen)
                  if (willOpen) refreshNotifications()
                }}
              >
                <Icon name="bell" size={22} />
                {unreadCount > 0 ? <span className="dot" /> : null}
              </button>

              {isNotificationsOpen ? (
                <div className="notif-panel" role="menu" aria-label="Notifications">
                  <div className="notif-header">
                    <div>
                      <div className="notif-title">Notifications</div>
                      <div className="notif-sub">{unreadCount} unread</div>
                    </div>
                    <button
                      type="button"
                      className="link-button notif-view-all"
                      onClick={() => {
                        setIsNotificationsOpen(false)
                        navigate('/notifications')
                      }}
                    >
                      View all
                    </button>
                  </div>

                  <div className="notif-bulk">
                    <label className="notif-select-all">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => setAllShownSelected(e.target.checked)}
                      />
                      Select
                    </label>

                    <div className="notif-actions">
                      <button type="button" className="ghost-button" disabled={!hasSelection} onClick={() => bulkMark(true)}>
                        Mark read
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={!hasSelection}
                        onClick={() => bulkMark(false)}
                      >
                        Mark unread
                      </button>
                      <button type="button" className="ghost-button danger" disabled={!hasSelection} onClick={bulkDelete}>
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="notif-list">
                    {shownNotifications.length === 0 ? (
                      <div className="notif-empty">No notifications yet.</div>
                    ) : (
                      shownNotifications.map((n) => (
                        <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                          <input
                            type="checkbox"
                            aria-label="Select notification"
                            checked={Boolean(selectedNotificationIds[n.id])}
                            onChange={(e) => toggleSelectedNotification(n.id, e.target.checked)}
                          />
                          <button
                            type="button"
                            className="notif-item-main"
                            onClick={async () => {
                              await toggleNotificationRead(n.id, n.read)
                              refreshNotifications()
                            }}
                            title="Toggle read/unread"
                          >
                            <div className="notif-item-top">
                              <div className="notif-item-title">{n.title}</div>
                              {!n.read ? <span className="notif-unread-dot" aria-hidden="true" /> : null}
                            </div>
                            {n.message ? <div className="notif-item-message">{n.message}</div> : null}
                            <div className="notif-item-time">{new Date(n.createdAt).toLocaleString()}</div>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="user">
              <div className={`avatar${profile.avatarDataUrl ? ' avatar-image' : ''}`}>
                {profile.avatarDataUrl ? (
                  <img src={profile.avatarDataUrl} alt={fullName || 'User'} />
                ) : (
                  initials || 'U'
                )}
              </div>
              <div className="user-meta">
                <strong>{fullName || 'User'}</strong>
                <span>{profile.email || 'user@example.com'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

