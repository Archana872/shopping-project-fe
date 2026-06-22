import CustomerLayout from '../../pages/dashboard/CustomerLayout'

export default function Dashboard(props: { onLogout: () => void }) {
  return <CustomerLayout onLogout={props.onLogout} />
}
