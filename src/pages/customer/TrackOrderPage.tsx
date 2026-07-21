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
  const [isLoading, setIsLoading] = useState(true)
  
  const [otpInput, setOtpInput] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState('')
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (!proofFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProofPreview(null)
      return
    }

    const url = URL.createObjectURL(proofFile)
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      
      if (active) setIsLoading(false)
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

  if (isLoading) {
    return (
      <section className="dashboard-panel" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ height: '32px', width: '200px', background: '#f1f3f5', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
        <div style={{ height: '24px', width: '300px', background: '#f1f3f5', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
        <div style={{ height: '400px', width: '100%', background: '#e9ecef', borderRadius: '24px', animation: 'pulse 1.5s infinite', marginTop: '24px' }}></div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </section>
    )
  }

  return (
    <section className="dashboard-panel" style={{ padding: '0', background: 'transparent', boxShadow: 'none' }}>
      <div style={{ padding: '0 16px 24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#202124', margin: '0 0 8px' }}>Track Order</h2>
        <p style={{ color: '#5f6368', margin: 0, fontSize: '1rem' }}>Follow your order from placement to delivery.</p>
      </div>

      {apiError && <p className="form-error" style={{ margin: '0 16px 16px' }}>{apiError}</p>}

      {!latestOrder ? (
        <div className="empty-state" style={{ background: '#fff', borderRadius: '24px', padding: '64px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', margin: '0 16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#202124' }}>No active orders</h3>
          <p style={{ margin: 0, color: '#5f6368' }}>You haven't placed any orders yet. Once you order, track it here.</p>
        </div>
      ) : latestOrder.status === 'rejected' ? (
        <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', margin: '0 16px', border: '1px solid #f8d7da', boxShadow: '0 4px 20px rgba(220,53,69,0.05)' }}>
          <h3 style={{ color: '#dc3545', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>❌</span> Order Cancelled
          </h3>
          <p className="order-meta">Order #{latestOrder.id} — {latestOrder.submittedAt}</p>
          <div style={{ marginTop: 16, padding: '16px', background: '#fdf3f4', borderRadius: '12px', color: '#842029' }}>
            <strong>Reason:</strong> {latestOrder.rejectionReason}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', margin: '0 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f3f5', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 600, color: '#5f6368', textTransform: 'uppercase' }}>Order ID #{latestOrder.id}</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#80868b' }}>{latestOrder.submittedAt}</p>
            </div>
            {latestOrder.billAmount !== undefined && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 600, color: '#5f6368', textTransform: 'uppercase' }}>Total Bill</p>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1a73e8' }}>₹{latestOrder.billAmount}</p>
              </div>
            )}
          </div>

          <div className="track-steps" style={{ marginBottom: '32px' }}>
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

          {delivery && delivery.orderId === latestOrder.id ? (
            <div style={{ position: 'relative', width: '100%', height: '70vh', minHeight: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
              {/* Full bleed map background */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <LiveDeliveryMap delivery={delivery} />
              </div>
              
              {/* Glassmorphic overlay panel */}
              <div style={{ 
                position: 'absolute', 
                bottom: '24px', 
                left: '24px', 
                right: '24px', 
                display: 'flex', 
                justifyContent: 'center',
                pointerEvents: 'none' // Let clicks pass through except on the card itself
              }}>
                <LiveDeliveryCard delivery={delivery} />
              </div>
            </div>
          ) : latestOrder.status === 'sent_to_delivery' ? (
            <div style={{ padding: '40px', background: '#f8f9fa', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'bounce 2s infinite' }}>🛵</div>
              <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#202124' }}>Waiting for Rider</h4>
              <p style={{ margin: 0, color: '#5f6368' }}>Your order has been sent to delivery. Live tracking will appear once a rider is assigned.</p>
              <style>{`
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
              `}</style>
            </div>
          ) : null}

          {/* Delivery Confirmation block (OTP) */}
          {delivery && delivery.orderId === latestOrder.id && (
            <div style={{ marginTop: '32px', background: '#f8f9fa', padding: '24px', borderRadius: '16px', border: '1px solid #e9ecef' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#202124' }}>Confirm Delivery</h3>
              <p style={{ margin: '0 0 20px', color: '#5f6368', fontSize: '0.9rem' }}>Enter the OTP provided by the rider or confirm with proof.</p>

              {verificationError && <p className="form-error" style={{ marginBottom: '16px' }}>{verificationError}</p>}
              {confirmationMessage && <p className="success-text" style={{ marginBottom: '16px', color: '#137333', background: '#e6f4ea', padding: '12px', borderRadius: '8px' }}>{confirmationMessage}</p>}

              {delivery.status !== 'delivered' ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label htmlFor="deliveryOtp" style={{ fontWeight: 600, color: '#495057', display: 'block', marginBottom: '8px' }}>Delivery OTP</label>
                    <input
                      id="deliveryOtp"
                      type="text"
                      className="auth-input"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter the 4-digit PIN"
                      style={{ fontSize: '1.2rem', letterSpacing: '2px', padding: '12px' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="proofUpload" style={{ fontWeight: 600, color: '#495057', display: 'block', marginBottom: '8px' }}>Upload Proof (Optional)</label>
                    <input
                      id="proofUpload"
                      type="file"
                      accept="image/*"
                      className="auth-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        setProofFile(file ?? null)
                      }}
                    />
                  </div>

                  {proofPreview && (
                    <div>
                      <img
                        src={proofPreview}
                        alt="Preview"
                        style={{ borderRadius: '12px', maxHeight: '150px', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                      />
                    </div>
                  )}

                  <button type="button" className="btn-primary" onClick={handleConfirmOtp} style={{ padding: '14px', fontSize: '1rem', borderRadius: '12px' }}>
                    Verify & Complete Delivery
                  </button>
                </div>
              ) : (
                <div style={{ background: '#e6f4ea', color: '#137333', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>✅</span>
                  <div>
                    <strong>Delivery Confirmed</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Thank you for using FreshMart!</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

