export type StockRequest = {
  itemName: string;
  availableQuantity: number;
  measurement: string;
  price: number;
};

export async function addStock(stock: StockRequest) {
  const res = await fetch('https://localhost:44399/api/stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stock)
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.json();
}