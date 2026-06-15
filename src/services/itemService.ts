export type NewItem = {
  itemName: string;
  quantity: number;
  measurement: string;
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