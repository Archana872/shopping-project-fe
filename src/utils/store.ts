export interface Product {
  id: string
  name: string
  price: number
  stock: number
}

export interface Order {
  id: number
  customerEmail: string
  product: string
  quantity: number
  price?: number
  deliveryId?: string
  measurement?: 'pieces' | 'kg' | 'grams' | 'litre'
  status: 'Order Placed' | 'Confirmed' | 'Packing' | 'Out for Delivery' | 'Delivered' | 'Rejected'
}

const PRODUCTS_KEY = 'app_products_v1'
const ORDERS_KEY = 'app_orders_v1'

import { broadcastEvent } from './broadcast'

function readProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Product[]
  } catch {
    return []
  }
}

function writeProducts(items: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items))
}

function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Order[]
  } catch {
    return []
  }
}

function writeOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

// broadcast helper is imported lazily to avoid circular imports
function broadcast(type: string, payload?: any) {
  try {
    broadcastEvent(type, payload)
  } catch {
    // ignore
  }
}

export function seedStore() {
  const products = readProducts()
  if (products.length === 0) {
    writeProducts([
      { id: 'P1', name: 'Tomato', price: 40, stock: 50 },
      { id: 'P2', name: 'Onion', price: 30, stock: 25 }
    ])
  }
}

export function getProducts(): Product[] {
  return readProducts()
}

export function addProduct(p: Omit<Product, 'id'>) {
  const products = readProducts()
  const id = `P${Date.now()}`
  const np: Product = { id, ...p }
  products.push(np)
  writeProducts(products)
  broadcast('products_updated', { id: np.id })
  return np
}

export function updateProduct(id: string, patch: Partial<Product>) {
  const products = readProducts()
  const idx = products.findIndex((x) => x.id === id)
  if (idx === -1) return false
  products[idx] = { ...products[idx], ...patch }
  writeProducts(products)
  broadcast('products_updated', { id })
  return true
}

export function removeProduct(id: string) {
  const products = readProducts().filter((p) => p.id !== id)
  writeProducts(products)
  broadcast('products_updated', { id })
}

export function addOrder(o: Omit<Order, 'id' | 'status' | 'price'> & { measurement?: Order['measurement'] }) {
  const orders = readOrders()
  const id = orders.length > 0 ? orders[orders.length - 1].id + 1 : 1
  const order: Order = { id, ...o, status: 'Order Placed' }
  orders.push(order)
  writeOrders(orders)
  broadcast('orders_updated', { id: order.id })
  return order
}

export function getOrdersForCustomer(email: string) {
  return readOrders().filter((o) => o.customerEmail.toLowerCase() === email.toLowerCase())
}

export function getOrdersForDelivery(deliveryId: string) {
  return readOrders().filter((o) => o.deliveryId === deliveryId)
}

export function getAvailableOrders() {
  return readOrders().filter((o) => o.status === 'Confirmed' && !o.deliveryId)
}

export function assignOrderToDelivery(id: number, deliveryId: string) {
  const orders = readOrders()
  const idx = orders.findIndex((o) => o.id === id)
  if (idx === -1) return false
  orders[idx].deliveryId = deliveryId
  writeOrders(orders)
  broadcast('orders_updated', { id })
  return true
}

export function getAllOrders() {
  return readOrders()
}

export function updateOrderStatus(id: number, status: Order['status'], price?: number) {
  const orders = readOrders()
  const idx = orders.findIndex((o) => o.id === id)
  if (idx === -1) return false
  orders[idx].status = status
  if (typeof price === 'number') orders[idx].price = price
  writeOrders(orders)
  broadcast('order_status_changed', { id, status })
  return true
}

export function reduceStock(productName: string, qty: number) {
  const products = readProducts()
  const idx = products.findIndex((p) => p.name === productName)
  if (idx === -1) return false
  products[idx].stock = Math.max(0, products[idx].stock - qty)
  writeProducts(products)
  broadcast('products_updated', { name: productName, qty })
  return true
}
