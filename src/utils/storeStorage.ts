import type {
  BillLine,
  CustomerNotification,
  DeliveryAssignment,
  Product,
  StockCheckResult,
  StoreOrder,
  StoreOrderItem
} from '../types/store'

const KEYS = {
  products: 'freshmart_products',
  orders: 'freshmart_orders',
  deliveries: 'freshmart_deliveries',
  notifications: 'freshmart_notifications'
} as const

const FRESH_UNLOCK_KEY = 'freshUnlockProduct'

const DEFAULT_PRODUCTS: Omit<Product, 'id' | 'updatedAt'>[] = [
  { name: 'Tomato', stock: 50, price: 40, unit: 'kg' },
  { name: 'Onion', stock: 25, price: 30, unit: 'kg' },
  { name: 'Potato', stock: 40, price: 25, unit: 'kg' }
]

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

function findProductByName(products: Product[], name: string) {
  return products.find((p) => p.name.toLowerCase() === name.trim().toLowerCase())
}

export function syncProductsFromApi(
  stockItems: Array<{
    stockId: number
    itemName: string
    availableQuantity: number
    measurement: string
    price: number
  }>
): Product[] {
  const products: Product[] = stockItems.map((item) => ({
    id: item.stockId,
    name: item.itemName,
    stock: item.availableQuantity,
    price: item.price,
    unit: item.measurement,
    updatedAt: new Date().toLocaleString()
  }))
  write(KEYS.products, products)
  return products
}

export function getProducts(): Product[] {
  const products = read<Product>(KEYS.products)
  if (products.length === 0) {
    const seeded = DEFAULT_PRODUCTS.map((p, i) => ({
      ...p,
      id: Date.now() + i,
      updatedAt: new Date().toLocaleString()
    }))
    write(KEYS.products, seeded)
    return seeded
  }
  return products
}

export function saveProduct(product: Omit<Product, 'id' | 'updatedAt'>): Product {
  const products = getProducts()
  const existing = findProductByName(products, product.name)
  if (existing) {
    const updated = products.map((p) =>
      p.id === existing.id
        ? { ...p, stock: product.stock, price: product.price, unit: product.unit, updatedAt: new Date().toLocaleString() }
        : p
    )
    write(KEYS.products, updated)
    return updated.find((p) => p.id === existing.id)!
  }
  const newProduct: Product = {
    ...product,
    id: Date.now(),
    updatedAt: new Date().toLocaleString()
  }
  write(KEYS.products, [...products, newProduct])
  return newProduct
}

export function updateProduct(id: number, updates: Partial<Pick<Product, 'name' | 'stock' | 'price' | 'unit'>>): Product | null {
  const products = getProducts()
  const idx = products.findIndex((p) => p.id === id)
  if (idx === -1) return null
  const updated = {
    ...products[idx],
    ...updates,
    updatedAt: new Date().toLocaleString()
  }
  products[idx] = updated
  write(KEYS.products, products)
  return updated
}

export function deleteProduct(id: number) {
  write(
    KEYS.products,
    getProducts().filter((p) => p.id !== id)
  )
}

export function getOrders(): StoreOrder[] {
  return read<StoreOrder>(KEYS.orders)
}

export function getOrdersByCustomer(email: string): StoreOrder[] {
  return getOrders().filter((o) => o.customerEmail.toLowerCase() === email.toLowerCase())
}

export interface FreshUnlockProduct {
  itemName: string
  quantity: number
  measurement: string
  price: number
  freeDelivery?: boolean
}

