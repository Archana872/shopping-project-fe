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
  rejected?: boolean
  rejectionReason?: string
}

export type OrderRequestStatus =
  | 'pending'
  | 'approved'
  | 'partially_approved'
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
  partnerName: string
  partnerPhone: string
  customerName: string
  customerEmail: string
  customerAddress: string
  customerPhone: string
  billAmount: number
  items: StoreOrderItem[]
  billLines: BillLine[]
  status: 'assigned' | 'picked_up' | 'in_transit' | 'near_destination' | 'delivered'
  assignedAt: string
  startedAt?: string
  deliveredAt?: string
  currentLat: number
  currentLng: number
  destinationLat: number
  destinationLng: number
  etaMinutes: number
  freshnessScore: number
  otpCode: string
  arrivalDetected?: boolean
  proofPhotoUrl?: string
}

export interface CustomerNotification {
  id: number
  customerEmail: string
  orderId: number
  message: string
  type: 'rejection' | 'approval' | 'delivery'
  read: boolean
  createdAt: string
}

export interface StockCheckResult {
  ok: boolean
  issues: string[]
}
