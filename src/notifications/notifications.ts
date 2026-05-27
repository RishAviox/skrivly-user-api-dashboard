import { ApiService } from '../services/api'
import type { Notification } from '../types/api'

export type NotificationType = 'api' | 'system'

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  message?: string
  createdAt: number // epoch ms
  read: boolean
}

export const NOTIFICATIONS_UPDATED_EVENT = 'skrivly:notifications-updated'

function emitUpdated() {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT))
}

/** Convert API notification to local NotificationItem shape */
function toNotificationItem(n: Notification): NotificationItem {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    createdAt: new Date(n.created_at).getTime(),
    read: n.read,
  }
}

/** Fetch paginated notifications from the API */
export async function fetchNotifications(params?: {
  page?: number
  limit?: number
  unreadOnly?: boolean
}): Promise<{ items: NotificationItem[]; totalCount: number; totalPages: number; page: number }> {
  const response = await ApiService.listNotifications({
    page: params?.page,
    limit: params?.limit,
    unread_only: params?.unreadOnly,
  })

  if (response.status === 'success' && response.data) {
    return {
      items: response.data.notifications.map(toNotificationItem),
      totalCount: response.data.total,
      totalPages: response.data.total_pages,
      page: response.data.page,
    }
  }

  return { items: [], totalCount: 0, totalPages: 1, page: 1 }
}

/** Fetch unread count for the bell icon badge */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const response = await ApiService.getUnreadCount()
    if (response.status === 'success' && response.data) {
      return response.data.unread_count
    }
  } catch {
    // Silently fail for badge count
  }
  return 0
}

/** Mark a single notification as read or unread */
export async function markNotificationRead(id: string, read: boolean): Promise<void> {
  await ApiService.markNotification(id, read)
  emitUpdated()
}

/** Toggle a single notification's read state */
export async function toggleNotificationRead(id: string, currentRead: boolean): Promise<void> {
  await markNotificationRead(id, !currentRead)
}

/** Bulk mark multiple notifications as read/unread */
export async function markNotifications(ids: string[], read: boolean): Promise<void> {
  if (ids.length === 0) return
  await ApiService.bulkMarkNotifications({ ids, read })
  emitUpdated()
}

/** Bulk delete notifications */
export async function deleteNotifications(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await ApiService.bulkDeleteNotifications({ ids })
  emitUpdated()
}

/**
 * Client-side notification trigger.
 * Emits an update event so the UI refreshes from the API.
 * The backend is expected to create notifications server-side;
 * this function serves as a signal to refresh the notification list.
 */
export function addNotification(_input: Omit<NotificationItem, 'id'> & { id?: string }): void {
  emitUpdated()
}
