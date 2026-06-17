export type NewItem = {
  itemName: string;
  quantity: number;
  measurement: string;
};

export type UpdateStockRequest = {
  itemName: string;
  availableQuantity: number;
};

export async function createItem(item: NewItem) {
  const res = await fetch('https://localhost:44399/api/Insertitems', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}) ${text}`);
  }

  return await res.json();
}

export async function updateStock(stock: UpdateStockRequest) {
  const res = await fetch('https://localhost:44399/api/updatestock', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stock)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}) ${text}`);
  }

  return await res.text();
}

export async function getStock() {
  const res = await fetch('https://localhost:44399/api/stock', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}) ${text}`);
  }

  return await res.json();
}