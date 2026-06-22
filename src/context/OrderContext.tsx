import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { getSession, type Customer } from '../utils/authStorage'
import { addOrder } from '../utils/storeStorage'
import { submitOrderApi } from '../services/itemService'
import type { OrderItem, SubmittedOrder } from '../types/order'
import { ORDER_STATUSES } from '../types/order'

interface OrderContextValue {
  draftItems: OrderItem[]
  submittedOrders: SubmittedOrder[]
  addDraftItem: (item: Omit<OrderItem, 'id'> & { id?: number }) => void
  submitOrder: () => Promise<SubmittedOrder | null>
  submitError: string
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [draftItems, setDraftItems] = useState<OrderItem[]>([])
  const [submittedOrders, setSubmittedOrders] = useState<SubmittedOrder[]>([])
  const [submitError, setSubmitError] = useState('')

  const addDraftItem = useCallback((item: Omit<OrderItem, 'id'> & { id?: number }) => {
    setDraftItems((prev) => [...prev, { ...item, id: item.id ?? Date.now() }])
  }, [])

  const submitOrder = useCallback(async (): Promise<SubmittedOrder | null> => {
    if (draftItems.length === 0) return null

    const session = getSession()
    if (!session || session.role !== 'customer') return null

    const customer = session.user as Customer
    setSubmitError('')

    const orderPayload = {
      customerEmail: customer.email,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      items: draftItems.map(({ itemName, quantity, measurement }) => ({
        itemName,
        quantity,
        measurement
      }))
    }

    let apiOrderId: number | null = null
    let apiSubmittedAt: string | null = null

    try {
      // Submit to orders API
      const apiOrder = await submitOrderApi(orderPayload)
      if (apiOrder?.id) apiOrderId = apiOrder.id
      if (apiOrder?.submittedAt) apiSubmittedAt = apiOrder.submittedAt
    } catch (err) {
      // API unavailable — fall back to localStorage only
      console.warn('Orders API unavailable, saving locally:', err)
      setSubmitError('Order saved locally (server unreachable).')
    }

    // Always persist to localStorage so tracking works offline too
    const storeOrder = addOrder(orderPayload)

    const order: SubmittedOrder = {
      // Prefer the API-issued id so tracking against the server works
      id: apiOrderId ?? storeOrder.id,
      items: [...draftItems],
      status: ORDER_STATUSES[0],
      submittedAt: apiSubmittedAt ?? storeOrder.submittedAt
    }

    setSubmittedOrders((prev) => [...prev, order])
    setDraftItems([])
    return order
  }, [draftItems])

  return (
    <OrderContext.Provider value={{ draftItems, submittedOrders, addDraftItem, submitOrder, submitError }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrders must be used within OrderProvider')
  return ctx
}
