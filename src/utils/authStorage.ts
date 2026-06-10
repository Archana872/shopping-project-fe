export type UserRole = 'customer' | 'owner' | 'delivery'

export interface Customer {
  name: string
  email: string
  phone: string
  address: string
  password: string
}

export interface Owner {
  name: string
  username: string
  email: string
  password: string
}

export interface DeliveryBoy {
  name: string
  email: string
  phone: string
  password: string
}

export type AppUser = Customer | Owner | DeliveryBoy

export interface Session {
  role: UserRole
  user: AppUser
}

const KEYS = {
  customers: 'grocery_customers',
  owners: 'grocery_owners',
  delivery: 'grocery_delivery_boys',
  session: 'grocery_session'
} as const

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

type AuthResult<T> = { ok: true; user: T } | { ok: false; message: string }

function register<T extends { password: string }>(
  key: string,
  user: T,
  existsCheck: (items: T[]) => boolean,
  duplicateMessage: string
): { ok: true } | { ok: false; message: string } {
  const items = read<T>(key)
  if (existsCheck(items)) return { ok: false, message: duplicateMessage }
  write(key, [...items, user])
  return { ok: true }
}

function login<T>(
  key: string,
  match: (item: T) => boolean,
  failMessage: string
): AuthResult<T> {
  const user = read<T>(key).find(match)
  if (!user) return { ok: false, message: failMessage }
  return { ok: true, user }
}

export function registerCustomer(customer: Customer) {
  return register(
    KEYS.customers,
    customer,
    (items) => items.some((c) => c.email.toLowerCase() === customer.email.toLowerCase()),
    'An account with this email already exists.'
  )
}

export function loginCustomer(email: string, password: string): AuthResult<Customer> {
  return login(
    KEYS.customers,
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password,
    'Invalid email or password.'
  )
}

export function registerOwner(owner: Owner) {
  return register(
    KEYS.owners,
    owner,
    (items) =>
      items.some(
        (o) =>
          o.username.toLowerCase() === owner.username.toLowerCase() ||
          o.email.toLowerCase() === owner.email.toLowerCase()
      ),
    'Username or email is already taken.'
  )
}

export function loginOwner(username: string, password: string): AuthResult<Owner> {
  return login(
    KEYS.owners,
    (o) => o.username.toLowerCase() === username.toLowerCase() && o.password === password,
    'Invalid username or password.'
  )
}

export function registerDeliveryBoy(deliveryBoy: DeliveryBoy) {
  return register(
    KEYS.delivery,
    deliveryBoy,
    (items) => items.some((d) => d.email.toLowerCase() === deliveryBoy.email.toLowerCase()),
    'An account with this email already exists.'
  )
}

export function loginDeliveryBoy(email: string, password: string): AuthResult<DeliveryBoy> {
  return login(
    KEYS.delivery,
    (d) => d.email.toLowerCase() === email.toLowerCase() && d.password === password,
    'Invalid email or password.'
  )
}

export function saveSession(role: UserRole, user: AppUser) {
  sessionStorage.setItem(KEYS.session, JSON.stringify({ role, user }))
}

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEYS.session)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function clearSession() {
  sessionStorage.removeItem(KEYS.session)
}
