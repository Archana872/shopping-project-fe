import { addOrder } from '../../utils/store'
import { getCurrentUser } from '../../utils/auth'

interface Props {
  selectedProduct: string
  quantity: number
  setQuantity: (q: number) => void
}

export default function QuantityPrice({
  selectedProduct,
  quantity,
  setQuantity,
}: Props) {
  const current = getCurrentUser()

  const handlePlaceOrder = () => {
    if (!current || current.role !== 'customer') {
      return alert('Please login as customer to place orders.')
    }

    const order = addOrder({
      customerEmail: (current as any).email,
      product: selectedProduct,
      quantity,
    })

    alert(`Order placed (id: ${order.id}). You can view it under My Orders.`)
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Quantity</h2>

      <p style={{ color: '#475569' }}>
        Set quantity for <strong>{selectedProduct}</strong>.
      </p>

      <div
        style={{
          marginTop: 12,
          display: 'grid',
          gap: 12,
          maxWidth: 420,
        }}
      >
        <label>
          Quantity
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            style={{
              width: '100%',
              marginTop: 8,
              padding: 12,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
            }}
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={handlePlaceOrder}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#10b981',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  )
}