import { useNavigate } from 'react-router-dom'
import { useOrders } from '../../context/OrderContext'

export default function NewOrderPage() {
  const { draftItems, submitOrder } = useOrders()
  const navigate = useNavigate()

  const handleSubmitOrder = () => {
    const order = submitOrder()
    if (order) navigate('/customer/track-order')
  }

  return (
    <section className="dashboard-panel">
      <h2>New Order</h2>
      <p>
        Go to <strong>My Order</strong> to add items first, then submit your order here.
      </p>

      {draftItems.length === 0 ? (
        <p className="empty-state">
          No items in your cart. Open My Order to add item name, quantity, and measurement.
        </p>
      ) : (
        <>
          <table className="order-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Measurement</th>
              </tr>
            </thead>
            <tbody>
              {draftItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.itemName}</td>
                  <td>{item.quantity}</td>
                  <td>{item.measurement}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 20 }}
            onClick={handleSubmitOrder}
          >
            Submit Order
          </button>
        </>
      )}
    </section>
  )
}
