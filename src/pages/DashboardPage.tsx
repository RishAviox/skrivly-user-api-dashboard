import { useEffect, useState } from 'react'
import { Icon } from '../ui/icons'
import BarChartInteractive from '../ui/BarChartInteractive'
import { useNavigate } from 'react-router-dom'
import { ApiService } from '../services/api'
import type { DashboardData } from '../types/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<7 | 14 | 31>(31)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        setError(null)
        const response = await ApiService.getDashboard(period)
        if (response.status === 'success' && response.data) {
          setDashboardData(response.data)
        } else {
          setError(response.message || 'Failed to load dashboard data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [period])

  const statCards = dashboardData
    ? [
        {
          title: 'API Requests',
          value: dashboardData.overview.api_requests.value.toLocaleString(),
          meta: dashboardData.overview.api_requests.period,
          badge:
            (dashboardData.overview.api_requests.trend === 'increase' ? '+' : '-') +
            `${Math.abs(dashboardData.overview.api_requests.trend_percentage).toFixed(1)}%`,
          badgeTone: dashboardData.overview.api_requests.trend === 'increase' ? 'success' : 'danger',
          icon: 'stack' as const,
        },
        {
          title: 'Monthly Cost',
          value: `$${dashboardData.overview.monthly_cost.value.toLocaleString()}`,
          meta: `Billing on ${dashboardData.overview.monthly_cost.billing_date}`,
          badge: dashboardData.overview.monthly_cost.month,
          badgeTone: 'neutral',
          icon: 'coins' as const,
        },
        {
          title: 'Active Keys',
          value: dashboardData.overview.active_keys.value.toString(),
          meta: dashboardData.overview.active_keys.note,
          badge: 'Manage',
          badgeTone: 'link',
          icon: 'key' as const,
        },
        {
          title: 'Failed Requests',
          value: dashboardData.overview.failed_requests.value.toString(),
          meta: dashboardData.overview.failed_requests.period,
          badge: `${dashboardData.overview.failed_requests.percentage.toFixed(2)}%`,
          badgeTone: 'danger',
          icon: 'alert' as const,
        },
      ]
    : []

  const chartData = dashboardData
    ? dashboardData.daily_api_usage.chart_data.map((item) => ({
        date: item.date,
        requests: item.requests,
        errors: item.failed,
      }))
    : []

  const costData = dashboardData
    ? dashboardData.daily_cost.chart_data.map((item) => ({
        date: item.date,
        cost: item.cost,
      }))
    : []

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div className="dashboard-page">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <section className="stat-grid">
        {statCards.map((card) => (
          <div key={card.title} className="stat-card">
            <div className="stat-top">
              <div className={`stat-icon ${card.icon}`} aria-hidden="true">
                <Icon name={card.icon} size={26} />
              </div>
              <span className={`badge ${card.badgeTone}`}>{card.badge}</span>
            </div>
            <h3>{card.title}</h3>
            <h2>{card.value}</h2>
            <p>{card.meta}</p>
          </div>
        ))}
      </section>

      <div className="charts-grid">
        <BarChartInteractive
          title={dashboardData?.daily_api_usage.title || 'Daily API Usage'}
          subtitle={dashboardData?.daily_api_usage.subtitle || 'Request volume over the last 31 days'}
          data={chartData}
          xKey="date"
          series={[
            { key: 'requests', label: 'Requests', color: '#2d5bff' },
            { key: 'errors', label: 'Failed', color: '#ef4444' },
          ]}
          rightAction={
            <>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value) as 7 | 14 | 31)}
              >
                <option value="31">Last 31 days</option>
                <option value="14">Last 14 days</option>
                <option value="7">Last 7 days</option>
              </select>
              <button type="button" className="link-button" onClick={() => navigate('/usage')}>
                View Details
              </button>
            </>
          }
        />
        <BarChartInteractive
          title={dashboardData?.daily_cost.title || 'Daily Cost'}
          subtitle={dashboardData?.daily_cost.subtitle || 'Estimated cost over the last 31 days'}
          data={costData}
          xKey="date"
          series={[
            { key: 'cost', label: 'Cost ($)', color: '#16a34a' },
          ]}
          rightAction={
            <>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value) as 7 | 14 | 31)}
              >
                <option value="31">Last 31 days</option>
                <option value="14">Last 14 days</option>
                <option value="7">Last 7 days</option>
              </select>
              <button type="button" className="link-button" onClick={() => navigate('/usage')}>
                View Details
              </button>
            </>
          }
        />
      </div>
    </div>
  )
}

