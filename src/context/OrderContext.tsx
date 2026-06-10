import { createContext, useContext, useState, type ReactNode } from 'react'
import { ORDER_STATUSES, type OrderItem, type SubmittedOrder } from '../types/order'

interface OrderContextValue {
  draftItems: OrderItem[]
  submittedOrders: SubmittedOrder[]
  addDraftItem: (item: Omit<OrderItem, 'id'>) => void
  submitOrder: () => SubmittedOrder | null
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [draftItems, setDraftItems] = useState<OrderItem[]>([])
  const [submittedOrders, setSubmittedOrders] = useState<SubmittedOrder[]>([])

  const addDraftItem = (item: Omit<OrderItem, 'id'>) => {
    setDraftItems((prev) => [...prev, { ...item, id: Date.now() }])
  }

  const submitOrder = () => {
    if (draftItems.length === 0) return null

    const order: SubmittedOrder = {
      id: Date.now(),
      items: [...draftItems],
      status: ORDER_STATUSES[0],
      submittedAt: new Date().toLocaleString()
    }

    setSubmittedOrders((prev) => [...prev, order])
    setDraftItems([])
    return order
  }

  return (
    <OrderContext.Provider value={{ draftItems, submittedOrders, addDraftItem, submitOrder }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrders must be used within OrderProvider')
  return ctx
}
