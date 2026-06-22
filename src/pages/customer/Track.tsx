import { statuses } from '../dashboard/data'

interface Props {
  currentStatus: string
  onAdvance: () => void
}

export default function Track({ currentStatus, onAdvance }: Props) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Track Order</h2>
      <p style={{ color: '#475569' }}>Current status for the latest order:</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        {statuses.map((status) => {
          const completed = statuses.indexOf(status) <= statuses.indexOf(currentStatus)
          return (
            <div key={status} style={{ flex: '1 1 140px', padding: 14, borderRadius: 14, background: completed ? '#dbeafe' : '#f8fafc', border: '1px solid #cbd5e1', color: completed ? '#1d4ed8' : '#6b7280' }}>
              {status}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 20 }}>
        <button onClick={onAdvance} style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
          Advance Status
        </button>
      </div>
    </div>
  )
}
