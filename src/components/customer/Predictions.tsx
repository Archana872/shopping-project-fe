import type { PredictionMetrics } from '../../types/analytics'

export default function Predictions({ predictions }: { predictions: PredictionMetrics }) {
  return (
    <section className="analytics-card analytics-card--predictions">
      <div className="analytics-card__header">
        <div>
          <p className="analytics-card__label">Predictions</p>
          <h3>Smart grocery recommendations</h3>
        </div>
      </div>

      <div className="prediction-list">
        <article>
          <h4>Next purchase</h4>
          <p>{predictions.nextPurchaseSuggestion}</p>
        </article>
        <article>
          <h4>Low stock</h4>
          <p>{predictions.lowStockEstimate}</p>
        </article>
        <article>
          <h4>Schedule suggestion</h4>
          <p>{predictions.scheduleRecommendation}</p>
        </article>
      </div>
    </section>
  )
}
