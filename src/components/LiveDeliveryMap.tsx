import React, { useMemo, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { DeliveryAssignment } from '../types/store'

interface AssistData {
  weatherType: 'clear' | 'rain' | 'storm' | 'heat'
  trafficLevel: 'light' | 'moderate' | 'heavy'
  routeSuggestion: string
  adjustedEta: number
  alertMessage: string
}

interface Props {
  delivery: DeliveryAssignment
  assist?: AssistData | null
  className?: string
}

export default function LiveDeliveryMap({ delivery, assist, className = '' }: Props) {
  // Calculate the base progress from ETA
  const baseProgress = Math.max(0, Math.min(100, 100 - (delivery.etaMinutes / 30) * 100))
  
  // Rapid live tracker simulation state
  const [progress, setProgress] = useState(baseProgress)

  useEffect(() => {
    // Continuously advance the progress quickly to simulate real-time live tracking
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0 // Loop for continuous demo effect
        return prev + 0.3 // Drives forward smoothly
      })
    }, 30) // 30ms for 33fps smooth animation
    
    return () => clearInterval(interval)
  }, [])


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
      <svg 
        viewBox="0 0 1000 600" 
        style={{ width: '100%', height: '100%', display: 'block' }} 
        preserveAspectRatio="xMidYMid meet"
      >
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
        <rect width="100%" height="100%" fill="#f2f2f4" />
        
        {/* House / Building Blocks scattered in the background to mimic residential area */}
        <g fill="#e4e4e8">
          <rect x="250" y="100" width="30" height="40" rx="2" transform="rotate(15 250 100)" />
          <rect x="290" y="110" width="30" height="40" rx="2" transform="rotate(15 290 110)" />
          <rect x="330" y="120" width="30" height="40" rx="2" transform="rotate(15 330 120)" />
          
          <rect x="230" y="160" width="30" height="40" rx="2" transform="rotate(15 230 160)" />
          <rect x="270" y="170" width="30" height="40" rx="2" transform="rotate(15 270 170)" />
          
          <rect x="500" y="100" width="40" height="40" rx="4" />
          <rect x="550" y="100" width="40" height="40" rx="4" />
          
          <rect x="700" y="180" width="20" height="30" rx="2" transform="rotate(-20 700 180)" />
          <rect x="730" y="170" width="20" height="30" rx="2" transform="rotate(-20 730 170)" />
          <rect x="760" y="160" width="20" height="30" rx="2" transform="rotate(-20 760 160)" />
          
          <rect x="420" y="400" width="35" height="35" rx="3" />
          <rect x="470" y="400" width="35" height="35" rx="3" />
          
          {/* Larger complex building */}
          <path d="M 120 300 L 160 280 L 180 320 L 140 340 Z" />
          <path d="M 650 400 L 700 380 L 720 430 L 670 450 Z" />
        </g>

        {/* Minimal Main Roads intersecting */}
        <path d="M -50 250 Q 400 300 1050 200" fill="none" stroke="#ffffff" strokeWidth="24" strokeLinecap="round" />
        <path d="M 350 -50 L 400 650" fill="none" stroke="#ffffff" strokeWidth="20" strokeLinecap="round" />
        <path d="M 650 -50 L 600 650" fill="none" stroke="#ffffff" strokeWidth="18" strokeLinecap="round" />

        {/* The Exact Delivery Route Path */}
        <path 
          d="M 200 200 L 360 200 Q 380 200, 380 220 L 380 280 Q 380 300, 400 300 L 600 300 Q 620 300, 620 280 L 620 270 Q 620 250, 640 250 L 800 250" 
          fill="none" 
          stroke="#1a73e8" // Solid blue for Zomato-style route background
          strokeWidth="6" 
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />
        
        {/* Active Route highlighting (progress) */}
        <path 
          d="M 200 200 L 360 200 Q 380 200, 380 220 L 380 280 Q 380 300, 400 300 L 600 300 Q 620 300, 620 280 L 620 270 Q 620 250, 640 250 L 800 250" 
          fill="none" 
          stroke="#1a73e8" // Solid prominent blue like Zomato
          strokeWidth="6" 
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="100"
          strokeDasharray="100" 
          strokeDashoffset={100 - progress} 
          style={{ transition: 'none' }} // Handled smoothly by 30ms interval
        />

        {/* Origin / Store */}
        <g transform="translate(200, 200)">
          <circle cx="0" cy="0" r="16" fill="#1a73e8" stroke="#fff" strokeWidth="4" />
          <rect x="-45" y="-42" width="90" height="24" rx="4" fill="#fff" opacity="0.9" />
          <text x="0" y="-25" fontSize="14" fontWeight="bold" fill="#1a73e8" textAnchor="middle">🏪 Store</text>
        </g>

        {/* Destination / Customer Pin */}
        <g transform="translate(800, 250)" filter="url(#shadow)">
          {/* Black teardrop marker (scaled up by ~1.5x) */}
          <path d="M0 0 C -24 -24, -24 -48, 0 -72 C 24 -48, 24 -24, 0 0 Z" fill="#111" />
          {/* Little house icon inside the pin (scaled up) */}
          <path d="M -10.5 -45 L 0 -57 L 10.5 -45 V -33 H -10.5 Z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          <path d="M -3 -33 V -40 H 3 V -33" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          {/* Small dot at the base */}
          <circle cx="0" cy="6" r="3" fill="#111" opacity="0.3" />
          {/* Label for Customer */}
          <rect x="-50" y="-106" width="100" height="24" rx="4" fill="#fff" opacity="0.9" />
          <text x="0" y="-89" fontSize="14" fontWeight="bold" fill="#111" textAnchor="middle">📍 Customer</text>
        </g>

        {/* Dynamic Vehicle Tracking Pin */}
        <g 
          filter="url(#shadow)"
          style={{ 
            offsetPath: 'path("M 200 200 L 360 200 Q 380 200, 380 220 L 380 280 Q 380 300, 400 300 L 600 300 Q 620 300, 620 280 L 620 270 Q 620 250, 640 250 L 800 250")',
            offsetDistance: `${progress}%`,
            offsetRotate: 'auto',
            transition: 'none', // Removed 2s transition since we animate at 30ms
          } as CSSProperties & { offsetPath?: string; offsetDistance?: string; offsetRotate?: string }}
        >
          {/* White circle background for visibility */}
          <circle cx="0" cy="0" r="16" fill="#fff" stroke="#1a73e8" strokeWidth="2" />
          <text x="0" y="5" fontSize="18" textAnchor="middle" style={{ transform: 'rotate(90deg)' }}>🛵</text> 
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
