import type { DeliveryAssignment } from '../types/store'

interface AssistData {
  weatherType: 'clear' | 'rain' | 'storm' | 'heat'
  adjustedEta: number
  trafficLevel: 'light' | 'moderate' | 'heavy'
}

interface Props {
  delivery: DeliveryAssignment
  assist?: AssistData | null
}

export default function LiveDeliveryMap({ delivery, assist }: Props) {
  const eta = assist?.adjustedEta ?? delivery.etaMinutes
  const progress = Math.min(100, Math.max(0, 100 - eta * 4))
  const trafficColor = assist?.trafficLevel === 'heavy' ? '#ef4444' : assist?.trafficLevel === 'moderate' ? '#f97316' : '#22c55e'
  const isRain = assist?.weatherType === 'rain' || assist?.weatherType === 'storm'

  return (
    <section className="live-delivery-map-card">
      <div className="live-delivery-map-header">
        <div>
          <h3>Map & Live Route</h3>
          <p>Watch the delivery partner move toward the customer in real time.</p>
        </div>
        <span className={`live-delivery-map-label live-delivery-status-${assist?.trafficLevel ?? 'light'}`}>{delivery.status.replace('_', ' ')}</span>
      </div>

      <div className="live-delivery-map-frame">
        <div className="map-pin map-pin--rider">🚚</div>
        <div className="map-pin map-pin--customer">📍</div>
        <svg className="route-line" viewBox="0 0 300 220" aria-hidden="true">
          <path
            d="M40 40 C120 120 180 100 260 180"
            fill="none"
            stroke={trafficColor}
            strokeWidth="5"
            strokeDasharray="10 10"
          />
        </svg>
        {isRain && (
          <div className="rain-overlay" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} className="rain-drop" />
            ))}
          </div>
        )}
      </div>

      <div className="live-delivery-map-metrics">
        <div>
          <p className="live-delivery-label">Arrival Countdown</p>
          <p>{eta} mins</p>
        </div>
        <div>
          <p className="live-delivery-label">Delivery address</p>
          <p>{delivery.customerAddress}</p>
        </div>
      </div>

      <div className="live-delivery-progress">
        <span>{progress}% complete</span>
        <div className="live-progress-bar">
          <div className="live-progress-fill" style={{ width: `${progress}%`, background: trafficColor }} />
        </div>
      </div>
    </section>
  )
}
