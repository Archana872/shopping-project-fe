import type { FreshnessHealthMetrics } from '../../types/analytics'

export default function FreshnessHealthCard({ freshnessHealth }: { freshnessHealth: FreshnessHealthMetrics }) {
  return (
    <section className="analytics-card analytics-card--freshness">
      <div className="analytics-card__header">
        <div>
          <p className="analytics-card__label">Freshness & health</p>
          <h3>Produce quality snapshot</h3>
        </div>
      </div>

      <div className="freshness-grid">
        <div className="freshness-score">
          <span>Freshness score</span>
          <strong>{freshnessHealth.freshnessScore}%</strong>
          <p>How fresh your last orders are estimated to be.</p>
        </div>
        <div className="freshness-stat">
          <span>Vegetables</span>
          <strong>{freshnessHealth.vegetablesPercent}%</strong>
        </div>
        <div className="freshness-stat">
          <span>Fruits</span>
          <strong>{freshnessHealth.fruitsPercent}%</strong>
        </div>
      </div>
    </section>
  )
}
