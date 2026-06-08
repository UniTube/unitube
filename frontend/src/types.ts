export interface Video {
  id: number
  title: string
  size: string
  uploadedAt: string
  description: string
  author: string
  authorId: number
  url?: string
}

export interface User {
  id: number | null
  email: string
  name: string
  surname: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
