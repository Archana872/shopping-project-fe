const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export type NewItem = {
  itemName: string
  quantity: number
  measurement: string
}

export type UpdateStockRequest = {
  itemName: string
  availableQuantity: number
}

export type ApiStockItem = {
  stockId: number
  itemName: string
  availableQuantity: number
  measurement: string
  price: number
}

export type ApiOrderItem = {
  id: number
  itemName: string
  quantity: number
  measurement: string
  price: number
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

export async function createItem(item: NewItem) {
  return request<Record<string, unknown>>('/Insertitems', {
    method: 'POST',
    body: JSON.stringify(item)
  })
}

export async function updateStock(stock: UpdateStockRequest) {
  return request<string>('/updatestock', {
    method: 'PUT',
    body: JSON.stringify(stock)
  })
}

export async function getStock() {
  return request<ApiStockItem[]>('/stock')
}

export async function getItems() {
  return request<ApiOrderItem[]>('/getitems')
}

export function isValidApiOrderItem(item: ApiOrderItem) {
  const name = item.itemName.trim().toLowerCase()
  return name.length > 0 && name !== 'string' && item.quantity > 0
}
