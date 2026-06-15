import Login from './Login'

interface Props {
  onRegister: (role?: 'customer' | 'delivery' | 'owner') => void
  onLoginSuccess: () => void
}

export default function LoginDelivery({ onRegister, onLoginSuccess }: Props) {
  return <Login role="delivery" onRegister={onRegister} onLoginSuccess={onLoginSuccess} />
}
