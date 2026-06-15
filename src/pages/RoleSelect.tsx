import '../styles/ui.css'

type Role = 'customer' | 'delivery' | 'owner'

interface Props {
  onSelect: (role: Role) => void
}

export default function RoleSelect({ onSelect }: Props) {

  return (
    <div className="role-landing">
      <div className="centered">
        <header style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Welcome to GroceryApp</h1>
          <p style={{ marginTop: 8, color: '#475569' }}>Choose how you want to continue — Customer, Owner, or Delivery</p>
        </header>

        <section className="role-grid">
          <div className="role-card" onClick={() => onSelect('customer')}>
            <div className="role-emoji">🧑‍🍳</div>
            <div className="role-title">Customer</div>
            <div className="role-sub">Browse items, place orders and track deliveries.</div>
          </div>
          <div className="role-card" onClick={() => onSelect('owner')}>
            <div className="role-emoji">🏪</div>
            <div className="role-title">Owner</div>
            <div className="role-sub">Manage inventory and view orders.</div>
          </div>
          <div className="role-card" onClick={() => onSelect('delivery')}>
            <div className="role-emoji">🚚</div>
            <div className="role-title">Delivery</div>
            <div className="role-sub">View assigned deliveries and update status.</div>
          </div>
        </section>
      </div>
    </div>
  )
}
