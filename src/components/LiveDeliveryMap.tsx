import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { DeliveryAssignment } from '../types/store'

interface AssistData {
  weatherType: 'clear' | 'rain' | 'storm' | 'heat'
  adjustedEta: number
  trafficLevel: 'light' | 'moderate' | 'heavy'
}

interface Props {
  delivery: DeliveryAssignment
  assist?: AssistData | null
  className?: string
}

export default function LiveDeliveryMap({ delivery, assist, className = '' }: Props) {
  const eta = assist?.adjustedEta ?? delivery.etaMinutes
  const progress = Math.min(100, Math.max(0, 100 - eta * 4))
  const trafficColor = assist?.trafficLevel === 'heavy' ? '#ea4335' : assist?.trafficLevel === 'moderate' ? '#fbbc04' : '#34a853'
  const isRain = assist?.weatherType === 'rain' || assist?.weatherType === 'storm'

  const raindrops = useMemo(() => {
    if (!isRain) return []
    return Array.from({ length: 50 }).map((_, index) => {
      // eslint-disable-next-line react-hooks/purity
      const h = Math.random() * 20 + 10
      // eslint-disable-next-line react-hooks/purity
      const l = Math.random() * 100
      // eslint-disable-next-line react-hooks/purity
      const t = Math.random() * 20 + 10
      // eslint-disable-next-line react-hooks/purity
      const a = 0.4 + Math.random() * 0.4
      // eslint-disable-next-line react-hooks/purity
      const d = Math.random()
      
      return {
        id: index,
        height: `${h}px`,
        left: `${l}%`,
        top: `-${t}%`,
        animation: `rain-fall ${a}s linear infinite`,
        delay: `${d}s`
      }
    })
  }, [isRain])

  return (
    <div className={`live-delivery-map-container ${className}`} style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      minHeight: '400px',
      borderRadius: '24px',
      background: '#ebebf0', // GMaps background
      overflow: 'hidden'
    }}>
      {/* Realistic SVG Map Background */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#e0e0e0" strokeWidth="1" opacity="0.6" />
          </pattern>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.2" />
          </filter>
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#ebebf0" />
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Terrain Details: Parks & Water */}
        {/* River */}
        <path d="M 0 100 Q 300 200 600 50 T 1000 150 L 1000 0 L 0 0 Z" fill="#aadaff" opacity="0.8" />
        <path d="M 0 500 Q 400 450 800 600 L 0 600 Z" fill="#c5e1a5" opacity="0.6" />
        
        {/* City Blocks */}
        <rect x="150" y="200" width="180" height="120" rx="4" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="1" />
        <rect x="380" y="220" width="220" height="180" rx="4" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="1" />
        <rect x="100" y="380" width="240" height="100" rx="4" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="1" />
        <rect x="650" y="300" width="200" height="240" rx="4" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="1" />
        <rect x="680" y="80" width="160" height="150" rx="16" fill="#c5e1a5" opacity="0.7" />
        
        {/* Main Roads */}
        <path d="M -50 250 Q 400 300 1050 200" fill="none" stroke="#ffffff" strokeWidth="28" strokeLinecap="round" />
        <path d="M -50 250 Q 400 300 1050 200" fill="none" stroke="#f1f3f4" strokeWidth="26" strokeLinecap="round" />
        
        <path d="M 350 -50 L 400 650" fill="none" stroke="#ffffff" strokeWidth="24" strokeLinecap="round" />
        <path d="M 350 -50 L 400 650" fill="none" stroke="#f1f3f4" strokeWidth="22" strokeLinecap="round" />
        
        <path d="M 650 -50 L 600 650" fill="none" stroke="#ffffff" strokeWidth="20" strokeLinecap="round" />
        <path d="M 650 -50 L 600 650" fill="none" stroke="#f1f3f4" strokeWidth="18" strokeLinecap="round" />

        {/* The Exact Delivery Route Path */}
        <path 
          d="M 200 200 C 400 200, 500 400, 800 250" 
          fill="none" 
          stroke="#4285f4" // Google Blue for route background
          strokeWidth="8" 
          strokeLinecap="round"
          opacity="0.3"
        />
        
        {/* Active Route highlighting (progress) */}
        <path 
          d="M 200 200 C 400 200, 500 400, 800 250" 
          fill="none" 
          stroke={trafficColor} 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray="24 16"
          style={{ animation: 'dash-flow 1s linear infinite' }}
        />

        {/* Origin / Store Pin */}
        <g transform="translate(200, 200)" filter="url(#soft-shadow)">
          <circle cx="0" cy="0" r="14" fill="#000" stroke="#fff" strokeWidth="2" />
          <rect x="-4" y="-4" width="8" height="8" fill="#fff" />
        </g>

        {/* Destination / Customer Pin */}
        <g transform="translate(800, 250)" filter="url(#shadow)">
          {/* GMaps style teardrop marker */}
          <path d="M0 0 C -16 -16, -16 -32, 0 -48 C 16 -32, 16 -16, 0 0 Z" fill="#ea4335" />
          <circle cx="0" cy="-32" r="6" fill="#7a140b" opacity="0.4" />
          <circle cx="0" cy="-32" r="5" fill="#fff" />
        </g>

        {/* Dynamic Vehicle Tracking Pin */}
        <g 
          filter="url(#shadow)"
          style={{ 
            offsetPath: 'path("M 200 200 C 400 200, 500 400, 800 250")',
            offsetDistance: `${progress}%`,
            transition: 'offset-distance 2s linear',
          } as CSSProperties & { offsetPath?: string; offsetDistance?: string }}
        >
          {/* Vehicle icon / dot */}
          <circle cx="0" cy="0" r="24" fill="#fff" stroke={trafficColor} strokeWidth="4" />
          <circle cx="0" cy="0" r="6" fill={trafficColor} />
          <text x="0" y="6" fontSize="20" textAnchor="middle" opacity="0">🚚</text> 
          {/* We replace the text emoji with a sleeker car-like visual, but keeping a subtle visual */}
          <circle cx="0" cy="0" r="18" fill="none" stroke={trafficColor} strokeWidth="1" strokeDasharray="4 2" style={{ animation: 'spin 4s linear infinite' }} />
        </g>
      </svg>

      {isRain && (
        <div className="rain-overlay" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
          {raindrops.map((drop) => (
            <span 
              key={drop.id} 
              className="rain-drop" 
              style={{ 
                position: 'absolute',
                width: '1px', 
                height: drop.height,
                background: 'rgba(255, 255, 255, 0.7)',
                left: drop.left, 
                top: drop.top,
                animation: drop.animation,
                animationDelay: drop.delay
              }} 
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -40; }
        }
        @keyframes rain-fall {
          0% { transform: translateY(0) scaleY(1) rotate(15deg); opacity: 0; }
          10% { opacity: 1; }
          80% { transform: translateY(800px) scaleY(1.5) rotate(15deg); opacity: 1; }
          100% { transform: translateY(1000px) scaleY(1) rotate(15deg); opacity: 0; }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
