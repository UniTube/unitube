import videoService from '../services/videoService'
import { Video } from '../types'

export async function uploadStreamRecording(
  blob: Blob,
  title: string,
  description = 'Recorded from live stream',
): Promise<Video> {
  const ext = blob.type.includes('webm') ? 'webm' : 'mp4'
  const safeTitle = title.trim() || 'Live stream recording'
  const file = new File([blob], `${safeTitle}.${ext}`, { type: blob.type || 'video/webm' })

  const response = await videoService.uploadVideo({
    title: safeTitle,
    description,
    file,
  })

  return {
    id: response.id,
    authorId: response.authorId,
    title: response.title,
    size: response.size,
    uploadedAt: response.uploadedAt,
    description: response.description,
    author: response.author,
    url: response.url,
  }
}
