import DeliveryDashboard from './DeliveryDashboard'

export default function Dashboard(props: { onLogout: () => void }) {
  return <DeliveryDashboard onLogout={props.onLogout} />
}
