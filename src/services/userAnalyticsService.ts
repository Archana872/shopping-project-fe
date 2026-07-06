import { getOrdersByCustomerApi, getOrdersApi } from './itemService'
import type {
  OwnerAnalyticsData,
  PredictionMetrics,
  PurchaseInsights,
  SavingsMetrics,
  SpendingMetrics
} from '../types/analytics'
import type { ApiOrder } from './itemService'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Request failed (${res.status}) ${text}`)
  }

  return (await res.json()) as T
}

export async function getUserAnalyticsApi(email: string): Promise<OwnerAnalyticsData> {
  return await request<OwnerAnalyticsData>(`/user/analytics?email=${encodeURIComponent(email)}`)
}

export async function getUserSpendingApi(email: string): Promise<SpendingMetrics> {
  return await request<SpendingMetrics>(`/user/spending?email=${encodeURIComponent(email)}`)
}

export async function getUserPredictionsApi(email: string): Promise<PredictionMetrics> {
  return await request<PredictionMetrics>(`/user/predictions?email=${encodeURIComponent(email)}`)
}

export async function getUserSavingsApi(email: string): Promise<SavingsMetrics> {
  return await request<SavingsMetrics>(`/user/savings?email=${encodeURIComponent(email)}`)
}

export async function computeAnalyticsFallback(email: string): Promise<OwnerAnalyticsData> {
  const orders = await getOrdersByCustomerApi(email).catch(async () => {
    const allOrders = await getOrdersApi().catch(() => [])
    return (allOrders as ApiOrder[]).filter((order) => order.customerEmail.toLowerCase() === email.toLowerCase())
  })

  const spending = computeSpending(orders)
  const insights = computePurchaseInsights(orders)
  const savings = { offerSavings: 0, deliverySavings: 0, totalSavings: 0 }
  const predictions = {
    nextPurchaseSuggestion: insights.mostBoughtItems.length
      ? `Next time, try more ${insights.mostBoughtItems[0].itemName}`
      : 'No recent order data yet.',
    lowStockEstimate: insights.mostBoughtItems.length
      ? `${insights.mostBoughtItems[0].itemName} may run low soon.`
      : 'No low stock predictions available.',
    scheduleRecommendation: 'Schedule your next delivery mid-week for fresher produce.'
  }
  const freshnessHealth = {
    freshnessScore: 88,
    vegetablesPercent: 70,
    fruitsPercent: 30
  }
  const budget = {
    weeklyBudget: 1200,
    monthlyBudget: 4200,
    weeklyUsed: spending.weeklySpent,
    monthlyUsed: spending.monthlySpent,
    weeklyRemaining: Math.max(0, 1200 - spending.weeklySpent),
    monthlyRemaining: Math.max(0, 4200 - spending.monthlySpent),
    weeklyUsedPercent: spending.weeklySpent === 0 ? 0 : Math.min(100, Math.round((spending.weeklySpent / 1200) * 100)),
    monthlyUsedPercent: spending.monthlySpent === 0 ? 0 : Math.min(100, Math.round((spending.monthlySpent / 4200) * 100))
  }

  return { spending, insights, budget, predictions, savings, freshnessHealth }
}

function computeSpending(orders: ApiOrder[]): SpendingMetrics {
  const totalSpent = orders.reduce((sum, order) => sum + (order.billAmount ?? 0), 0)
  const weeklySpent = orders
    .filter((order) => daysAgo(order.submittedAt) <= 7)
    .reduce((sum, order) => sum + (order.billAmount ?? 0), 0)
  const monthlySpent = orders
    .filter((order) => daysAgo(order.submittedAt) <= 30)
    .reduce((sum, order) => sum + (order.billAmount ?? 0), 0)
  const orderCount = orders.length
  return {
    totalSpent,
    weeklySpent,
    monthlySpent,
    avgOrderValue: orderCount ? Math.round((totalSpent / orderCount) * 100) / 100 : 0,
    orderCount
  }
}

function computePurchaseInsights(orders: ApiOrder[]): PurchaseInsights {
  const itemMap = new Map<string, { quantity: number; purchases: number }>()
  let lastOrder: string | null = null

  orders.forEach((order) => {
    if (!lastOrder || new Date(order.submittedAt) > new Date(lastOrder)) {
      lastOrder = order.submittedAt
    }
    order.items.forEach((item) => {
      const existing = itemMap.get(item.itemName) ?? { quantity: 0, purchases: 0 }
      itemMap.set(item.itemName, {
        quantity: existing.quantity + item.quantity,
        purchases: existing.purchases + 1
      })
    })
  })

  const sortedItems = Array.from(itemMap.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 3)
    .map(([itemName, value]) => ({ itemName, ...value }))

  return {
    mostBoughtItems: sortedItems,
    repeatPurchases: orders.length,
    lastOrder
  }
}

function daysAgo(dateString: string) {
  const date = new Date(dateString)
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}
