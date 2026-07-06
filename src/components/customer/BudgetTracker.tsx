import type { BudgetMetrics } from '../../types/analytics'

export default function BudgetTracker({ budget }: { budget: BudgetMetrics }) {
  return (
    <section className="analytics-card analytics-card--budget">
      <div className="analytics-card__header">
        <div>
          <p className="analytics-card__label">Budget Tracker</p>
          <h3>Weekly & monthly spend goals</h3>
        </div>
      </div>

      <div className="budget-grid">
        <div className="budget-item">
          <span>Weekly budget</span>
          <strong>₹{budget.weeklyBudget.toFixed(2)}</strong>
          <small>{budget.weeklyUsedPercent}% used</small>
          <div className="budget-bar">
            <div style={{ width: `${budget.weeklyUsedPercent}%` }} />
          </div>
          <p className="budget-remaining">₹{budget.weeklyRemaining.toFixed(2)} remaining</p>
        </div>
        <div className="budget-item">
          <span>Monthly budget</span>
          <strong>₹{budget.monthlyBudget.toFixed(2)}</strong>
          <small>{budget.monthlyUsedPercent}% used</small>
          <div className="budget-bar">
            <div style={{ width: `${budget.monthlyUsedPercent}%` }} />
          </div>
          <p className="budget-remaining">₹{budget.monthlyRemaining.toFixed(2)} remaining</p>
        </div>
      </div>
    </section>
  )
}
