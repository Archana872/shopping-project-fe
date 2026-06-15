export interface Customer {
  role: 'customer'
  name: string
  email: string
  phone?: string
  address?: string
  password: string
}

export interface Delivery {
  role: 'delivery'
  id: string
  name?: string
  password: string
}

export interface Owner {
  role: 'owner'
  id: string
  name?: string
  password: string
}

export type AppUser = Customer | Delivery | Owner

const USERS_KEY = 'app_users_v1'
const CURRENT_KEY = 'app_current_user_v1'

function readUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AppUser[]
  } catch {
    return []
  }
}

function writeUsers(users: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function registerUser(newUser: Omit<Customer, 'role'>): { success: boolean; message?: string } {
  const users = readUsers()
  const exists = users.find((u) => u.role === 'customer' && (u as Customer).email.toLowerCase() === newUser.email.toLowerCase())
  if (exists) return { success: false, message: 'Email already registered.' }
  const user: Customer = { ...newUser, role: 'customer' }
  users.push(user)
  writeUsers(users)
  return { success: true }
}

export function registerDeliveryUser(newDelivery: Omit<Delivery, 'role'>): { success: boolean; message?: string } {
  const users = readUsers()
  const exists = users.find((u) => u.role === 'delivery' && (u as Delivery).id === newDelivery.id)
  if (exists) return { success: false, message: 'Delivery ID already registered.' }
  const user: Delivery = { ...newDelivery, role: 'delivery' }
  users.push(user)
  writeUsers(users)
  return { success: true }
}

export function registerOwner(newOwner: Omit<Owner, 'role'>): { success: boolean; message?: string } {
  const users = readUsers()
  const exists = users.find((u) => u.role === 'owner' && (u as Owner).id === newOwner.id)
  if (exists) return { success: false, message: 'Owner ID already registered.' }
  const user: Owner = { ...newOwner, role: 'owner' }
  users.push(user)
  writeUsers(users)
  return { success: true }
}

export function loginUser(identifier: string, password: string, role: 'customer' | 'delivery' | 'owner' = 'customer'): { success: boolean; message?: string } {
  const users = readUsers()
  let user: AppUser | undefined
  if (role === 'delivery') {
    user = users.find((u) => u.role === 'delivery' && (u as Delivery).id === identifier)
    if (!user) return { success: false, message: 'No delivery account found for this ID.' }
  } else if (role === 'owner') {
    user = users.find((u) => u.role === 'owner' && (u as Owner).id === identifier)
    if (!user) return { success: false, message: 'No owner account found for this ID.' }
  } else {
    user = users.find((u) => u.role === 'customer' && (u as Customer).email.toLowerCase() === identifier.toLowerCase())
    if (!user) return { success: false, message: 'No account found for this email.' }
  }

  if ((user as AppUser).password !== password) return { success: false, message: 'Invalid password.' }

  let identifierValue = ''
  if (user.role === 'delivery') identifierValue = (user as Delivery).id
  else if (user.role === 'owner') identifierValue = (user as Owner).id
  else identifierValue = (user as Customer).email

  const storeValue = `${user.role}:${identifierValue}`
  localStorage.setItem(CURRENT_KEY, storeValue)
  return { success: true }
}

export function logout() {
  localStorage.removeItem(CURRENT_KEY)
}

export function getCurrentUserKey(): string | null {
  return localStorage.getItem(CURRENT_KEY)
}

export function getCurrentUser() {
  const key = getCurrentUserKey()
  if (!key) return null
  const [role, identifier] = key.split(':')
  const users = readUsers()
  if (role === 'delivery') return users.find((u) => u.role === 'delivery' && (u as Delivery).id === identifier) || null
  if (role === 'owner') return users.find((u) => u.role === 'owner' && (u as Owner).id === identifier) || null
  return users.find((u) => u.role === 'customer' && (u as Customer).email.toLowerCase() === identifier.toLowerCase()) || null
}

export function isAuthenticated() {
  return !!getCurrentUserKey()
}

export function getAllUsers() {
  return readUsers()
}

export function seedDemoUsers() {
  const users = readUsers()
  const hasCustomer = users.some((u) => u.role === 'customer')
  const hasDelivery = users.some((u) => u.role === 'delivery')
  const hasOwner = users.some((u) => u.role === 'owner')

  const toAdd: AppUser[] = []
  if (!hasCustomer) {
    toAdd.push({ role: 'customer', name: 'Demo Customer', email: 'demo@customer.test', phone: '0770000000', address: '123 Demo St', password: 'password' })
  }
  if (!hasDelivery) {
    toAdd.push({ role: 'delivery', id: 'D100', name: 'Demo Rider', password: 'deliver' })
  }
  if (!hasOwner) {
    toAdd.push({ role: 'owner', id: 'O100', name: 'Demo Owner', password: 'owner' })
  }

  if (toAdd.length > 0) {
    writeUsers([...users, ...toAdd])
  }
}
