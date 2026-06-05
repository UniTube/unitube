import { LoginRequest, LoginResponse, User } from '../types'

const API_BASE_URL = 'http://127.0.0.1:8088/api/v1'

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Login failed')
    }

    return response.json()
  }

  async register(userData: User): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Registration failed')
    }

    return response.json()
  }

  saveToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  saveUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  getUser(): User | null {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  }

  removeToken(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export default new AuthService()
