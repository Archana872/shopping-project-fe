import { useState } from 'react'
import { useOrders } from '../../context/OrderContext'
import { MEASUREMENTS } from '../../types/order'

export default function MyOrderPage() {
  const { draftItems, submittedOrders, addDraftItem } = useOrders()
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [measurement, setMeasurement] = useState<string>(MEASUREMENTS[0])
  const [formError, setFormError] = useState('')

  const handleAddItem = () => {
    setFormError('')
    const qty = Number(quantity)

    if (!itemName.trim()) {
      setFormError('Item name is required.')
      return
    }
    if (!quantity || qty <= 0) {
      setFormError('Enter a valid quantity.')
      return
    }

    addDraftItem({
      itemName: itemName.trim(),
      quantity: qty,
      measurement
    })
    setItemName('')
    setQuantity('')
    setMeasurement(MEASUREMENTS[0])
  }

  return (
    <section className="dashboard-panel">
      <h2>My Order</h2>
      <p>Add grocery items with name, quantity, and measurement unit.</p>

      <div className="order-form">
        <div className="order-field">
          <label htmlFor="itemName">Item Name</label>
          <input
            id="itemName"
            type="text"
            placeholder="e.g. Tomato"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </div>

        <div className="order-field">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min={0.1}
            step="any"
            placeholder="e.g. 2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="order-field">
          <label htmlFor="measurement">Measurement</label>
          <select
            id="measurement"
            value={measurement}
            onChange={(e) => setMeasurement(e.target.value)}
          >
            {MEASUREMENTS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formError && <p className="form-error">{formError}</p>}

      <button type="button" className="btn-primary" onClick={handleAddItem}>
        Add Item
      </button>

      <div>
        <h3 className="section-heading">Your Items</h3>
        {draftItems.length === 0 && submittedOrders.length === 0 ? (
          <p className="empty-state">No items yet. Add items using the form above.</p>
        ) : (
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
              {submittedOrders.flatMap((order) =>
                order.items.map((item) => (
                  <tr key={`${order.id}-${item.id}`} className="row-muted">
                    <td>{item.itemName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.measurement} (submitted)</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
