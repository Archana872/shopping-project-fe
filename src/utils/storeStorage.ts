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

  const updatedOrder: StoreOrder = {
    ...order,
    status: 'approved',
    billAmount,
    billLines
  }

  write(
    KEYS.orders,
    orders.map((o) => (o.id === orderId ? updatedOrder : o))
  )

  const rejectedCount = order.items.filter((i) => i.rejected).length
  addNotification({
    customerEmail: order.customerEmail,
    orderId: order.id,
    message:
      rejectedCount > 0
        ? `Order #${order.id} partially approved! Bill total: ₹${billAmount}. ${rejectedCount} unavailable item(s) were removed.`
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
  if (!order || order.status !== 'approved' || !order.billLines || order.billAmount === undefined) return null

  const updatedOrder: StoreOrder = {
    ...order,
    status: 'sent_to_delivery',
    sentToDeliveryAt: new Date().toLocaleString()
  }
  write(
    KEYS.orders,
    orders.map((o) => (o.id === orderId ? updatedOrder : o))
  )

  const assignment: DeliveryAssignment = {
    id: Date.now(),
    orderId: order.id,
    customerName: order.customerName,
    customerAddress: order.customerAddress,
    customerPhone: order.customerPhone,
    billAmount: order.billAmount,
    items: order.items.filter((i) => !i.rejected),
    billLines: order.billLines,
    status: 'assigned',
    assignedAt: new Date().toLocaleString()
  }

  write(KEYS.deliveries, [...getDeliveries(), assignment])
  return assignment
}

export function getDeliveries(): DeliveryAssignment[] {
  return read<DeliveryAssignment>(KEYS.deliveries)
}

export function updateDeliveryStatus(
  deliveryId: number,
  status: DeliveryAssignment['status']
): DeliveryAssignment | null {
  const deliveries = getDeliveries()
  const idx = deliveries.findIndex((d) => d.id === deliveryId)
  if (idx === -1) return null
  const updated = { ...deliveries[idx], status }
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
