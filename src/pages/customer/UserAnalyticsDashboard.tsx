import { useEffect, useState } from 'react'
import { getSession, type Customer } from '../../utils/authStorage'
import { getUserAnalyticsApi, computeAnalyticsFallback } from '../../services/userAnalyticsService'
import BudgetTracker from '../../components/customer/BudgetTracker'
import Insights from '../../components/customer/Insights'
import Savings from '../../components/customer/Savings'
import Predictions from '../../components/customer/Predictions'
import FreshnessHealthCard from '../../components/customer/FreshnessHealthCard'
import type { OwnerAnalyticsData } from '../../types/analytics'
import '../../styles/analytics.css'

export default function UserAnalyticsDashboard() {
  const session = getSession()
  const [analytics, setAnalytics] = useState<OwnerAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    if (!session || session.role !== 'customer') return
    const email = (session.user as Customer).email

    getUserAnalyticsApi(email)
      .then(setAnalytics)
      .catch(async (err) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load analytics.')
        const fallback = await computeAnalyticsFallback(email)
        setAnalytics(fallback)
      })
      .finally(() => setLoading(false))
  }, [session])

  if (!session || session.role !== 'customer') {
    return <div className="analytics-page"><p>Please log in as a customer to view analytics.</p></div>
  }

  return (
    <main className="analytics-page">
      <header className="analytics-hero">
        <div>
          <p className="analytics-label">Smart Grocery Insights</p>
          <h1>Personalized dashboard for smarter shopping</h1>
        </div>
      </header>
      {loading && <div className="analytics-loading">Loading analytics…</div>}
      {fetchError && <div className="analytics-error">{fetchError}</div>}
      {analytics && (
        <div className="analytics-grid">
          <section className="analytics-card analytics-card--spending">
            <div className="analytics-card__header">
              <div>
                <p className="analytics-card__label">Spending</p>
                <h3>What customers spend</h3>
              </div>
            </div>
            <div className="spending-grid">
              <article>
                <span>Total spent</span>
                <strong>₹{analytics.spending.totalSpent.toFixed(2)}</strong>
              </article>
              <article>
                <span>Weekly</span>
                <strong>₹{analytics.spending.weeklySpent.toFixed(2)}</strong>
              </article>
              <article>
                <span>Monthly</span>
                <strong>₹{analytics.spending.monthlySpent.toFixed(2)}</strong>
              </article>
              <article>
                <span>Avg order value</span>
                <strong>₹{analytics.spending.avgOrderValue.toFixed(2)}</strong>
              </article>
            </div>
          </section>

          <Insights insights={analytics.insights} />
          <BudgetTracker budget={analytics.budget} />
          <Predictions predictions={analytics.predictions} />
          <Savings savings={analytics.savings} />
          <FreshnessHealthCard freshnessHealth={analytics.freshnessHealth} />
        </div>
      )}
    </main>
  )
}
