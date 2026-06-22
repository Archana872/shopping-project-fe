import { Link } from 'react-router-dom'

interface StoreLogoProps {
  to?: string
  size?: 'sm' | 'md'
  onClick?: () => void
}

export default function StoreLogo({ to, size = 'md', onClick }: StoreLogoProps) {
  const className = `store-logo${size === 'sm' ? ' store-logo--sm' : ''}`

  const content = (
    <>
      <span className="store-logo__icon" aria-hidden="true">🛒</span>
      FreshMart
    </>
  )

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" className={`store-logo-btn ${className}`} onClick={onClick}>
        {content}
      </button>
    )
  }

  return <span className={className}>{content}</span>
}
