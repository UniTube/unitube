const API_BASE_URL = 'http://localhost:8088/api/v1'

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
  url?: string
}

class VideoService {
  async uploadVideo(data: UploadVideoRequest): Promise<UploadVideoResponse> {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('file', data.file)
    formData.append('authorId', '1') // TODO: Replace with actual user ID from auth context

    try {
      const response = await fetch(`${API_BASE_URL}/videos`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.message || `Upload failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      return result
    } catch (error) {
      console.error('Upload error:', error)
      throw error instanceof Error ? error : new Error('Upload failed')
    }
  }

  async getVideos(): Promise<UploadVideoResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch videos with status ${response.status}`)
      }

      const results: UploadVideoResponse[] = await response.json()
      return results
    } catch (error) {
      console.error('Fetch videos error:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch videos')
    }
  }

  async deleteVideo(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete video with status ${response.status}`)
      }
    } catch (error) {
      console.error('Delete video error:', error)
      throw error instanceof Error ? error : new Error('Failed to delete video')
    }
  }
}

export default new VideoService()
