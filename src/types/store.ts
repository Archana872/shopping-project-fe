export interface Product {
  id: number
  name: string
  stock: number
  price: number
  unit: string
  updatedAt: string
}

export interface StoreOrderItem {
  itemName: string
  quantity: number
  measurement: string
}

export type OrderRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'sent_to_delivery'

export interface BillLine {
  itemName: string
  quantity: number
  measurement: string
  unitPrice: number
  lineTotal: number
}

export interface StoreOrder {
  id: number
  customerEmail: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: StoreOrderItem[]
  status: OrderRequestStatus
  submittedAt: string
  billAmount?: number
  billLines?: BillLine[]
  rejectionReason?: string
  sentToDeliveryAt?: string
}

export interface DeliveryAssignment {
  id: number
  orderId: number
  customerName: string
  customerAddress: string
  customerPhone: string
  billAmount: number
  items: StoreOrderItem[]
  billLines: BillLine[]
  status: 'assigned' | 'in_transit' | 'delivered'
  assignedAt: string
}

export interface CustomerNotification {
  id: number
  customerEmail: string
  orderId: number
  message: string
  type: 'rejection' | 'approval'
  read: boolean
  createdAt: string
}

export interface StockCheckResult {
  ok: boolean
  issues: string[]
}
