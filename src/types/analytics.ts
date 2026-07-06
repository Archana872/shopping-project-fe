export interface SpendingMetrics {
  totalSpent: number
  weeklySpent: number
  monthlySpent: number
  avgOrderValue: number
  orderCount: number
}

export interface MostBoughtItem {
  itemName: string
  quantity: number
  purchases: number
}

export interface PurchaseInsights {
  mostBoughtItems: MostBoughtItem[]
  repeatPurchases: number
  lastOrder: string | null
}

export interface BudgetMetrics {
  weeklyBudget: number
  monthlyBudget: number
  weeklyUsed: number
  monthlyUsed: number
  weeklyRemaining: number
  monthlyRemaining: number
  weeklyUsedPercent: number
  monthlyUsedPercent: number
}

export interface PredictionMetrics {
  nextPurchaseSuggestion: string
  lowStockEstimate: string
  scheduleRecommendation: string
}

export interface SavingsMetrics {
  offerSavings: number
  deliverySavings: number
  totalSavings: number
}

export interface FreshnessHealthMetrics {
  freshnessScore: number
  vegetablesPercent: number
  fruitsPercent: number
}

export interface OwnerAnalyticsData {
  spending: SpendingMetrics
  insights: PurchaseInsights
  budget: BudgetMetrics
  predictions: PredictionMetrics
  savings: SavingsMetrics
  freshnessHealth: FreshnessHealthMetrics
}

export interface BudgetConfig {
  userEmail: string
  weeklyBudget: number
  monthlyBudget: number
  updatedAt: string
}
