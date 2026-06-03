export interface Video {
  id: number
  title: string
  size: string
  uploadedAt: string
  description: string
  author: string
  url?: string
}

export interface User {
  id: number
  email: string
  username: string
}
