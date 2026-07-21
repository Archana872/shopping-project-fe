import type { DeliveryAssignment } from '../types/store'

interface AssistData {
  weatherType: 'clear' | 'rain' | 'storm' | 'heat'
  adjustedEta: number
  trafficLevel: 'light' | 'moderate' | 'heavy'
}

interface Props {
  delivery: DeliveryAssignment
  assist?: AssistData | null
  onAdvance?: () => void
}

const statusLabels: Record<DeliveryAssignment['status'], { label: string; color: string }> = {
  assigned: { label: 'Assigned', color: '#fbbc04' },
  picked_up: { label: 'Picked Up', color: '#f29900' },
  in_transit: { label: 'On Route', color: '#4285f4' },
  near_destination: { label: 'Near Destination', color: '#34a853' },
  delivered: { label: 'Delivered', color: '#137333' }
}

export default function LiveDeliveryCard({ delivery, assist, onAdvance }: Props) {
  const status = statusLabels[delivery.status]
  
  const eta = assist?.adjustedEta ?? delivery.etaMinutes
  const progress = Math.min(100, Math.max(0, 100 - eta * 4))
  const trafficColor = assist?.trafficLevel === 'heavy' ? '#ea4335' : assist?.trafficLevel === 'moderate' ? '#fbbc04' : '#34a853'

  return (
    <article className="glass-delivery-card" style={{
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)',
      borderRadius: '24px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      width: '100%',
      maxWidth: '480px', // constrain on desktop
      margin: '0 auto',
      pointerEvents: 'auto'
    }}>
      {/* Header section with driver and status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e8eaed', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            🛵
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#202124' }}>{delivery.partnerName || 'Assigning Partner'}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#5f6368', fontWeight: 500 }}>{delivery.partnerPhone || 'Waiting for details...'}</p>
          </div>
        </div>
        <span style={{ 
          backgroundColor: status.color, 
          color: '#fff', 
          padding: '6px 14px', 
          borderRadius: '20px', 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '0.5px' 
        }}>
          {status.label}
        </span>
      </div>

      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', width: '100%' }}></div>

      {/* ETA and Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase' }}>Estimated Arrival</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#202124', lineHeight: 1 }}>{eta} <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#80868b' }}>min</span></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase' }}>Order No.</p>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#202124' }}>#{delivery.orderId}</p>
          </div>
        </div>
        
        <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            background: trafficColor, 
            borderRadius: '10px', 
            transition: 'width 1s ease' 
          }}></div>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', width: '100%' }}></div>

      {/* Address & OTP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase' }}>Delivery Address</p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: '#202124', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {delivery.customerAddress}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase' }}>Delivery PIN</p>
          <div style={{ background: '#f8f9fa', border: '1px solid #dadce0', padding: '6px 16px', borderRadius: '8px', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '2px', color: '#1a73e8' }}>
            {delivery.otpCode}
          </div>
        </div>
      </div>

      {onAdvance && delivery.status !== 'delivered' && (
        <button 
          onClick={onAdvance}
          style={{ 
            marginTop: '8px', 
            background: '#1a73e8', 
            color: '#fff', 
            border: 'none', 
            padding: '14px', 
            borderRadius: '12px', 
            fontSize: '1rem', 
            fontWeight: 600, 
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#1557b0')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#1a73e8')}
        >
          Advance Status (Test)
        </button>
      )}
    </article>
  )
}

