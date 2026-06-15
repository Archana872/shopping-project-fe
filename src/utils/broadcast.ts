type EventPayload = { type: string; payload?: any; ts: number }

const BROADCAST_KEY = 'app_broadcast_v1'

export function broadcastEvent(type: string, payload?: any) {
  const e: EventPayload = { type, payload, ts: Date.now() }
  try {
    // write to localStorage so other tabs receive a storage event
    localStorage.setItem(BROADCAST_KEY, JSON.stringify(e))
  } catch {
    // ignore
  }
  // also dispatch a CustomEvent so the same tab can react synchronously
  try {
    window.dispatchEvent(new CustomEvent(BROADCAST_KEY, { detail: e }))
  } catch {
    // ignore
  }
}

export function subscribeBroadcast(handler: (e: EventPayload) => void) {
  const onStorage = (ev: StorageEvent) => {
    if (!ev.key) return
    if (ev.key !== BROADCAST_KEY) return
    if (!ev.newValue) return
    try {
      const data = JSON.parse(ev.newValue) as EventPayload
      handler(data)
    } catch {
      // ignore
    }
  }

  const onCustom = (ev: Event) => {
    const ce = ev as CustomEvent
    const data = ce.detail as EventPayload
    if (!data) return
    handler(data)
  }

  window.addEventListener('storage', onStorage)
  window.addEventListener(BROADCAST_KEY, onCustom as EventListener)

  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(BROADCAST_KEY, onCustom as EventListener)
  }
}
