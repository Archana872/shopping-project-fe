import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../../context/OrderContext'
import { getFreshUnlockProduct, clearFreshUnlockProduct } from '../../utils/storeStorage'

export default function NewOrderPage() {
  const { draftItems, submitOrder, submitError, addDraftItem } = useOrders()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [freshUnlockLoaded, setFreshUnlockLoaded] = useState(false)

  useEffect(() => {
    if (freshUnlockLoaded) return

    const freshUnlockProduct = getFreshUnlockProduct()
    if (freshUnlockProduct) {
      const alreadyAdded = draftItems.some(
        (item) =>
          item.itemName.trim().toLowerCase() === freshUnlockProduct.itemName.trim().toLowerCase() &&
          item.measurement === freshUnlockProduct.measurement
      )

      if (!alreadyAdded) {
        addDraftItem({
          itemName: freshUnlockProduct.itemName,
          quantity: freshUnlockProduct.quantity,
          measurement: freshUnlockProduct.measurement
        })
      }

      clearFreshUnlockProduct()
    }

    setFreshUnlockLoaded(true)
  }, [freshUnlockLoaded, draftItems, addDraftItem])

  const handleSubmitOrder = async () => {
    setSubmitting(true)
    const order = await submitOrder()
    setSubmitting(false)
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

          {submitError && (
            <p className="form-error" style={{ marginTop: 12 }}>
              ⚠️ {submitError}
            </p>
          )}

          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 20 }}
            onClick={handleSubmitOrder}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit Order'}
          </button>
        </>
      )}
    </section>
  )
}
