import { useEffect, useState } from 'react'
import { getProducts } from '../../utils/store'
import { subscribeBroadcast } from '../../utils/broadcast'

interface Props {
  selectedProduct: string
  setSelectedProduct: (p: string) => void
}

export default function Items({ selectedProduct, setSelectedProduct }: Props) {
  const [products, setProducts] = useState(() => getProducts())

  useEffect(() => {
    // subscribe to product updates via dynamic import of broadcast
    let unsub: (() => void) | undefined
    try {
      unsub = subscribeBroadcast(() => setProducts(getProducts()))
    } catch {
      // noop
    }

    return () => { if (unsub) unsub() }
  }, [])

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Items</h2>
      <p style={{ color: '#475569' }}>Select a product and then set quantity on the next page.</p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', marginTop: 16 }}>
        {products.map((p) => (
          <div key={p.id} style={{ padding: 12, borderRadius: 12, border: selectedProduct === p.name ? '2px solid #2563eb' : '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => setSelectedProduct(p.name)}>
            <h3 style={{ margin: '0 0 8px' }}>{p.name}</h3>
            <div style={{ color: '#94a3b8', marginTop: 6 }}>{p.stock} available</div>
          </div>
        ))}
      </div>
    </div>
  )
}
