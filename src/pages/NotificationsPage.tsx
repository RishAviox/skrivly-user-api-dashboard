import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteNotifications,
  fetchNotifications,
  markNotifications,
  NOTIFICATIONS_UPDATED_EVENT,
  type NotificationItem,
} from '../notifications/notifications'

export default function NotificationsPage() {
  const PAGE_SIZE = 16

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
  const selectAllRef = useRef<HTMLInputElement | null>(null)

  const loadNotifications = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const result = await fetchNotifications({ page: pageNum, limit: PAGE_SIZE })
      setNotifications(result.items)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setPage(result.page)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications(page)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const refresh = () => loadNotifications(page)
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh as EventListener)
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh as EventListener)
    }
  }, [page, loadNotifications])

  function goToPage(p: number) {
    setPage(p)
    loadNotifications(p)
    setSelectedIds({})
  }

  const pageIds = notifications.map((n) => n.id)
  const selectedPageIds = pageIds.filter((id) => selectedIds[id])
  const hasSelection = selectedPageIds.length > 0
  const allSelected = pageIds.length > 0 && selectedPageIds.length === pageIds.length
  const someSelected = selectedPageIds.length > 0 && !allSelected

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected
  }, [someSelected])

  const startIndex = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(page * PAGE_SIZE, totalCount)

  const pageButtons = useMemo(() => {
    if (totalPages <= 1) return []
    const windowSize = 5
    let start = Math.max(1, page - 1)
    let end = Math.min(totalPages, start + windowSize - 1)
    start = Math.max(1, end - windowSize + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => ({ ...prev, [id]: checked }))
  }

  function setAllOnPage(checked: boolean) {
    setSelectedIds((prev) => {
      const next = { ...prev }
      for (const id of pageIds) next[id] = checked
      return next
    })
  }

  function clearSelection() {
    setSelectedIds({})
  }

  async function bulkMark(read: boolean) {
    if (!hasSelection) return
    await markNotifications(selectedPageIds, read)
    clearSelection()
    loadNotifications(page)
  }

  async function bulkDelete() {
    if (!hasSelection) return
    await deleteNotifications(selectedPageIds)
    clearSelection()
    loadNotifications(page)
  }

  return (
    <section className="panel notifications-panel">
      <div className="panel-header">
        <div>
          <h3>Notifications</h3>
          <p>Track API usage and system events</p>
        </div>
        <div className="panel-actions notif-page-actions">
          <label className="notif-page-select-all">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={(e) => setAllOnPage(e.target.checked)}
            />
            Select page
          </label>

          <button type="button" className="ghost-button" disabled={!hasSelection} onClick={() => bulkMark(true)}>
            Mark read
          </button>
          <button type="button" className="ghost-button" disabled={!hasSelection} onClick={() => bulkMark(false)}>
            Mark unread
          </button>
          <button type="button" className="ghost-button danger" disabled={!hasSelection} onClick={bulkDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="table notifications-table">
        <div className="table-row table-header table-notifications">
          <span>Select</span>
          <span>Title</span>
          <span>Message</span>
          <span>Type</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        {loading ? (
          <div className="notif-page-empty">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notif-page-empty">No notifications yet.</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="table-row table-notifications">
              <span>
                <input
                  type="checkbox"
                  aria-label="Select notification"
                  checked={Boolean(selectedIds[n.id])}
                  onChange={(e) => toggleSelected(n.id, e.target.checked)}
                />
              </span>
              <span className="bold">{n.title}</span>
              <span className="muted-pill">{n.message || '-'}</span>
              <span className="muted-pill">{n.type}</span>
              <span>{new Date(n.createdAt).toLocaleString()}</span>
              <span className={`status ${n.read ? 'paid' : 'pending'}`}>{n.read ? 'Read' : 'Unread'}</span>
            </div>
          ))
        )}
      </div>

      <div className="table-footer">
        <span>
          Showing {startIndex} to {endIndex} of {totalCount.toLocaleString()} notifications
        </span>
        {totalPages > 1 ? (
          <div className="pagination">
            <button
              type="button"
              className="ghost-button"
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            {pageButtons.map((p) => (
              <button
                key={p}
                type="button"
                className={`page-btn${p === page ? ' active' : ''}`}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="ghost-button"
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
