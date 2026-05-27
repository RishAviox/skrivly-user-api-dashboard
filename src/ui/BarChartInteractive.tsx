import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'

type Datum = Record<string, number | string>

type Props<T extends Datum> = {
  title: string
  subtitle: string
  data: T[]
  series: Array<{
    key: keyof T & string
    label: string
    color: string
  }>
  /** should point to an ISO date string key, like "2026-01-01" */
  xKey: keyof T & string
  rightAction?: React.ReactNode
}

function formatShortDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function BarChartInteractive<T extends Datum>({
  title,
  subtitle,
  data,
  series,
  xKey,
  rightAction,
}: Props<T>) {
  const [activeKey, setActiveKey] = React.useState(series[0]?.key ?? '')

  const totals = React.useMemo(() => {
    const out: Record<string, number> = {}
    for (const s of series) {
      out[s.key] = data.reduce((acc, curr) => acc + (Number(curr[s.key]) || 0), 0)
    }
    return out
  }, [data, series])

  const activeSeries = series.find((s) => s.key === activeKey) ?? series[0]

  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="panel-actions">{rightAction}</div>
      </div>

      <div className="chart-tabs">
        {series.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`chart-tab${activeKey === s.key ? ' active' : ''}`}
            onClick={() => setActiveKey(s.key)}
          >
            <span className="chart-tab-label">{s.label}</span>
            <span className="chart-tab-value">{(totals[s.key] ?? 0).toLocaleString()}</span>
          </button>
        ))}
      </div>

      <div className="rechart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#eef2f7" />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={28}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => formatShortDate(String(value))}
            />
            <Tooltip
              cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
              content={({ active, label, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                const value = payload[0]?.value as number
                return (
                  <div className="chart-tooltip">
                    <div className="chart-tooltip-label">
                      {new Date(String(label)).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="chart-tooltip-row">
                      <span className="dot" style={{ background: activeSeries.color }} />
                      <span className="name">{activeSeries.label}</span>
                      <span className="val">{Number(value).toLocaleString()}</span>
                    </div>
                  </div>
                )
              }}
            />
            {activeSeries ? (
              <Bar
                dataKey={activeSeries.key}
                fill={activeSeries.color}
                radius={[6, 6, 0, 0]}
              />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

