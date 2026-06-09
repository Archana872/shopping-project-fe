import { useMemo, useState } from 'react'

interface Order {
  id: number
  product: string
  quantity: number
  price: number
  status: string
}

interface DashboardPageProps {
  onLogout: () => void
}

const products = [
  { name: 'Tomato', price: 40 },
  { name: 'Onion', price: 30 }
]

const statuses = ['Order Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered']

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'order' | 'orders' | 'bills' | 'track'>('home')
  const [selectedProduct, setSelectedProduct] = useState(products[0].name)
  const [quantity, setQuantity] = useState(1)
  const [orders, setOrders] = useState<Order[]>([])
  const [currentStatus, setCurrentStatus] = useState(statuses[0])

  const productPrice = useMemo(
    () => products.find((item) => item.name === selectedProduct)?.price ?? 0,
    [selectedProduct]
  )

  const billAmount = orders.reduce((sum, order) => sum + order.quantity * order.price, 0)

  const handleAddOrder = () => {
    const nextOrder: Order = {
      id: orders.length + 1,
      product: selectedProduct,
      quantity,
      price: productPrice,
      status: statuses[0]
    }
    setOrders((prev) => [...prev, nextOrder])
    setCurrentStatus(statuses[0])
    setActiveTab('orders')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1f2937', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>Customer Dashboard</h1>
            <p style={{ margin: '6px 0 0', color: '#475569' }}>
              Place new grocery orders, review requests, bills, and track delivery.
            </p>
          </div>

          <button
            onClick={onLogout}
            style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}
          >
            Logout
          </button>
        </header>

        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { key: 'home', label: 'Home' },
            { key: 'order', label: 'New Order' },
            { key: 'orders', label: 'My Orders' },
            { key: 'bills', label: 'Bills' },
            { key: 'track', label: 'Track Order' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as typeof activeTab)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: activeTab === item.key ? '2px solid #2563eb' : '1px solid #d1d5db',
                background: activeTab === item.key ? '#eff6ff' : '#fff',
                cursor: 'pointer'
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 14px 32px rgba(15,23,42,0.08)' }}>
          {activeTab === 'home' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Welcome back!</h2>
              <p style={{ color: '#475569' }}>
                Use the dashboard to submit grocery orders, check your order history, view bills, and track deliveries.
              </p>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', marginTop: 24 }}>
                <div style={{ padding: 18, borderRadius: 16, background: '#eff6ff' }}>
                  <h3 style={{ margin: '0 0 8px' }}>Create grocery order</h3>
                  <p style={{ margin: 0, color: '#475569' }}>Pick products like Tomato and Onion, then submit your request.</p>
                </div>
                <div style={{ padding: 18, borderRadius: 16, background: '#fef3c7' }}>
                  <h3 style={{ margin: '0 0 8px' }}>View submitted orders</h3>
                  <p style={{ margin: 0, color: '#475569' }}>All orders are listed in My Orders with current status.</p>
                </div>
                <div style={{ padding: 18, borderRadius: 16, background: '#dcfce7' }}>
                  <h3 style={{ margin: '0 0 8px' }}>Track delivery</h3>
                  <p style={{ margin: 0, color: '#475569' }}>Order status updates are shown in real time for tracking.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'order' && (
            <div>
              <h2 style={{ marginTop: 0 }}>New Grocery Order</h2>
              <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', alignItems: 'end' }}>
                <label style={{ display: 'block' }}>
                  Product
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, border: '1px solid #cbd5e1' }}
                  >
                    {products.map((product) => (
                      <option key={product.name} value={product.name}>
                        {product.name} - ₹{product.price} per kg
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'block' }}>
                  Quantity (kg)
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 12, border: '1px solid #cbd5e1' }}
                  />
                </label>
              </div>
              <button
                onClick={handleAddOrder}
                style={{ marginTop: 20, padding: '12px 18px', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
              >
                Add Order
              </button>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 style={{ marginTop: 0 }}>My Orders</h2>
              {orders.length === 0 ? (
                <p style={{ color: '#475569' }}>No orders submitted yet. Start a new order from the menu.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 8px' }}>Product</th>
                      <th style={{ padding: '12px 8px' }}>Quantity</th>
                      <th style={{ padding: '12px 8px' }}>Total</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 8px' }}>{order.product}</td>
                        <td style={{ padding: '12px 8px' }}>{order.quantity} kg</td>
                        <td style={{ padding: '12px 8px' }}>₹{order.quantity * order.price}</td>
                        <td style={{ padding: '12px 8px' }}>{order.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'bills' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Bills</h2>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
                <div style={{ flex: 1, minWidth: 220, padding: 20, borderRadius: 16, background: '#f0f9ff' }}>
                  <h3 style={{ margin: '0 0 12px' }}>Total Amount</h3>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>₹{billAmount}</p>
                </div>
                <div style={{ flex: 1, minWidth: 220, padding: 20, borderRadius: 16, background: '#ecfccb' }}>
                  <h3 style={{ margin: '0 0 12px' }}>Orders Count</h3>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{orders.length}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'track' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Track Order</h2>
              {orders.length === 0 ? (
                <p style={{ color: '#475569' }}>No orders yet. Create one to start tracking.</p>
              ) : (
                <div>
                  <p style={{ color: '#475569' }}>Current status for the latest order:</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                    {statuses.map((status) => {
                      const completed = statuses.indexOf(status) <= statuses.indexOf(currentStatus)
                      return (
                        <div
                          key={status}
                          style={{
                            flex: '1 1 140px',
                            padding: 14,
                            borderRadius: 14,
                            background: completed ? '#dbeafe' : '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: completed ? '#1d4ed8' : '#6b7280'
                          }}
                        >
                          {status}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <button
                      onClick={() => {
                        const currentIndex = statuses.indexOf(currentStatus)
                        if (currentIndex < statuses.length - 1) {
                          setCurrentStatus(statuses[currentIndex + 1])
                        }
                      }}
                      style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
                    >
                      Advance Status
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
