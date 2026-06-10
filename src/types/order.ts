export interface OrderItem {
  id: number
  itemName: string
  quantity: number
  measurement: string
}

export interface SubmittedOrder {
  id: number
  items: OrderItem[]
  status: string
  submittedAt: string
}

export const MEASUREMENTS = ['kg', 'g', 'liter', 'ml', 'pcs', 'dozen'] as const
export const ORDER_STATUSES = [
  'Order Placed',
  'Confirmed',
  'Packing',
  'Out for Delivery',
  'Delivered'
] as const
