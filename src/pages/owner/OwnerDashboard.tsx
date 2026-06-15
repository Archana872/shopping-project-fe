import '../../styles/ui.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, addProduct, updateProduct, removeProduct, getAllOrders, updateOrderStatus, reduceStock, assignOrderToDelivery } from '../../utils/store'
import { subscribeBroadcast } from '../../utils/broadcast'
import { getAllUsers } from '../../utils/auth'

interface ProductRow {
  id: string
  name: string
  price: number
  stock: number
}

export default function OwnerDashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate()
  const [active, setActive] = useState<'products' | 'customers' | 'orders'>('products')
  const [products, setProductsLocal] = useState<ProductRow[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])

  const [form, setForm] = useState({ name: '', price: '', stock: '' })

  useEffect(() => {
    refresh()
    const unsub = subscribeBroadcast((e) => {
      if (!e || !e.type) return
      if (e.type.startsWith('products') || e.type.startsWith('orders') || e.type === 'order_status_changed') {
        refresh()
      }
    })

    return () => unsub()
  }, [active])

  function refresh() {
    setProductsLocal(getProducts())
    setOrders(getAllOrders())
    const all = getAllUsers()
    setCustomers(all.filter((u) => u.role === 'customer'))
    setDeliveries(all.filter((u) => u.role === 'delivery'))
  }

  const handleAdd = () => {
    if (!form.name || !form.price) return alert('Name and price required')
    addProduct({ name: form.name, price: Number(form.price), stock: Number(form.stock || 0) })
    setForm({ name: '', price: '', stock: '' })
    refresh()
  }

  const handleUpdate = (id: string) => {
    const p = products.find((x) => x.id === id)
    if (!p) return
    const newPrice = prompt('New price', String(p.price))
    const newStock = prompt('New stock', String(p.stock))
    if (newPrice != null) updateProduct(id, { price: Number(newPrice) })
    if (newStock != null) updateProduct(id, { stock: Number(newStock) })
    refresh()
  }

  const handleRemove = (id: string) => {
    if (!confirm('Remove product?')) return
    removeProduct(id)
    refresh()
  }

  const handleApprove = (id: number) => {
    const ord = orders.find((o) => o.id === id)
    if (!ord) return
    // compute price from current product price and set it on the order
    const prods = getProducts()
    const p = prods.find((x) => x.name === ord.product)
    const unitPrice = p ? p.price : 0
    const success = reduceStock(ord.product, ord.quantity)
    if (!success) return alert('Insufficient stock')
    updateOrderStatus(id, 'Confirmed', unitPrice)
    refresh()
  }

  const handleReject = (id: number) => {
    updateOrderStatus(id, 'Rejected')
    refresh()
  }

  const handleAssign = (orderId: number, deliveryId: string) => {
    if (!deliveryId) return alert('Select a delivery user to assign')
    const ok = assignOrderToDelivery(orderId, deliveryId)
    if (!ok) return alert('Failed to assign order')
    // mark as packing after assignment
    updateOrderStatus(orderId, 'Packing')
    refresh()
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24 }}>
      <div className="centered owner-layout">
        <aside className="owner-sidebar">
          <div style={{ fontWeight: 800, fontSize: 18 }}>Owner</div>
          <button className={`nav-item ${active === 'products' ? 'active' : ''}`} onClick={() => setActive('products')}>Products</button>
          <button className={`nav-item ${active === 'customers' ? 'active' : ''}`} onClick={() => setActive('customers')}>Customers</button>
          <button className={`nav-item ${active === 'orders' ? 'active' : ''}`} onClick={() => setActive('orders')}>Orders</button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={() => { onLogout(); navigate('/') }} style={{ background: '#ef4444', color: '#fff' }}>Logout</button>
        </aside>

        <main className="owner-content panel">
          {active === 'products' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Products</h2>
              <div className="form-row">
                <input placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
                <input placeholder="Price" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} />
                <input placeholder="Stock" value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))} />
                <button className="btn btn-primary" onClick={handleAdd}>Add</button>
              </div>

              <table style={{ marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>₹{p.price}</td>
                      <td>{p.stock}</td>
                      <td className="table-actions">
                        <button className="btn" onClick={() => handleUpdate(p.id)}>Edit</button>
                        <button className="btn" onClick={() => handleRemove(p.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === 'customers' && (
            <div>
              <h2>Customers</h2>
              <table style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={(c as any).email}>
                      <td>{(c as any).name}</td>
                      <td>{(c as any).email}</td>
                      <td>{(c as any).phone}</td>
                      <td>{(c as any).address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {active === 'orders' && (
            <div>
              <h2>Orders</h2>
              <table style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                      {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.customerEmail}</td>
                      <td>{o.product}</td>
                      <td>{o.quantity}</td>
                      <td>{o.price != null ? `₹${o.quantity * o.price}` : 'Pending'}</td>
                      <td>
                        <span className={`badge ${o.status === 'Order Placed' ? 'pending' : o.status === 'Confirmed' ? 'confirmed' : 'rejected'}`}>{o.status}</span>
                      </td>
                      <td>
                        {o.status === 'Order Placed' && (
                          <>
                            <button className="btn btn-success" onClick={() => handleApprove(o.id)}>Approve</button>
                            <button className="btn" onClick={() => handleReject(o.id)} style={{ marginLeft: 8 }}>Reject</button>
                          </>
                        )}
                        {o.status === 'Confirmed' && !o.deliveryId && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select defaultValue="" onChange={(e) => handleAssign(o.id, e.target.value)}>
                              <option value="">Assign to...</option>
                              {deliveries.map((d) => (
                                <option key={(d as any).id} value={(d as any).id}>{(d as any).id} - {(d as any).name || ''}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {o.deliveryId && (
                          <div style={{ marginTop: 6 }}>Assigned: {o.deliveryId}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
