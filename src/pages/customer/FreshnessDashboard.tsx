import { useEffect, useState } from 'react'
import { getHarvestsApi, submitSatisfactionApi, type HarvestRecord } from '../../services/harvestService'
import '../../styles/freshness.css'

export default function FreshnessDashboard() {
  const [harvests, setHarvests] = useState<HarvestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<Record<number, number>>({})

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getHarvestsApi()
        setHarvests(data)
      } catch (err) {
        console.error('Failed to load harvests:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleRate = async (harvestId: number, rating: number) => {
    try {
      await submitSatisfactionApi(harvestId, rating)
      setRatings(prev => ({ ...prev, [harvestId]: rating }))
      // Update local state to reflect rating
      setHarvests(prev => prev.map(h => h.harvestId === harvestId ? { ...h, customerSatisfaction: rating } : h))
    } catch (err) {
      console.error('Failed to submit satisfaction:', err)
    }
  }

  const getElapsedTimeText = (timestampStr: string) => {
    const elapsedMs = Date.now() - new Date(timestampStr).getTime()
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))
    const elapsedHours = Math.floor(elapsedMinutes / 60)

    if (elapsedMinutes < 0) return 'Just now'
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`
    if (elapsedHours < 24) return `${elapsedHours}h ago`
    return `${Math.floor(elapsedHours / 24)}d ago`
  }

  const getExpectedFreshnessWindow = (harvestStr: string, shelfLifeHours: number) => {
    const harvestDate = new Date(harvestStr)
    const bestDate = new Date(harvestDate.getTime() + shelfLifeHours * 60 * 60 * 1000)
    return bestDate.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  }

  const CROP_ICONS: Record<string, string> = {
    Tomato: '🍅',
    Onion: '🧅',
    Potato: '🥔',
    Carrot: '🥕',
    Broccoli: '🥦',
    Cabbage: '🥬',
    Spinach: '🌿',
    Cucumber: '🥒',
    Pepper: '🫑',
    Garlic: '🧄',
    Lemon: '🍋'
  }

  const getCropIcon = (name: string) => CROP_ICONS[name] ?? '🥕'

  const getDeliveryStatus = (crop: HarvestRecord) => {
    if (crop.deliveredTimestamp) {
      return { label: 'Delivered', icon: '🏠', variant: 'success' }
    }
    if (crop.shippedTimestamp) {
      return { label: 'In Transit', icon: '🚚', variant: 'info' }
    }
    if (crop.packedTimestamp) {
      return { label: 'Packed', icon: '📦', variant: 'warning' }
    }
    if (crop.cleanedTimestamp) {
      return { label: 'Preparing', icon: '🌿', variant: 'muted' }
    }
    return { label: 'Harvesting', icon: '🌱', variant: 'muted' }
  }

  const getBadgeClass = (status: string) => {
    if (status === 'Very Fresh') return 'badge-green'
    if (status === 'Consume Soon') return 'badge-yellow'
    return 'badge-red'
  }

  // Get notifications for a crop
  const getCropNotification = (crop: HarvestRecord) => {
    const elapsedHours = (Date.now() - new Date(crop.harvestTimestamp).getTime()) / (1000 * 60 * 60)
    
    if (crop.isWasted) {
      return { message: 'Reduced freshness: This crop is no longer available.', type: 'error' }
    }
    if (crop.deliveredTimestamp && crop.freshnessScore >= 75) {
      return { message: '✨ Delivered within prime freshness window!', type: 'success' }
    }
    if (elapsedHours <= 4) {
      return { message: '🌱 Freshly harvested today!', type: 'info' }
    }
    if (crop.freshnessScore < 40) {
      return { message: '⚠️ Freshness dropping. Consume soon!', type: 'warning' }
    }
    return null
  }

  if (loading) {
    return (
      <div className="freshness-container">
        <p>Loading freshness tracking details...</p>
      </div>
    )
  }

  return (
    <div className="freshness-container">
      <div className="header-banner">
        <h1>Harvest Freshness Tracking</h1>
        <p>Real-time freshness monitoring from farm to your kitchen table.</p>
      </div>

      <div className="freshness-grid">
        {harvests.map((crop) => {
          const notification = getCropNotification(crop)
          const fillPercent = `${crop.freshnessScore}%`
          const fillColor = crop.freshnessStatus === 'Very Fresh' ? 'var(--fresh-green)' 
                            : crop.freshnessStatus === 'Consume Soon' ? 'var(--consume-yellow)' 
                            : 'var(--reduced-red)'

          return (
            <div key={crop.harvestId} className="freshness-card">
              <div className="card-header">
                <h2 className="card-title">{crop.cropName}</h2>
                <span className={`badge ${getBadgeClass(crop.freshnessStatus)}`}>
                  {crop.freshnessStatus}
                </span>
              </div>

              <div className="card-body">
                <div className="card-lead">
                  <div className="vegetable-image">{getCropIcon(crop.cropName)}</div>
                  <div className="vegetable-meta">
                    <p className="vegetable-name">{crop.cropName}</p>
                    <p className="vegetable-subtitle">Harvested {getElapsedTimeText(crop.harvestTimestamp)}</p>
                  </div>
                </div>

                {notification && (
                  <div className="notifications-box" style={{
                    backgroundColor: notification.type === 'success' ? '#f0fff4' : notification.type === 'info' ? '#ebf8ff' : '#fff5f5',
                    borderColor: notification.type === 'success' ? '#c6f6d5' : notification.type === 'info' ? '#bee3f8' : '#fed7d7',
                  }}>
                    <span className="notifications-box__emoji">
                      {notification.type === 'success' ? '🚀' : notification.type === 'info' ? '🌱' : '⚠️'}
                    </span>
                    <span className="notifications-box__message" style={{
                      color: notification.type === 'success' ? '#22543d' : notification.type === 'info' ? '#2a4365' : '#742a2a'
                    }}>
                      {notification.message}
                    </span>
                  </div>
                )}

                <div className="freshness-wheel-container">
                  <div className="freshness-wheel" style={{ 
                    '--percentage': fillPercent,
                    '--fill-color': fillColor 
                  } as any}>
                    <span className="freshness-wheel-text">{crop.freshnessScore}%</span>
                  </div>
                  <div className="freshness-info">
                    <span className="info-label">Harvested</span>
                    <span className="info-value">{getElapsedTimeText(crop.harvestTimestamp)}</span>
                    <span className="info-label" style={{ marginTop: '6px' }}>Best Before</span>
                    <span className="info-value">{getExpectedFreshnessWindow(crop.harvestTimestamp, crop.shelfLifeHours)}</span>
                  </div>
                </div>

                <div className="status-row">
                  <span className={`delivery-pill ${getDeliveryStatus(crop).variant}`}>
                    {getDeliveryStatus(crop).icon} {getDeliveryStatus(crop).label}
                  </span>
                  <span className="info-value" style={{ color: '#475569' }}>
                    {crop.shippedTimestamp ? 'Delivery is on the way' : crop.packedTimestamp ? 'Packing complete' : 'Pending preparation'}
                  </span>
                </div>

                <div className="timeline-title">Freshness timeline</div>
                <div className="timeline">
                  {/* Harvested */}
                  <div className="timeline-step completed">
                    <div className="step-indicator" />
                    <span className="step-label">Harvested</span>
                    <div className="step-tooltip">
                      {new Date(crop.harvestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Cleaned */}
                  <div className={`timeline-step ${crop.cleanedTimestamp ? 'completed' : ''}`}>
                    <div className="step-indicator" />
                    <span className="step-label">Cleaned</span>
                    {crop.cleanedTimestamp && (
                      <div className="step-tooltip">
                        {new Date(crop.cleanedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>

                  {/* Packed */}
                  <div className={`timeline-step ${crop.packedTimestamp ? 'completed' : ''}`}>
                    <div className="step-indicator" />
                    <span className="step-label">Packed</span>
                    {crop.packedTimestamp && (
                      <div className="step-tooltip">
                        {new Date(crop.packedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>

                  {/* In Transit */}
                  <div className={`timeline-step ${crop.shippedTimestamp ? 'completed' : ''}`}>
                    <div className="step-indicator" />
                    <span className="step-label">In Transit</span>
                    {crop.shippedTimestamp && (
                      <div className="step-tooltip">
                        {new Date(crop.shippedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>

                  {/* Delivered */}
                  <div className={`timeline-step ${crop.deliveredTimestamp ? 'completed' : ''}`}>
                    <div className="step-indicator" />
                    <span className="step-label">Delivered</span>
                    {crop.deliveredTimestamp && (
                      <div className="step-tooltip">
                        {new Date(crop.deliveredTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>

                {crop.deliveredTimestamp && (
                  <div className="rating-section">
                    <span className="info-label">Rate Delivered Freshness:</span>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = ratings[crop.harvestId] ?? crop.customerSatisfaction ?? 0
                        return (
                          <button
                            key={star}
                            className="star-btn"
                            onClick={() => handleRate(crop.harvestId, star)}
                            style={{ opacity: star <= currentRating ? 1 : 0.3 }}
                          >
                            ⭐
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
