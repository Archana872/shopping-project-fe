import Login from './Login'

interface Props {
  onRegister: (role?: 'customer' | 'delivery' | 'owner') => void
  onLoginSuccess: () => void
}

export default function LoginOwner({ onRegister, onLoginSuccess }: Props) {
  return <Login role="owner" onRegister={onRegister} onLoginSuccess={onLoginSuccess} />
}
