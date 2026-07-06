import { useEffect, useState } from 'react'
import { getSession, type Customer } from '../../utils/authStorage'
import { confirmDeliveryOtp, getDeliveryByOrderId, getOrdersByCustomer } from '../../utils/storeStorage'
import { getOrdersByCustomerApi, type ApiOrder } from '../../services/itemService'
import LiveDeliveryCard from '../../components/LiveDeliveryCard'
import LiveDeliveryMap from '../../components/LiveDeliveryMap'
import type { DeliveryAssignment, StoreOrder } from '../../types/store'
import '../../styles/live-delivery.css'

const TRACK_STEPS = ['Order Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered'] as const

function statusToStep(status: StoreOrder['status'] | string): string {
  if (status === 'pending') return 'Order Placed'
  if (status === 'rejected') return 'Order Placed'
  if (status === 'approved' || status === 'Confirmed') return 'Confirmed'
  if (status === 'sent_to_delivery' || status === 'Out for Delivery') return 'Out for Delivery'
  if (status === 'Delivered' || status === 'delivered') return 'Delivered'
  return 'Order Placed'
}

type DisplayOrder = {
  id: number
  status: string
  submittedAt: string
  billAmount?: number
  rejectionReason?: string
}

function toDisplayOrder(o: StoreOrder | ApiOrder): DisplayOrder {
  return {
    id: o.id,
    status: o.status,
    submittedAt: o.submittedAt,
    billAmount: (o as StoreOrder).billAmount ?? (o as ApiOrder).billAmount,
    rejectionReason: (o as StoreOrder).rejectionReason ?? (o as ApiOrder).rejectionReason
  }
}

export default function TrackOrderPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([])
  const [delivery, setDelivery] = useState<DeliveryAssignment | null>(null)
  const [otpInput, setOtpInput] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState('')
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (!proofFile) {
      setProofPreview(null)
      return
    }

    const url = URL.createObjectURL(proofFile)
    setProofPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [proofFile])

  useEffect(() => {
    let active = true

    const loadOrders = async () => {
      const session = getSession()
      if (!session || session.role !== 'customer') return

      const customer = session.user as Customer
      let latestOrder: StoreOrder | undefined

      try {
        const apiOrders = await getOrdersByCustomerApi(customer.email)
        if (Array.isArray(apiOrders) && apiOrders.length > 0) {
          if (!active) return
          setOrders(apiOrders.map(toDisplayOrder))
          setApiError('')
          latestOrder = apiOrders[apiOrders.length - 1] as StoreOrder
        }
      } catch {
        // Fall back to localStorage silently
      }

      if (!latestOrder) {
        const localOrders = getOrdersByCustomer(customer.email)
        if (!active) return
        setOrders(localOrders.map(toDisplayOrder))
        latestOrder = localOrders[localOrders.length - 1]
      }

      if (latestOrder) {
        const assignment = getDeliveryByOrderId(latestOrder.id)
        setDelivery(assignment ?? null)
      } else {
        setDelivery(null)
      }
    }

    loadOrders()
    const interval = window.setInterval(loadOrders, 3000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const handleConfirmOtp = () => {
    if (!delivery) return
    if (!otpInput.trim()) {
      setVerificationError('Enter the OTP from the delivery partner.')
      setConfirmationMessage('')
      return
    }

    const updated = confirmDeliveryOtp(delivery.id, otpInput, proofPreview ?? undefined)
    if (!updated) {
      setVerificationError('OTP does not match or delivery cannot be confirmed yet.')
      setConfirmationMessage('')
      return
    }

    setDelivery(updated)
    setOtpInput('')
    setProofFile(null)
    setVerificationError('')
    setConfirmationMessage('Delivery verified! Your order is now marked delivered.')
  }

  const latestOrder = orders[orders.length - 1]

  return (
    <section className="dashboard-panel">
      <h2>Track Order</h2>
      <p>Follow your order from placement to delivery.</p>

      {apiError && <p className="form-error">{apiError}</p>}

      {!latestOrder ? (
        <p className="empty-state">No submitted orders yet. Create and submit an order first.</p>
      ) : latestOrder.status === 'rejected' ? (
        <>
          <p className="order-meta">Order #{latestOrder.id} — {latestOrder.submittedAt}</p>
          <div className="owner-stock-warning" style={{ marginTop: 16 }}>
            ❌ Order rejected: {latestOrder.rejectionReason}
          </div>
        </>
      ) : (
        <>
          <p className="order-meta">
            Order #{latestOrder.id} — {latestOrder.submittedAt}
            {latestOrder.billAmount !== undefined && ` · Bill: ₹${latestOrder.billAmount}`}
          </p>
          <div className="track-steps">
            {TRACK_STEPS.map((status) => {
              const current = statusToStep(latestOrder.status)
              const done = TRACK_STEPS.indexOf(status) <= TRACK_STEPS.indexOf(current as (typeof TRACK_STEPS)[number])
              return (
                <div
                  key={status}
                  className={`track-step${done ? ' track-step--done' : ' track-step--pending'}`}
                >
                  {status}
                </div>
              )
            })}
          </div>
          <p className="status-note">
            Current status: <strong>{latestOrder.status.replace(/_/g, ' ')}</strong>
          </p>

          {delivery && delivery.orderId === latestOrder.id ? (
            <div style={{ marginTop: 24 }}>
              <LiveDeliveryCard delivery={delivery} />
              <LiveDeliveryMap delivery={delivery} />

              <section className="dashboard-panel" style={{ marginTop: 24 }}>
                <h3>Delivery confirmation</h3>
                <p>Enter the OTP shown by your rider and optionally upload a delivery proof image.</p>

                {verificationError && <p className="form-error">{verificationError}</p>}
                {confirmationMessage && <p className="success-text">{confirmationMessage}</p>}

                {delivery.status !== 'delivered' ? (
                  <div style={{ display: 'grid', gap: 16, marginTop: 18 }}>
                    <div>
                      <label htmlFor="deliveryOtp">Delivery OTP</label>
                      <input
                        id="deliveryOtp"
                        type="text"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="Enter OTP from rider"
                      />
                    </div>

                    <div>
                      <label htmlFor="proofUpload">Delivery proof (optional)</label>
                      <input
                        id="proofUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          setProofFile(file ?? null)
                        }}
                      />
                    </div>

                    {proofPreview && (
                      <div>
                        <p style={{ marginBottom: 8 }}>Preview</p>
                        <img
                          src={proofPreview}
                          alt="Delivery proof preview"
                          style={{ borderRadius: 12, maxWidth: '100%', display: 'block', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                        />
                      </div>
                    )}

                    <button type="button" className="btn-primary" onClick={handleConfirmOtp}>
                      Confirm Delivery
                    </button>
                  </div>
                ) : (
                  <div className="empty-state" style={{ marginTop: 12 }}>
                    Delivery confirmed. Thank you for using FreshMart.
                  </div>
                )}
              </section>
            </div>
          ) : latestOrder.status === 'sent_to_delivery' ? (
            <div className="empty-state" style={{ marginTop: 24 }}>
              Your order has been sent to delivery. Live tracking will appear once the rider begins the route.
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
