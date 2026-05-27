import type { CSSProperties } from 'react'

type Point = {
  label: string
  value: number
}

type Props = {
  title: string
  subtitle: string
  points: Point[]
  maxY: number
  yTicks?: number
  color?: string
  valueSuffix?: string
  rightAction?: React.ReactNode
  style?: CSSProperties
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function AreaChart({
  title,
  subtitle,
  points,
  maxY,
  yTicks = 6,
  color = '#2d5bff',
  valueSuffix,
  rightAction,
  style,
}: Props) {
  // SVG layout (roughly matches the screenshot proportions)
  const W = 720
  const H = 260
  const padL = 54
  const padR = 18
  const padT = 16
  const padB = 44

  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const safeMaxY = maxY <= 0 ? 1 : maxY
  const n = Math.max(1, points.length)

  const toX = (i: number) => padL + (i / (n - 1 || 1)) * plotW
  const toY = (v: number) => padT + (1 - clamp(v / safeMaxY, 0, 1)) * plotH

  const lineD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(p.value).toFixed(2)}`)
    .join(' ')

  const areaD =
    `${lineD} L ${toX(n - 1).toFixed(2)} ${(padT + plotH).toFixed(2)} L ${toX(0).toFixed(2)} ${(padT + plotH).toFixed(2)} Z`

  const ticks = Array.from({ length: yTicks + 1 }, (_, idx) => idx)
  const tickValue = (idx: number) => (safeMaxY * (yTicks - idx)) / yTicks

  // show fewer x labels like the screenshot (every ~4th label + last)
  const xLabelEvery = Math.max(1, Math.round(points.length / 6))

  return (
    <section className="panel chart-panel" style={style}>
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="panel-actions">{rightAction}</div>
      </div>

      <div className="area-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`${title.replace(/\s+/g, '-')}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* grid + y labels */}
          {ticks.map((t) => {
            const y = padT + (t / yTicks) * plotH
            const val = tickValue(t)
            return (
              <g key={t}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eef2f7" strokeWidth="1" />
                <text x={padL - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280">
                  {Math.round(val).toString()}
                </text>
              </g>
            )
          })}

          {/* axis baseline */}
          <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="#e5e7eb" strokeWidth="1" />

          {/* area + line */}
          <path d={areaD} fill={`url(#${title.replace(/\s+/g, '-')}-fill)`} />
          <path d={lineD} fill="none" stroke={color} strokeWidth="3" />
        </svg>

        <div className="chart-axis">
          {points.map((p, i) => {
            const shouldShow = i === 0 || i === n - 1 || i % xLabelEvery === 0
            return (
              <span key={`${p.label}-${i}`} className={shouldShow ? '' : 'muted'}>
                {shouldShow ? p.label : '\u00A0'}
              </span>
            )
          })}
        </div>

        {valueSuffix ? <div className="chart-suffix">{valueSuffix}</div> : null}
      </div>
    </section>
  )
}

