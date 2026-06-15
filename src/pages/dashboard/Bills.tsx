import { useEffect, useState } from 'react'
import { getCurrentUser } from '../../utils/auth'
import { getOrdersForCustomer } from '../../utils/store'
import { subscribeBroadcast } from '../../utils/broadcast'

export default function Bills() {
  const [orders, setOrders] = useState<any[]>([])

  function refresh() {
    const current = getCurrentUser()
    const data = current && current.role === 'customer' ? getOrdersForCustomer((current as any).email) : []
    setOrders(data)
  }

  useEffect(() => {
    refresh()
    const unsub = subscribeBroadcast((e) => {
      if (!e || !e.type) return
      if (e.type.startsWith('orders') || e.type === 'order_status_changed' || e.type === 'products_updated') refresh()
    })
    return () => unsub()
  }, [])

  const amount = orders.reduce((sum, o) => sum + (o.price ? o.quantity * o.price : 0), 0)

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Bills</h2>
      <p style={{ color: '#475569' }}>You have {orders.length} orders. Total amount: ₹{amount} (pending for orders without price)</p>
    </div>
  )
}
