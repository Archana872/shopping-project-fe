import type { DeliveryAssignment } from '../types/store'

interface Props {
  delivery: DeliveryAssignment
  onAdvance?: () => void
}

const statusLabels: Record<DeliveryAssignment['status'], { label: string; color: string }> = {
  assigned: { label: 'Assigned', color: '#fbbf24' },
  picked_up: { label: 'Picked Up', color: '#fb923c' },
  in_transit: { label: 'On Route', color: '#38bdf8' },
  near_destination: { label: 'Near Destination', color: '#22c55e' },
  delivered: { label: 'Delivered', color: '#15803d' }
}

export default function LiveDeliveryCard({ delivery, onAdvance }: Props) {
  const status = statusLabels[delivery.status]

  return (
    <article className="live-delivery-card">
      <div className="live-delivery-card__head">
        <div>
          <h3>🚚 Order #{delivery.orderId}</h3>
          <p className="live-delivery-subtitle">Delivery Partner: {delivery.partnerName}</p>
        </div>
        <span className="live-delivery-badge" style={{ backgroundColor: status.color }}>
          {status.label}
        </span>
      </div>

      <div className="live-delivery-grid">
        <div>
          <p className="live-delivery-label">Customer</p>
          <p>{delivery.customerName}</p>
        </div>
        <div>
          <p className="live-delivery-label">Current Location</p>
          <p>{delivery.currentLat.toFixed(3)}, {delivery.currentLng.toFixed(3)}</p>
        </div>
        <div>
          <p className="live-delivery-label">ETA</p>
          <p>{delivery.etaMinutes} min</p>
        </div>
        <div>
          <p className="live-delivery-label">Fresh Meter</p>
          <p>{delivery.freshnessScore}% 🌱</p>
        </div>
      </div>

      <div className="live-delivery-status-row">
        <span>Pickup: {delivery.assignedAt}</span>
        <span>OTP: {delivery.otpCode}</span>
      </div>

      {onAdvance && delivery.status !== 'delivered' && (
        <button className="btn-primary" style={{ marginTop: 18, width: '100%' }} onClick={onAdvance}>
          Advance status
        </button>
      )}
    </article>
  )
}
