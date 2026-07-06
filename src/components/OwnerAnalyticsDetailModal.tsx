import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { StoreOrder } from '../types/store'

type MetricKey = 'total_spent' | 'weekly' | 'monthly' | 'avg_order'

type RangeKey = '30d' | '90d' | '180d' | 'all'

function daysAgo(dateString: string) {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
}

function buildWeeklySeries(orders: StoreOrder[], weeks = 8) {
  const now = new Date()
  const series = Array.from({ length: weeks }, (_, index) => {
    const end = new Date(now)
    end.setDate(now.getDate() - (weeks - 1 - index) * 7)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    const label = `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
    return { label, value: 0, count: 0 }
  })

  const ranges = series.map((_, index) => {
    const end = new Date(now)
    end.setDate(now.getDate() - (weeks - 1 - index) * 7)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    return { start, end }
  })

  orders.forEach((order) => {
    const orderDate = new Date(order.submittedAt)
    ranges.forEach((range, index) => {
      if (orderDate >= range.start && orderDate <= range.end) {
        series[index].value += order.billAmount ?? 0
        series[index].count += 1
      }
    })
  })

  return series
}

function buildMonthlySeries(orders: StoreOrder[], months = 12) {
  const now = new Date()
  const series = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1)
    return { label: date.toLocaleString('default', { month: 'short' }), value: 0, count: 0 }
  })

  orders.forEach((order) => {
    const orderDate = new Date(order.submittedAt)
    series.forEach((point) => {
      const label = orderDate.toLocaleString('default', { month: 'short' })
      if (point.label === label) {
        point.value += order.billAmount ?? 0
        point.count += 1
      }
    })
  })

  return series
}

function formatRangeLabel(range: RangeKey) {
  if (range === '30d') return 'Last 30 days'
  if (range === '90d') return 'Last 90 days'
  if (range === '180d') return 'Last 180 days'
  return 'All time'
}

interface Props {
  metric: MetricKey
  orders: StoreOrder[]
  onClose: () => void
}

export default function OwnerAnalyticsDetailModal({ metric, orders, onClose }: Props) {
  const [range, setRange] = useState<RangeKey>('90d')
  const now = new Date()
  const rangeDays = range === '30d' ? 30 : range === '90d' ? 90 : range === '180d' ? 180 : 365
  const rangeStart = new Date(now)
  rangeStart.setDate(now.getDate() - rangeDays + 1)

  const filteredOrders = useMemo(
    () => orders.filter((order) => new Date(order.submittedAt) >= rangeStart),
    [orders, rangeStart]
  )

  const totalValue = filteredOrders.reduce((sum, order) => sum + (order.billAmount ?? 0), 0)
  const orderCount = filteredOrders.length

  const previousRangeEnd = new Date(rangeStart)
  previousRangeEnd.setDate(rangeStart.getDate() - 1)
  const previousRangeStart = new Date(previousRangeEnd)
  previousRangeStart.setDate(previousRangeEnd.getDate() - rangeDays + 1)

  const previousOrders = orders.filter((order) => {
    const date = new Date(order.submittedAt)
    return date >= previousRangeStart && date <= previousRangeEnd
  })
  const previousValue = previousOrders.reduce((sum, order) => sum + (order.billAmount ?? 0), 0)
  const comparisonDelta = totalValue - previousValue
  const comparisonLabel = previousValue === 0 ? 'No previous period' : `${comparisonDelta >= 0 ? '+' : ''}₹${comparisonDelta.toFixed(2)} vs previous period`

  const chartData = useMemo(() => {
    if (metric === 'weekly') {
      return buildWeeklySeries(filteredOrders, 8)
    }
    if (metric === 'monthly' || metric === 'total_spent') {
      return buildMonthlySeries(filteredOrders, 12)
    }
    if (metric === 'avg_order') {
      return buildWeeklySeries(filteredOrders, 8).map((point) => ({
        ...point,
        avgOrder: point.count ? Math.round((point.value / point.count) * 100) / 100 : 0
      }))
    }
    return []
  }, [filteredOrders, metric])

  const metricTitle =
    metric === 'total_spent'
      ? 'Total Spend Trend'
      : metric === 'weekly'
      ? 'Weekly Spend Breakdown'
      : metric === 'monthly'
      ? 'Monthly Spend Trend'
      : 'Average Order Trend'

  const metricSubtitle =
    metric === 'total_spent'
      ? 'Track total spending over recent months.'
      : metric === 'weekly'
      ? 'Compare weekly performance and order frequency.'
      : metric === 'monthly'
      ? 'See how monthly revenue moves over time.'
      : 'Monitor average order value per period.'

  const chartKey = metric === 'weekly' ? 'value' : metric === 'avg_order' ? 'avgOrder' : 'value'

  return (
    <div className="analytics-detail-overlay" onClick={onClose}>
      <div className="analytics-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="analytics-detail-header">
          <button type="button" className="analytics-detail-back" onClick={onClose}>
            ← Back
          </button>
          <div>
            <p className="analytics-card__label">{metricTitle}</p>
            <h3>{metricSubtitle}</h3>
          </div>
        </div>

        <div className="analytics-detail-meta">
          <div>
            <strong>₹{totalValue.toFixed(2)}</strong>
            <p>Total value</p>
          </div>
          <div>
            <strong>{orderCount}</strong>
            <p>Orders</p>
          </div>
          <div>
            <strong>{comparisonLabel}</strong>
            <p>Comparison</p>
          </div>
        </div>

        <div className="analytics-detail-filters">
          {(['30d', '90d', '180d', 'all'] as RangeKey[]).map((option) => (
            <button
              key={option}
              type="button"
              className={`analytics-detail-filter${range === option ? ' analytics-detail-filter--active' : ''}`}
              onClick={() => setRange(option)}
            >
              {formatRangeLabel(option)}
            </button>
          ))}
        </div>

        <div className="analytics-detail-chart">
          {chartData.length === 0 ? (
            <div className="analytics-empty-state">
              <p>No data available for this range yet.</p>
              <p>Try a different filter or wait for more orders.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              {metric === 'weekly' ? (
                <BarChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Weekly']} />
                  <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} animationDuration={500} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, metric === 'avg_order' ? 'Avg order' : 'Amount']} />
                  <Line type="monotone" dataKey={chartKey} stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={600} />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
