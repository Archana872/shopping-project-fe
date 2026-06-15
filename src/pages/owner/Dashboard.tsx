import OwnerDashboard from './OwnerDashboard'

export default function Dashboard(props: { onLogout: () => void }) {
  return <OwnerDashboard onLogout={props.onLogout} />
}
