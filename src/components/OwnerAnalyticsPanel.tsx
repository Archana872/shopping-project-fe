import { useState } from 'react'
import type { DeliveryAssignment, Product, StoreOrder } from '../types/store'
import OwnerAnalyticsDetailModal from './OwnerAnalyticsDetailModal'

interface Props {
  orders: StoreOrder[]
  products: Product[]
  deliveries: DeliveryAssignment[]
}

type MetricKey = 'summary' | 'total_spent' | 'weekly' | 'monthly' | 'avg_order'

interface SeriesPoint {
  label: string
  value: number
  count: number
}

function getWeekLabel(date: Date) {
  const month = date.toLocaleString('default', { month: 'short' })
  return `${month} ${date.getDate()}`
}

function getMonthLabel(date: Date) {
  return date.toLocaleString('default', { month: 'short' })
}

function buildWeeklySeries(orders: StoreOrder[], weeks = 6) {
  const now = new Date()
  const series: SeriesPoint[] = []
  for (let idx = weeks - 1; idx >= 0; idx -= 1) {
    const end = new Date(now)
    end.setDate(now.getDate() - idx * 7)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    const label = `${getWeekLabel(start)} - ${getWeekLabel(end)}`
    series.push({ label, value: 0, count: 0 })
  }

  // Use deterministic date ranges for each weekly bucket.
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

function buildMonthlySeries(orders: StoreOrder[], months = 6) {
  const now = new Date()
  const series: SeriesPoint[] = []
  for (let idx = months - 1; idx >= 0; idx -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - idx, 1)
    series.push({ label: getMonthLabel(date), value: 0, count: 0 })
  }

  orders.forEach((order) => {
    const orderDate = new Date(order.submittedAt)
    series.forEach((point) => {
      const monthLabel = getMonthLabel(orderDate)
      if (point.label === monthLabel) {
        point.value += order.billAmount ?? 0
        point.count += 1
      }
    })
  })

  return series
}

const WEEKLY_BUDGET = 3500
const MONTHLY_BUDGET = 14000

function daysAgo(dateString: string) {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
}

function categoryFromName(name: string) {
  const lower = name.toLowerCase()
  if (['apple', 'orange', 'banana', 'grape', 'mango', 'berry', 'citrus', 'pear'].some((fruit) => lower.includes(fruit))) {
    return 'fruit'
  }
  return 'vegetable'
}

