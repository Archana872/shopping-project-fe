const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export interface HarvestRecord {
  harvestId: number
  cropId: number
  cropName: string
  harvestTimestamp: string
  cleanedTimestamp?: string | null
  packedTimestamp?: string | null
  shippedTimestamp?: string | null
  deliveredTimestamp?: string | null
  freshnessScore: number
  freshnessStatus: string
  shelfLifeHours: number
  customerSatisfaction?: number | null
  isWasted: boolean
}

export interface CropTrend {
  cropName: string
  averageFreshness: number
}

export interface HarvestAnalyticsData {
  dailyFreshnessScore: number
  averageHarvestToDeliveryHours: number
  wastagePercentage: number
  customerSatisfaction: number
  cropTrends: CropTrend[]
  weeklyReportScores: number[]
  monthlyReportScores: number[]
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Request failed (${res.status}) ${text}`)
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }

  return (await res.text()) as T
}

// Local Storage seed helper
function getLocalHarvests(): HarvestRecord[] {
  const raw = localStorage.getItem('freshmart_harvests')
  if (!raw) {
    const defaultHarvests: HarvestRecord[] = [
      {
        harvestId: 1,
        cropId: 1,
        cropName: 'Tomato',
        harvestTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        cleanedTimestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        packedTimestamp: null,
        shippedTimestamp: null,
        deliveredTimestamp: null,
        freshnessScore: 95,
        freshnessStatus: 'Very Fresh',
        shelfLifeHours: 48,
        isWasted: false
      },
      {
        harvestId: 2,
        cropId: 2,
        cropName: 'Onion',
        harvestTimestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        cleanedTimestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        packedTimestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        shippedTimestamp: null,
        deliveredTimestamp: null,
        freshnessScore: 90,
        freshnessStatus: 'Very Fresh',
        shelfLifeHours: 168,
        isWasted: false
      },
      {
        harvestId: 3,
        cropId: 3,
        cropName: 'Potato',
        harvestTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        cleanedTimestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        packedTimestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
        shippedTimestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        deliveredTimestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        freshnessScore: 85,
        freshnessStatus: 'Very Fresh',
        shelfLifeHours: 240,
        customerSatisfaction: 5,
        isWasted: false
      }
    ]
    localStorage.setItem('freshmart_harvests', JSON.stringify(defaultHarvests))
    return defaultHarvests
  }
  return JSON.parse(raw)
}

function saveLocalHarvests(harvests: HarvestRecord[]) {
  localStorage.setItem('freshmart_harvests', JSON.stringify(harvests))
}

function recalculateLocalFreshness(harvests: HarvestRecord[]): HarvestRecord[] {
  const now = new Date()
  return harvests.map(h => {
    if (h.isWasted) {
      return { ...h, freshnessScore: 0, freshnessStatus: 'Reduced Freshness' }
    }
    const end = h.deliveredTimestamp ? new Date(h.deliveredTimestamp) : now
    const elapsedMs = end.getTime() - new Date(h.harvestTimestamp).getTime()
    const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60))

    let score = 100
    if (h.shelfLifeHours > 0) {
      score = Math.max(0, Math.min(100, Math.round((1.0 - (elapsedHours / h.shelfLifeHours)) * 100)))
    } else {
      score = 0
    }

    let status = 'Very Fresh'
    if (score < 40) {
      status = 'Reduced Freshness'
    } else if (score < 75) {
      status = 'Consume Soon'
    }

    return { ...h, freshnessScore: score, freshnessStatus: status }
  })
}

export async function getHarvestsApi(): Promise<HarvestRecord[]> {
  try {
    return await request<HarvestRecord[]>('/harvest')
  } catch (err) {
    console.warn('Harvest API failed, using localStorage:', err)
    const local = getLocalHarvests()
    const updated = recalculateLocalFreshness(local)
    saveLocalHarvests(updated)
    return updated
  }
}

export async function addHarvestApi(payload: {
  cropId: number
  cropName: string
  harvestTimestamp: string
  shelfLifeHours: number
}): Promise<void> {
  try {
    await request<void>('/harvest', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  } catch (err) {
    console.warn('Harvest API failed, saving to localStorage:', err)
    const local = getLocalHarvests()
    const newRecord: HarvestRecord = {
      harvestId: Date.now(),
      cropId: payload.cropId,
      cropName: payload.cropName,
      harvestTimestamp: payload.harvestTimestamp,
      freshnessScore: 100,
      freshnessStatus: 'Very Fresh',
      shelfLifeHours: payload.shelfLifeHours,
      isWasted: false
    }
    saveLocalHarvests([...local, newRecord])
  }
}

export async function updateTimelineApi(
  harvestId: number,
  stage: string,
  timestamp: string
): Promise<void> {
  try {
    await request<void>(`/harvest/${harvestId}/timeline`, {
      method: 'PUT',
      body: JSON.stringify({ stage, timestamp })
    })
  } catch (err) {
    console.warn('Harvest API failed, updating localStorage:', err)
    const local = getLocalHarvests()
    const updated = local.map(h => {
      if (h.harvestId === harvestId) {
        const key = stage.toLowerCase() === 'harvested' ? 'harvestTimestamp'
                  : stage.toLowerCase() === 'cleaned' ? 'cleanedTimestamp'
                  : stage.toLowerCase() === 'packed' ? 'packedTimestamp'
                  : stage.toLowerCase() === 'shipped' || stage.toLowerCase() === 'in transit' ? 'shippedTimestamp'
                  : stage.toLowerCase() === 'delivered' ? 'deliveredTimestamp' : null
        if (key) {
          return { ...h, [key]: timestamp }
        }
      }
      return h
    })
    saveLocalHarvests(updated)
  }
}

export async function submitSatisfactionApi(
  harvestId: number,
  satisfaction: number
): Promise<void> {
  try {
    await request<void>(`/harvest/${harvestId}/satisfaction`, {
      method: 'PUT',
      body: JSON.stringify({ satisfaction })
    })
  } catch (err) {
    console.warn('Harvest API failed, saving satisfaction to localStorage:', err)
    const local = getLocalHarvests()
    const updated = local.map(h => {
      if (h.harvestId === harvestId) {
        return { ...h, customerSatisfaction: satisfaction }
      }
      return h
    })
    saveLocalHarvests(updated)
  }
}

export async function updateHarvestApi(
  harvestId: number,
  payload: {
    freshnessScore: number
    freshnessStatus: string
  }
): Promise<void> {
  try {
    await request<void>(`/harvest/${harvestId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  } catch (err) {
    console.warn('Harvest API failed, updating harvest values in localStorage:', err)
    const local = getLocalHarvests()
    const updated = local.map(h => {
      if (h.harvestId === harvestId) {
        return {
          ...h,
          freshnessScore: payload.freshnessScore,
          freshnessStatus: payload.freshnessStatus
        }
      }
      return h
    })
    saveLocalHarvests(updated)
  }
}

