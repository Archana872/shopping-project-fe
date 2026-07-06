import type { PurchaseInsights } from '../../types/analytics'

export default function Insights({ insights }: { insights: PurchaseInsights }) {
  return (
    <section className="analytics-card analytics-card--insights">
      <div className="analytics-card__header">
        <div>
          <p className="analytics-card__label">Purchase Insights</p>
          <h3>Shopping habits and order history</h3>
        </div>
      </div>

      <div className="analytics-tiles">
        <div className="analytics-tile">
          <p>Most bought items</p>
          <ul>
            {insights.mostBoughtItems.map((item) => (
              <li key={item.itemName}>
                <strong>{item.itemName}</strong> · {item.quantity} units
              </li>
            ))}
          </ul>
        </div>
        <div className="analytics-tile">
          <p>Repeat purchases</p>
          <strong>{insights.repeatPurchases} orders</strong>
        </div>
        <div className="analytics-tile">
          <p>Last order</p>
          <strong>{insights.lastOrder ? new Date(insights.lastOrder).toLocaleDateString() : 'No orders yet'}</strong>
        </div>
      </div>
    </section>
  )
}
