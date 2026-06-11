import { createContext, useContext, useState, type ReactNode } from 'react'
import { getSession, type Customer } from '../utils/authStorage'
import { addOrder } from '../utils/storeStorage'
import type { OrderItem, SubmittedOrder } from '../types/order'
import { ORDER_STATUSES } from '../types/order'

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

    const session = getSession()
    if (!session || session.role !== 'customer') return null

    const customer = session.user as Customer

    const storeOrder = addOrder({
      customerEmail: customer.email,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      items: draftItems.map(({ itemName, quantity, measurement }) => ({
        itemName,
        quantity,
        measurement
      }))
    })

    const order: SubmittedOrder = {
      id: storeOrder.id,
      items: [...draftItems],
      status: ORDER_STATUSES[0],
      submittedAt: storeOrder.submittedAt
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
