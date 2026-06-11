export type NewItem = {
  itemName: string
  quantity: number
  measurement: string
  price: number
}

export async function createItem(item: NewItem): Promise<any> {
  const res = await fetch('https://localhost:44399/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Request failed (${res.status}) ${text}`)
  }

  try {
    return await res.json()
  } catch {
    return undefined
  }
}