function buildMostBought(orders: StoreOrder[]) {
  const map = new Map<string, { quantity: number; count: number }>()
  for (const order of orders) {
    if (!order.billAmount) continue
    for (const item of order.items.filter((i) => !i.rejected)) {
      const existing = map.get(item.itemName) ?? { quantity: 0, count: 0 }
      existing.quantity += item.quantity
      existing.count += 1
      map.set(item.itemName, existing)
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 3)
    .map(([itemName, value]) => ({ itemName, ...value }))
}

export default function OwnerAnalyticsPanel({ orders, products, deliveries }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('summary')
  const [detailMetric, setDetailMetric] = useState<MetricKey | null>(null)
  const completedOrders = orders.filter((o) => o.status !== 'pending' && o.status !== 'rejected')
  const spentOrders = completedOrders.filter((o) => o.billAmount && o.billAmount > 0)
  const totalOrders = spentOrders.length
  const totalSpent = spentOrders.reduce((sum, o) => sum + (o.billAmount ?? 0), 0)
  const weeklyOrders = spentOrders.filter((o) => o.submittedAt && daysAgo(o.submittedAt) <= 7).length
  const weeklySpent = spentOrders
    .filter((o) => o.submittedAt && daysAgo(o.submittedAt) <= 7)
    .reduce((sum, o) => sum + (o.billAmount ?? 0), 0)
  const monthlyOrders = spentOrders.filter((o) => o.submittedAt && daysAgo(o.submittedAt) <= 30).length
  const monthlySpent = spentOrders
    .filter((o) => o.submittedAt && daysAgo(o.submittedAt) <= 30)
    .reduce((sum, o) => sum + (o.billAmount ?? 0), 0)
  const avgOrderValue = spentOrders.length ? Math.round((totalSpent / spentOrders.length) * 100) / 100 : 0
  const weeklySeries = buildWeeklySeries(spentOrders)
  const monthlySeries = buildMonthlySeries(spentOrders)
  const avgOrderSeries = weeklySeries.map((point) => ({ ...point, value: point.count ? Math.round((point.value / point.count) * 100) / 100 : 0 }))
  const reportSeries = selectedMetric === 'total_spent'
    ? monthlySeries
    : selectedMetric === 'monthly'
    ? monthlySeries
    : selectedMetric === 'weekly'
    ? weeklySeries
    : selectedMetric === 'avg_order'
    ? avgOrderSeries
    : []
  const maxValue = Math.max(...reportSeries.map((point) => point.value), 1)
  const hasAnalyticsData = reportSeries.some((point) => point.value > 0)
  const repeatPurchases = spentOrders.length
  const lastOrder = spentOrders.length ? new Date(Math.max(...spentOrders.map((o) => new Date(o.submittedAt).getTime()))).toLocaleDateString() : 'N/A'
  const mostBought = buildMostBought(orders)
  const lowStockCandidates = products.filter((product) => product.stock <= 10)
  const lowStockEstimate = lowStockCandidates.length
    ? `${lowStockCandidates[0].name} may run out soon (${lowStockCandidates[0].stock} left)`
    : 'Stock levels look healthy'
  const nextPurchaseSuggestion = mostBought.length
    ? `Buy more ${mostBought[0].itemName} while it remains fresh.`
    : 'Review order history to get suggestions.'
  const scheduleRecommendation = deliveries.some((d) => d.status === 'near_destination' || d.status === 'picked_up')
    ? 'Schedule the next delivery for early morning to avoid delays.'
    : 'Consider delivering groceries twice a week for freshest results.'
  const offerSavings = Math.round(totalSpent * 0.04 * 100) / 100
  const deliverySavings = Math.round(totalSpent * 0.015 * 100) / 100
  const totalSavings = Math.round((offerSavings + deliverySavings) * 100) / 100
  const freshnessScore = deliveries.length
    ? Math.round(deliveries.reduce((sum, d) => sum + d.freshnessScore, 0) / deliveries.length)
    : 88
  const categoryCounts = orders
    .flatMap((order) => order.items)
    .filter((item) => !item.rejected)
    .reduce((counts, item) => {
      const category = categoryFromName(item.itemName)
      counts[category] = (counts[category] ?? 0) + item.quantity
      return counts
    }, {} as Record<string, number>)
  const totalCategory = (categoryCounts.vegetable ?? 0) + (categoryCounts.fruit ?? 0)
  const vegetablesPercent = totalCategory ? Math.round(((categoryCounts.vegetable ?? 0) / totalCategory) * 100) : 70
  const fruitsPercent = totalCategory ? Math.round(((categoryCounts.fruit ?? 0) / totalCategory) * 100) : 30
  const weeklyUsedPercent = Math.min(100, Math.round((weeklySpent / WEEKLY_BUDGET) * 100))
  const monthlyUsedPercent = Math.min(100, Math.round((monthlySpent / MONTHLY_BUDGET) * 100))

  return (
    <aside className="owner-analytics-panel">
      <section className="analytics-summary">
        <div>
          <p className="analytics-label">Smart Grocery Insights</p>
          <h2>Owner analytics</h2>
        </div>
      </section>

      <div className="analytics-block">
        <article className="analytics-card analytics-card--compact">
          <h3>Spending</h3>
          <div className="analytics-metric-grid">
            <button
              type="button"
              className={`analytics-metric-card${selectedMetric === 'total_spent' ? ' analytics-metric-card--active' : ''}`}
              onClick={() => {
                setSelectedMetric('total_spent')
                setDetailMetric('total_spent')
              }}
              aria-pressed={selectedMetric === 'total_spent'}
            >
              <span>Total spent</span>
              <strong>₹{totalSpent.toFixed(2)}</strong>
              <small>{totalOrders} completed orders</small>
            </button>
            <button
              type="button"
              className={`analytics-metric-card${selectedMetric === 'weekly' ? ' analytics-metric-card--active' : ''}`}
              onClick={() => {
                setSelectedMetric('weekly')
                setDetailMetric('weekly')
              }}
              aria-pressed={selectedMetric === 'weekly'}
            >
              <span>Weekly</span>
              <strong>₹{weeklySpent.toFixed(2)}</strong>
              <small>{weeklyOrders} orders last 7 days</small>
            </button>
            <button
              type="button"
              className={`analytics-metric-card${selectedMetric === 'monthly' ? ' analytics-metric-card--active' : ''}`}
              onClick={() => {
                setSelectedMetric('monthly')
                setDetailMetric('monthly')
              }}
              aria-pressed={selectedMetric === 'monthly'}
            >
              <span>Monthly</span>
              <strong>₹{monthlySpent.toFixed(2)}</strong>
              <small>{monthlyOrders} orders last 30 days</small>
            </button>
            <button
              type="button"
              className={`analytics-metric-card${selectedMetric === 'avg_order' ? ' analytics-metric-card--active' : ''}`}
              onClick={() => {
                setSelectedMetric('avg_order')
                setDetailMetric('avg_order')
              }}
              aria-pressed={selectedMetric === 'avg_order'}
            >
              <span>Avg order</span>
              <strong>₹{avgOrderValue.toFixed(2)}</strong>
              <small>{totalOrders} completed orders</small>
            </button>
          </div>
        </article>

        <article className="analytics-card analytics-card--compact">
          <h3>Purchase insights</h3>
          <div className="analytics-small-grid">
            <div>
              <span>Most bought</span>
              <strong>{mostBought[0]?.itemName ?? 'N/A'}</strong>
            </div>
            <div>
              <span>Repeat orders</span>
              <strong>{repeatPurchases}</strong>
            </div>
            <div>
              <span>Last order</span>
              <strong>{lastOrder}</strong>
            </div>
          </div>
        </article>

        {detailMetric && (
          <OwnerAnalyticsDetailModal metric={detailMetric} orders={spentOrders} onClose={() => setDetailMetric(null)} />
        )}

        <article className="analytics-card analytics-card--compact analytics-card--budget">
          <h3>Budget</h3>
          <div className="budget-pill">
            <span>Weekly</span>
            <strong>{weeklyUsedPercent}%</strong>
          </div>
          <div className="budget-pill">
            <span>Monthly</span>
            <strong>{monthlyUsedPercent}%</strong>
          </div>
          <p>{`₹${(WEEKLY_BUDGET - weeklySpent).toFixed(0)} left this week`}</p>
          <p>{`₹${(MONTHLY_BUDGET - monthlySpent).toFixed(0)} left this month`}</p>
        </article>

        <article className="analytics-card analytics-card--compact">
          <h3>Predictions</h3>
          <p>{nextPurchaseSuggestion}</p>
          <p>{lowStockEstimate}</p>
          <p>{scheduleRecommendation}</p>
        </article>

        <article className="analytics-card analytics-card--compact analytics-card--savings">
          <h3>Savings</h3>
          <div className="analytics-small-grid">
            <div>
              <span>Offers</span>
              <strong>₹{offerSavings.toFixed(2)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>₹{deliverySavings.toFixed(2)}</strong>
            </div>
            <div className="analytics-highlight">
              <span>Total</span>
              <strong>₹{totalSavings.toFixed(2)}</strong>
            </div>
          </div>
        </article>

        <article className="analytics-card analytics-card--compact analytics-card--freshness">
          <h3>Freshness + Health</h3>
          <div className="analytics-small-grid">
            <div>
              <span>Freshness score</span>
              <strong>{freshnessScore}%</strong>
            </div>
            <div>
              <span>Vegetables</span>
              <strong>{vegetablesPercent}%</strong>
            </div>
            <div>
              <span>Fruits</span>
              <strong>{fruitsPercent}%</strong>
            </div>
          </div>
        </article>
      </div>
    </aside>
  )
}
