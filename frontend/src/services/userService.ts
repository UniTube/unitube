import { UpdateProfileRequest, UserProfile, Video } from '../types'
import authService from './authService'
import videoService from './videoService'

const PROFILE_OVERRIDES_KEY = 'profile_overrides'

type ProfileOverrides = Record<number, { name: string; surname: string }>

function parseAuthorName(author: string): { name: string; surname: string } {
  const parts = author.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { name: 'Unknown', surname: '' }
  if (parts.length === 1) return { name: parts[0], surname: '' }
  return { name: parts[0], surname: parts.slice(1).join(' ') }
}

function getProfileOverrides(): ProfileOverrides {
  const raw = localStorage.getItem(PROFILE_OVERRIDES_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as ProfileOverrides
  } catch {
    return {}
  }
}

function saveProfileOverride(userId: number, data: UpdateProfileRequest): void {
  const overrides = getProfileOverrides()
  overrides[userId] = { name: data.name, surname: data.surname }
  localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(overrides))
}

function earliestUploadDate(videos: Video[]): string {
  if (videos.length === 0) return '—'
  const sorted = [...videos].sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))
  return sorted[0]?.uploadedAt || '—'
}

class UserService {
  async getProfile(userId: number): Promise<UserProfile> {
    const allVideos = await videoService.getVideos()
    const videos = allVideos.filter((v) => v.authorId === userId)
    const currentUser = authService.getUser()
    const isOwnProfile = currentUser?.id === userId

    let name = 'Unknown'
    let surname = ''

    if (isOwnProfile && currentUser) {
      name = currentUser.name
      surname = currentUser.surname
    } else if (videos.length > 0) {
      const parsed = parseAuthorName(videos[0].author)
      name = parsed.name
      surname = parsed.surname
    }

    const overrides = getProfileOverrides()[userId]
    if (overrides) {
      name = overrides.name
      surname = overrides.surname
    }

    if (!isOwnProfile && videos.length === 0) {
      throw new Error('User not found')
    }

    return {
      id: userId,
      name,
      surname,
      joinedAt: earliestUploadDate(videos),
      videoCount: videos.length,
      videos,
    }
  }

  async updateProfile(userId: number, data: UpdateProfileRequest): Promise<UserProfile> {
    const currentUser = authService.getUser()
    if (!currentUser?.id || currentUser.id !== userId) {
      throw new Error('You can only edit your own profile')
    }

    authService.saveUser({
      ...currentUser,
      name: data.name.trim(),
      surname: data.surname.trim(),
    })
    saveProfileOverride(userId, {
      name: data.name.trim(),
      surname: data.surname.trim(),
    })

    return this.getProfile(userId)
  }
}

export default new UserService()