export function getFreshUnlockProduct(): FreshUnlockProduct | null {
  try {
    const raw = localStorage.getItem(FRESH_UNLOCK_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FreshUnlockProduct
  } catch {
    return null
  }
}

export function clearFreshUnlockProduct() {
  localStorage.removeItem(FRESH_UNLOCK_KEY)
}

export function addOrder(order: Omit<StoreOrder, 'id' | 'status' | 'submittedAt'>): StoreOrder {
  const newOrder: StoreOrder = {
    ...order,
    id: Date.now(),
    status: 'pending',
    submittedAt: new Date().toLocaleString()
  }
  write(KEYS.orders, [...getOrders(), newOrder])
  return newOrder
}

function getActiveItems(order: StoreOrder) {
  return order.items.filter((item) => !item.rejected)
}

export function checkItemAvailability(item: StoreOrderItem): { ok: boolean; issue?: string } {
  const products = getProducts()
  const product = findProductByName(products, item.itemName)
  if (!product) {
    return { ok: false, issue: `"${item.itemName}" is not in today's stock list.` }
  }
  if (product.stock < item.quantity) {
    return {
      ok: false,
      issue: `"${item.itemName}": need ${item.quantity} ${item.measurement}, only ${product.stock} ${product.unit} available.`
    }
  }
  return { ok: true }
}

export function checkOrderStock(order: StoreOrder): StockCheckResult {
  const issues: string[] = []

  for (const item of getActiveItems(order)) {
    const check = checkItemAvailability(item)
    if (!check.ok && check.issue) issues.push(check.issue)
  }

  return { ok: issues.length === 0, issues }
}

function buildBillLines(items: StoreOrderItem[]): BillLine[] {
  const products = getProducts()
  return items.map((item) => {
    const product = findProductByName(products, item.itemName)!
    const lineTotal = product.price * item.quantity
    return {
      itemName: item.itemName,
      quantity: item.quantity,
      measurement: item.measurement,
      unitPrice: product.price,
      lineTotal
    }
  })
}

export function rejectOrderItem(orderId: number, itemIndex: number): StoreOrder | null {
  const orders = getOrders()
  const order = orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return null

  const item = order.items[itemIndex]
  if (!item || item.rejected) return null

  const availability = checkItemAvailability(item)
  const reason = availability.issue ?? 'Item unavailable at this time.'

  const updatedItems = order.items.map((it, idx) =>
    idx === itemIndex ? { ...it, rejected: true, rejectionReason: reason } : it
  )
  const updatedOrder: StoreOrder = { ...order, items: updatedItems }

  write(
    KEYS.orders,
    orders.map((o) => (o.id === orderId ? updatedOrder : o))
  )

  addNotification({
    customerEmail: order.customerEmail,
    orderId: order.id,
    message: `Item "${item.itemName}" removed from order #${order.id}: ${reason}`,
    type: 'rejection'
  })

  return updatedOrder
}

export function approveOrder(orderId: number): { ok: true; order: StoreOrder } | { ok: false; message: string } {
  const orders = getOrders()
  const order = orders.find((o) => o.id === orderId)
  if (!order) return { ok: false, message: 'Order not found.' }
  if (order.status !== 'pending') return { ok: false, message: 'Order already processed.' }

  const activeItems = getActiveItems(order)
  if (activeItems.length === 0) {
    return { ok: false, message: 'No items left to approve. Reject unavailable items or reject the entire order.' }
  }

  const stockCheck = checkOrderStock(order)
  if (!stockCheck.ok) {
    return {
      ok: false,
      message: `Reject unavailable items first. ${stockCheck.issues.join(' ')}`
    }
  }

  const billLines = buildBillLines(activeItems)
  const billAmount = billLines.reduce((sum, line) => sum + line.lineTotal, 0)

  const products = getProducts()
  const updatedProducts = products.map((p) => {
    const ordered = activeItems.find((i) => i.itemName.toLowerCase() === p.name.toLowerCase())
    if (!ordered) return p
    return { ...p, stock: p.stock - ordered.quantity, updatedAt: new Date().toLocaleString() }
  })
  write(KEYS.products, updatedProducts)

  const rejectedCount = order.items.filter((i) => i.rejected).length
  const updatedOrder: StoreOrder = {
    ...order,
    status: rejectedCount > 0 ? 'partially_approved' : 'approved',
    billAmount,
    billLines
  }

  write(
    KEYS.orders,
    orders.map((o) => (o.id === orderId ? updatedOrder : o))
  )

  addNotification({
    customerEmail: order.customerEmail,
    orderId: order.id,
    message:
      rejectedCount > 0
        ? `Some items were unavailable and removed. Remaining order approved. Bill total: ₹${billAmount}.`
        : `Order #${order.id} approved! Bill total: ₹${billAmount}. Your order is being prepared.`,
    type: 'approval'
  })

  return { ok: true, order: updatedOrder }
}

export function rejectOrder(orderId: number, reason: string): StoreOrder | null {
  const orders = getOrders()
  const order = orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return null

  const updatedOrder: StoreOrder = { ...order, status: 'rejected', rejectionReason: reason }
  write(
    KEYS.orders,
    orders.map((o) => (o.id === orderId ? updatedOrder : o))
  )

  addNotification({
    customerEmail: order.customerEmail,
    orderId: order.id,
    message: reason,
    type: 'rejection'
  })

  return updatedOrder
}

export function sendToDelivery(orderId: number): DeliveryAssignment | null {
  const orders = getOrders()
  const order = orders.find((o) => o.id === orderId)
  if (!order || (order.status !== 'approved' && order.status !== 'partially_approved') || !order.billLines || order.billAmount === undefined) return null

  const updatedOrder: StoreOrder = {
    ...order,
    status: 'sent_to_delivery',
    sentToDeliveryAt: new Date().toLocaleString()
  }
  write(
    KEYS.orders,
    orders.map((o) => (o.id === orderId ? updatedOrder : o))
  )

  const defaultLat = 12.9716
  const defaultLng = 77.5946

  const assignment: DeliveryAssignment = {
    id: Date.now(),
    orderId: order.id,
    partnerName: 'Fresh Rider',
    partnerPhone: '999-999-9999',
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerAddress: order.customerAddress,
    customerPhone: order.customerPhone,
    billAmount: order.billAmount,
    items: order.items.filter((i) => !i.rejected),
    billLines: order.billLines,
    status: 'assigned',
    assignedAt: new Date().toLocaleString(),
    currentLat: defaultLat,
    currentLng: defaultLng,
    destinationLat: defaultLat + 0.002,
    destinationLng: defaultLng + 0.0025,
    etaMinutes: 18,
    freshnessScore: 96,
    otpCode: String(Math.floor(100000 + Math.random() * 900000)),
    arrivalDetected: false
  }

  write(KEYS.deliveries, [...getDeliveries(), assignment])
  return assignment
}

export function getDeliveries(): DeliveryAssignment[] {
  return read<DeliveryAssignment>(KEYS.deliveries)
}

export function getDeliveryByOrderId(orderId: number): DeliveryAssignment | undefined {
  return getDeliveries().find((d) => d.orderId === orderId)
}

export function getDeliveriesByCustomerEmail(email: string): DeliveryAssignment[] {
  return getDeliveries().filter((d) => d.customerEmail.toLowerCase() === email.toLowerCase())
}

export function updateDeliveryStatus(
  deliveryId: number,
  status: DeliveryAssignment['status']
): DeliveryAssignment | null {
  const deliveries = getDeliveries()
  const idx = deliveries.findIndex((d) => d.id === deliveryId)
  if (idx === -1) return null
  const now = new Date().toLocaleString()
  const updated = {
    ...deliveries[idx],
    status,
    startedAt: status === 'picked_up' ? now : deliveries[idx].startedAt,
    deliveredAt: status === 'delivered' ? now : deliveries[idx].deliveredAt,
    etaMinutes: status === 'delivered' ? 0 : Math.max(0, deliveries[idx].etaMinutes - 5)
  }
  deliveries[idx] = updated
  write(KEYS.deliveries, deliveries)

  const message =
    status === 'picked_up'
      ? `Your order #${updated.orderId} is picked up by ${updated.partnerName}.`
      : status === 'in_transit'
      ? `Your order #${updated.orderId} is on the way to your address.`
      : status === 'near_destination'
      ? `Your delivery for order #${updated.orderId} is near your address. OTP: ${updated.otpCode}`
      : status === 'delivered'
      ? `Order #${updated.orderId} has been delivered. Enjoy your fresh groceries!`
      : ''

  if (message) {
    addNotification({
      customerEmail: updated.customerEmail,
      orderId: updated.orderId,
      message,
      type: 'delivery'
    })
  }

  return updated
}

export function confirmDeliveryOtp(
  deliveryId: number,
  otp: string,
  proofPhotoUrl?: string
): DeliveryAssignment | null {
  const deliveries = getDeliveries()
  const idx = deliveries.findIndex((d) => d.id === deliveryId)
  if (idx === -1) return null
  const current = deliveries[idx]
  if (current.otpCode !== otp.trim()) return null

  const now = new Date().toLocaleString()
  const updated: DeliveryAssignment = {
    ...current,
    status: 'delivered',
    deliveredAt: now,
    etaMinutes: 0,
    proofPhotoUrl,
    arrivalDetected: true
  }

  deliveries[idx] = updated
  write(KEYS.deliveries, deliveries)
  addNotification({
    customerEmail: updated.customerEmail,
    orderId: updated.orderId,
    message: `Delivery confirmed for order #${updated.orderId}. Enjoy your fresh groceries!`,
    type: 'delivery'
  })
  return updated
}

export function updateDeliveryCoordinates(
  deliveryId: number,
  currentLat: number,
  currentLng: number,
  etaMinutes: number,
  status?: DeliveryAssignment['status'],
  arrivalDetected?: boolean
): DeliveryAssignment | null {
  const deliveries = getDeliveries()
  const idx = deliveries.findIndex((d) => d.id === deliveryId)
  if (idx === -1) return null
  const updated = {
    ...deliveries[idx],
    currentLat,
    currentLng,
    etaMinutes,
    status: status ?? deliveries[idx].status,
    arrivalDetected: arrivalDetected ?? deliveries[idx].arrivalDetected
  }
  deliveries[idx] = updated
  write(KEYS.deliveries, deliveries)
  return updated
}

function addNotification(n: Omit<CustomerNotification, 'id' | 'read' | 'createdAt'>) {
  const notification: CustomerNotification = {
    ...n,
    id: Date.now(),
    read: false,
    createdAt: new Date().toLocaleString()
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
    read<CustomerNotification>(KEYS.notifications).map((n) => (n.id === id ? { ...n, read: true } : n))
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
