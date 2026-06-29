import videoService from '../services/videoService'
import { Video } from '../types'

export async function uploadStreamRecording(
  blob: Blob,
  title: string,
  description = 'Recorded from live stream',
): Promise<Video> {
  const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp4') ? 'mp4' : 'webm'
  const safeTitle = title.trim() || 'Live stream recording'
  const defaultType = blob.type.startsWith('audio/') ? 'audio/webm' : 'video/webm'
  const file = new File([blob], `${safeTitle}.${ext}`, { type: blob.type || defaultType })

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
