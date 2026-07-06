import type { SavingsMetrics } from '../../types/analytics'

export default function Savings({ savings }: { savings: SavingsMetrics }) {
  return (
    <section className="analytics-card analytics-card--savings">
      <div className="analytics-card__header">
        <div>
          <p className="analytics-card__label">Savings</p>
          <h3>Offers and delivery savings</h3>
        </div>
      </div>

      <div className="savings-grid">
        <div className="savings-item">
          <span>Offer savings</span>
          <strong>₹{savings.offerSavings.toFixed(2)}</strong>
        </div>
        <div className="savings-item">
          <span>Delivery savings</span>
          <strong>₹{savings.deliverySavings.toFixed(2)}</strong>
        </div>
        <div className="savings-item savings-item--highlight">
          <span>Total savings</span>
          <strong>₹{savings.totalSavings.toFixed(2)}</strong>
        </div>
      </div>
    </section>
  )
}
