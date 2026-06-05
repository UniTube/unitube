import authService from './authService'

const API_BASE_URL = 'http://127.0.0.1:8088/api/v1'

export interface UploadVideoRequest {
  title: string
  description: string
  file: File
}

export interface UploadVideoResponse {
  id: number
  title: string
  size: string
  uploadedAt: string
  description: string
  author: string
  url: string
}

interface BackendVideoResponse {
  id: number
  title: string
  size: string
  uploadedAt: string
  description: string
  author: string
  authorId: number
  url: string
}

function getStreamUrl(id: number): string {
  return `${API_BASE_URL}/videos/${id}`
}

function mapVideo(video: BackendVideoResponse): UploadVideoResponse {
  return {
    id: video.id,
    title: video.title,
    size: video.size || '—',
    uploadedAt: video.uploadedAt || '—',
    description: video.description || '',
    author: video.author || 'Unknown',
    url: getStreamUrl(video.id),
  }
}

class VideoService {
  async uploadVideo(data: UploadVideoRequest): Promise<UploadVideoResponse> {
    const user = authService.getUser()
    if (!user?.id) {
      throw new Error('You must be logged in to upload a video')
    }

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('file', data.file)
    formData.append('authorId', String(user.id))

    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        ...authService.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(
        errorData.error || errorData.message || `Upload failed with status ${response.status}`,
      )
    }

    const result: BackendVideoResponse = await response.json()
    return mapVideo(result)
  }

  async getVideos(): Promise<UploadVideoResponse[]> {
    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch videos with status ${response.status}`)
    }

    const results: BackendVideoResponse[] = await response.json()
    return results.map(mapVideo)
  }

  async getVideoById(id: number): Promise<UploadVideoResponse> {
    const response = await fetch(`${API_BASE_URL}/videos/${id}/metadata`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch video with status ${response.status}`)
    }

    const result: BackendVideoResponse = await response.json()
    return mapVideo(result)
  }

  getStreamUrl(id: number): string {
    return getStreamUrl(id)
  }

  async deleteVideo(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...authService.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete video with status ${response.status}`)
    }
  }
}

export default new VideoService()