export async function markWastedApi(
  harvestId: number,
  isWasted: boolean
): Promise<void> {
  try {
    await request<void>(`/harvest/${harvestId}/wastage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isWasted)
    })
  } catch (err) {
    console.warn('Harvest API failed, marking wasted in localStorage:', err)
    const local = getLocalHarvests()
    const updated = local.map(h => {
      if (h.harvestId === harvestId) {
        return { ...h, isWasted }
      }
      return h
    })
    saveLocalHarvests(updated)
  }
}

export async function getAnalyticsApi(): Promise<HarvestAnalyticsData> {
  try {
    return await request<HarvestAnalyticsData>('/harvest/analytics')
  } catch (err) {
    console.warn('Harvest Analytics API failed, computing from localStorage:', err)
    const harvests = recalculateLocalFreshness(getLocalHarvests())
    
    // Compute analytics
    const now = new Date()
    const recent = harvests.filter(h => (now.getTime() - new Date(h.harvestTimestamp).getTime()) <= 24 * 60 * 60 * 1000)
    const dailyFreshnessScore = recent.length ? Math.round(recent.reduce((sum, h) => sum + h.freshnessScore, 0) / recent.length) : 85

    const delivered = harvests.filter(h => h.deliveredTimestamp)
    let averageHarvestToDeliveryHours = 0
    if (delivered.length) {
      const sumDiffHours = delivered.reduce((sum, h) => {
        const diffMs = new Date(h.deliveredTimestamp!).getTime() - new Date(h.harvestTimestamp).getTime()
        return sum + (diffMs / (1000 * 60 * 60))
      }, 0)
      averageHarvestToDeliveryHours = Math.round((sumDiffHours / delivered.length) * 10) / 10
    }

    const wastagePercentage = harvests.length ? Math.round((harvests.filter(h => h.isWasted).length / harvests.length) * 100 * 10) / 10 : 0

    const rated = harvests.filter(h => h.customerSatisfaction)
    const customerSatisfaction = rated.length ? Math.round((rated.reduce((sum, h) => sum + h.customerSatisfaction!, 0) / rated.length) * 10) / 10 : 4.5

    const trendsMap = new Map<string, { sum: number; count: number }>()
    harvests.forEach(h => {
      const entry = trendsMap.get(h.cropName) ?? { sum: 0, count: 0 }
      entry.sum += h.freshnessScore
      entry.count++
      trendsMap.set(h.cropName, entry)
    })

    const cropTrends = Array.from(trendsMap.entries()).map(([cropName, entry]) => ({
      cropName,
      averageFreshness: Math.round(entry.sum / entry.count)
    }))

    return {
      dailyFreshnessScore,
      averageHarvestToDeliveryHours,
      wastagePercentage,
      customerSatisfaction,
      cropTrends,
      weeklyReportScores: [90, 88, 85, 87, 89, 86, dailyFreshnessScore],
      monthlyReportScores: [88, 87, 89, 90]
    }
  }
}
