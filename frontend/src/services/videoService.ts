import { UploadVideoRequest, UploadVideoResponse, VideoResponse, Comment } from '../types'
export type { Comment }
import authService from './authService'

const API_BASE_URL = 'http://127.0.0.1:8088/api/v1'

function getStreamUrl(id: number): string {
  return `${API_BASE_URL}/videos/${id}`
}

function formatDate(raw: string | undefined): string {
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

export function mapVideo(video: VideoResponse): UploadVideoResponse {
  return {
    id: video.id,
    title: video.title,
    size: video.size || '—',
    uploadedAt: formatDate(video.uploadedAt),
    description: video.description || '',
    author: video.author || 'Unknown',
    authorId: video.authorId,
    url: getStreamUrl(video.id),
    tags: video.tags || [],
  }
}

class VideoService {
  async uploadVideo(data: UploadVideoRequest): Promise<UploadVideoResponse> {
    if (!authService.isAuthenticated()) {
      throw new Error('You must be logged in to upload a video')
    }

    const user = authService.getUser()!

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('file', data.file)
    formData.append('authorId', String(user.id))
    if (data.tags) {
      data.tags.forEach((tag) => formData.append('tags', tag))
    }

    const response = await authService.authenticatedFetch(`${API_BASE_URL}/videos`, {
      method: 'POST',
      headers: { 'X-Client-ID': localStorage.getItem('ClientID') ?? '' },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(
        errorData.error || errorData.message || `Upload failed with status ${response.status}`,
      )
    }

    const mapped = mapVideo(await response.json())
    const currentUser = authService.getUser()
    if (currentUser) {
      const [firstName, ...rest] = (mapped.author || '').split(' ')
      authService.saveUser({
        ...currentUser,
        id: mapped.authorId,
        name: firstName || currentUser.name,
        surname: rest.join(' ') || currentUser.surname,
      })
    }
    return mapped
  }

  async getVideos(): Promise<UploadVideoResponse[]> {
    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`Failed to fetch videos with status ${response.status}`)
    const results: VideoResponse[] = await response.json()
    return results.map(mapVideo)
  }

  async getVideoById(id: number): Promise<UploadVideoResponse> {
    const response = await fetch(`${API_BASE_URL}/videos/${id}/metadata`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`Failed to fetch video with status ${response.status}`)
    return mapVideo(await response.json())
  }

  getStreamUrl(id: number): string {
    return getStreamUrl(id)
  }

  async deleteVideo(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/videos/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error(`Failed to delete video with status ${response.status}`)
  }

  async addComment(videoId: number, content: string): Promise<Comment> {
    const user = authService.getUser()
    if (!user?.id) throw new Error('You must be logged in to comment')

    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/videos/${videoId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, videoId, authorId: user.id }),
      },
    )
    if (!response.ok) throw new Error(`Failed to post comment with status ${response.status}`)
    return response.json()
  }

  async getComments(videoId: number): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    // Parse once — consuming the stream twice causes the second call to return empty
    const data = await response.json()
    if (!response.ok) throw new Error(`Failed to fetch comments with status ${response.status}`)
    return data
  }

  async likeVideo(videoId: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/videos/${videoId}/like`,
      {
        method: 'POST',
      },
    )
    if (!response.ok) throw new Error(`Failed to like video with status ${response.status}`)
  }

  async filterVideos(name?: string, tags?: string[]): Promise<UploadVideoResponse[]> {
    const params = new URLSearchParams()
    if (name) params.append('name', name)
    if (tags) {
      tags.forEach((tag) => params.append('tags', tag))
    }

    const response = await fetch(`${API_BASE_URL}/videos/filter?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Failed to filter videos with status ${response.status}`)
    }

    const results: VideoResponse[] = await response.json()
    return results.map(mapVideo)
  }
}

export default new VideoService()
