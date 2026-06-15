import Login from './Login'

interface Props {
  onRegister: (role?: 'customer' | 'delivery' | 'owner') => void
  onLoginSuccess: () => void
}

export default function LoginCustomer({ onRegister, onLoginSuccess }: Props) {
  return <Login role="customer" onRegister={onRegister} onLoginSuccess={onLoginSuccess} />
}
