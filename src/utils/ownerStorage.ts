/**
 * ownerStorage.ts
 * Handles orders, deliveries and notifications in localStorage.
 * Stock is NOT stored here — the owner dashboard reads stock live from SQL.
 */
import type { BillLine, CustomerNotification, DeliveryAssignment, StoreOrder } from '../types/store'

const KEYS = {
  orders: 'freshmart_orders',
  deliveries: 'freshmart_deliveries',
  notifications: 'freshmart_notifications',
} as const

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

// ── Orders ────────────────────────────────────────────────────────────────────

export function getOrders(): StoreOrder[] {
  return read<StoreOrder>(KEYS.orders)
}

export function updateOrderStatus(
  orderId: number,
  status: StoreOrder['status'],
  extra?: Partial<StoreOrder>
): StoreOrder | null {
  const orders = getOrders()
  const idx = orders.findIndex((o) => o.id === orderId)
  if (idx === -1) return null
  const updated: StoreOrder = { ...orders[idx], status, ...extra }
  orders[idx] = updated
  write(KEYS.orders, orders)
  return updated
}

// ── Deliveries ────────────────────────────────────────────────────────────────

export function getDeliveries(): DeliveryAssignment[] {
  return read<DeliveryAssignment>(KEYS.deliveries)
}

export function saveDelivery(assignment: DeliveryAssignment) {
  write(KEYS.deliveries, [...getDeliveries(), assignment])
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function addNotification(n: {
  customerEmail: string
  orderId: number
  message: string
  type: 'rejection' | 'approval'
}) {
  const notification: CustomerNotification = {
    ...n,
    id: Date.now(),
    read: false,
    createdAt: new Date().toLocaleString(),
  }
  write(KEYS.notifications, [...read<CustomerNotification>(KEYS.notifications), notification])
}

export function getCustomerNotifications(email: string): CustomerNotification[] {
  return read<CustomerNotification>(KEYS.notifications).filter(
    (n) => n.customerEmail.toLowerCase() === email.toLowerCase()
  )
}

export function getUnreadNotifications(email: string): CustomerNotification[] {
  return getCustomerNotifications(email).filter((n) => !n.read)
}

export function markNotificationRead(id: number) {
  write(
    KEYS.notifications,
    read<CustomerNotification>(KEYS.notifications).map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
  )
}

export function markAllNotificationsRead(email: string) {
  write(
    KEYS.notifications,
    read<CustomerNotification>(KEYS.notifications).map((n) =>
      n.customerEmail.toLowerCase() === email.toLowerCase() ? { ...n, read: true } : n
    )
  )
}
