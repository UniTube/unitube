export interface Video {
  id: number
  title: string
  size: string
  uploadedAt: string
  description: string
  author: string
  authorId: number
  url?: string
  tags?: string[]
}

export interface User {
  id: number | null
  email: string
  name: string
  surname: string
  password: string
}

export interface UserProfile {
  id: number
  name: string
  surname: string
  joinedAt: string
  videoCount: number
  videos: Video[]
}

export interface UpdateProfileRequest {
  name: string
  surname: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface UploadVideoRequest {
  title: string
  description: string
  file: File
  tags?: string[]
}

export interface UploadVideoResponse {
  id: number
  title: string
  size: string
  uploadedAt: string
  description: string
  author: string
  authorId: number
  url: string
  tags?: string[]
}

export interface Comment {
  id: number
  content: string
  videoId: number
  authorId: number
  authorUsername: string
}

export interface VideoResponse {
  id: number
  title: string
  size: string
  uploadedAt: string
  description: string
  author: string
  authorId: number
  url: string
  tags?: string[]
}

export interface Playlist {
  id: number
  name: string
  description?: string
  videoCount: number
  createdAt: string
  videos: Video[]
}

export interface CreatePlaylistRequest {
  name: string
  userId: string
}
