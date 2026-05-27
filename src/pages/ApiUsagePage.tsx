import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../ui/icons'
import { addNotification } from '../notifications/notifications'
import { ApiService } from '../services/api'
import type { UsageLog } from '../types/api'

export default function ApiUsagePage() {
  const PAGE_SIZE = 50
  const [page, setPage] = useState(1)
  const [apiFilter, setApiFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('') // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>('') // YYYY-MM-DD
  const [statusFilter, setStatusFilter] = useState<'success' | 'failed' | 'all'>('all')
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([])
  const [allApiNames, setAllApiNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Map API names to icons
  function getIconForApiName(apiName: string): 'doc' | 'shield' | 'check' {
    const lower = apiName.toLowerCase()
    if (lower.includes('bankid')) return 'shield'
    if (lower.includes('sign') || lower.includes('esign')) return 'check'
    return 'doc'
  }

  useEffect(() => {
    async function fetchUsageLogs() {
      try {
        setLoading(true)
        setError(null)
        const response = await ApiService.getUsageLog({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          apiName: apiFilter !== 'all' ? apiFilter.toLowerCase().replace(/\s+/g, '_') : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page,
          pageSize: PAGE_SIZE,
        })
        if (response.status === 'success' && response.data) {
          setUsageLogs(response.data.logs)
          setTotalCount(response.data.pagination.total_count)
          setTotalPages(response.data.pagination.total_pages)
          // Accumulate all seen API names so the dropdown never loses options
          // when a filter is applied and usageLogs changes.
          const newNames = response.data.logs.map((l) => l.api_name)
          if (newNames.length > 0) {
            setAllApiNames((prev) => {
              const merged = Array.from(new Set([...prev, ...newNames])).sort((a, b) => a.localeCompare(b))
              return merged
            })
          }
        } else {
          setError(response.message || 'Failed to load usage logs')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage logs')
      } finally {
        setLoading(false)
      }
    }
    fetchUsageLogs()
  }, [page, apiFilter, startDate, endDate, statusFilter])

  // Notification logic for new usage logs
  useEffect(() => {
    if (usageLogs.length === 0) return

    const NOTIFIED_KEY = 'skrivly_usage_notified_v1'
    const parsed = (() => {
      try {
        const raw = localStorage.getItem(NOTIFIED_KEY)
        const v = raw ? (JSON.parse(raw) as unknown) : null
        return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
      } catch {
        return []
      }
    })()

    const known = new Set<string>(parsed)
    let changed = false

    const makeKey = (log: UsageLog) =>
      `${log.date}T${log.time}|${log.client_id}|${log.endpoint}|${log.status}|${log.requests}`

    for (const log of usageLogs) {
      const key = makeKey(log)
      if (known.has(key)) continue
      known.add(key)
      changed = true

      const createdAt = Date.parse(`${log.date}T${log.time}:00`)
      addNotification({
        type: 'api',
        title: `API used: ${log.api_name}`,
        message: `${log.endpoint} • ${log.requests} requests • ${log.status}`,
        createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
        read: false,
      })
    }

    if (changed) {
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(known)))
    }
  }, [usageLogs])

  // apiOptions comes from the accumulated allApiNames, not the current page,
  // so selecting a filter doesn't wipe out the dropdown options.
  const apiOptions = allApiNames

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

  async function exportCsv() {
    try {
      const csv = await ApiService.exportUsageLog({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        apiName: apiFilter !== 'all' ? apiFilter.toLowerCase().replace(/\s+/g, '_') : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_')
      a.download = `api_usage_log_${timestamp}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      addNotification({
        type: 'system',
        title: 'Exported API usage CSV',
        message: `${apiFilter === 'all' ? 'All APIs' : apiFilter} • CSV downloaded`,
        createdAt: Date.now(),
        read: false,
      })
    } catch (err) {
      addNotification({
        type: 'system',
        title: 'Export failed',
        message: err instanceof Error ? err.message : 'Failed to export CSV',
        createdAt: Date.now(),
        read: false,
      })
    }
  }

  return (
    <section className="panel usage-panel">
      <div className="panel-header">
        <div>
          <h3>API Usage Log</h3>
          <p>Detailed request history and costs</p>
        </div>
        <div className="panel-actions">
          <div className="input-with-icon">
            <span className="input-icon" aria-hidden="true">
              <Icon name="calendar" size={18} />
            </span>
            <div className="date-range">
              <input
                type="date"
                className="input date-range-input"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(1)
                }}
                aria-label="Start date"
              />
              <span className="date-range-sep">–</span>
              <input
                type="date"
                className="input date-range-input"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(1)
                }}
                aria-label="End date"
              />
            </div>
          </div>
          <select
            value={apiFilter}
            onChange={(e) => {
              setApiFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All APIs</option>
            {apiOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button type="button" className="primary-button primary-button-purple" onClick={exportCsv}>
            <Icon name="downloadTray" size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="table">
        <div className="table-row table-header table-usage">
          <span>API Name</span>
          <span>Client ID</span>
          <span>Endpoint</span>
          <span>Requests</span>
          <span>Price / Req</span>
          <span>Total Cost</span>
          <span>Date</span>
          <span>Time</span>
          <span>Status</span>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading usage logs...</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>
        ) : usageLogs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>No usage logs found</div>
        ) : (
          usageLogs.map((log, index) => {
            const icon = getIconForApiName(log.api_name)
            return (
              <div key={`${log.id}-${index}`} className="table-row table-usage">
                <div className="table-cell">
                  <span className={`row-icon ${icon}`} aria-hidden="true">
                    <Icon name={icon} size={22} />
                  </span>
                  {log.api_name}
                </div>
                <span className="muted-pill" title={log.client_id}>{log.client_id}</span>
                <span className="muted-pill" title={log.endpoint}>{log.endpoint}</span>
                <span>{log.requests}</span>
                <span>${log.price_per_req.toFixed(2)}</span>
                <span className="bold">${log.total_cost.toFixed(2)}</span>
                <span>{log.date}</span>
                <span>{log.time}</span>
                <span className={`status ${log.status}`}>{log.status}</span>
              </div>
            )
          })
        )}
      </div>

      <div className="table-footer">
        <span>
          Showing {startIndex} to {endIndex} of {totalCount.toLocaleString()} requests
        </span>
        {totalCount > PAGE_SIZE ? (
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
  )
}

