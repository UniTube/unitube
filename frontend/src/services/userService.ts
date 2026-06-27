import { UpdateProfileRequest, UserProfile, VideoResponse } from '../types'
import authService from './authService'
import { mapVideo } from './videoService'

const API_BASE_URL = 'http://127.0.0.1:8088/api/v1'

function mapProfile(data: UserProfile & { videos: VideoResponse[] }): UserProfile {
  return {
    id: data.id,
    name: data.name,
    surname: data.surname,
    joinedAt: data.joinedAt,
    videoCount: data.videoCount,
    videos: data.videos.map(mapVideo),
  }
}

class UserService {
  async getMyProfile(): Promise<UserProfile> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/users/me/profile`)
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to load profile' }))
      throw new Error(error.error || `Failed to load profile (${response.status})`)
    }
    const profile = mapProfile(await response.json())
    const currentUser = authService.getUser()
    if (currentUser) {
      authService.saveUser({
        ...currentUser,
        id: profile.id,
        name: profile.name,
        surname: profile.surname,
      })
    }
    return profile
  }

  async getProfile(userId: number): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'User not found' }))
      throw new Error(error.error || `Failed to load profile (${response.status})`)
    }
    return mapProfile(await response.json())
  }

  async updateProfile(userId: number, data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users/${userId}/profile`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    )
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Update failed' }))
      throw new Error(error.error || 'Failed to update profile')
    }

    const profile = mapProfile(await response.json())
    const currentUser = authService.getUser()
    if (currentUser?.id === userId) {
      authService.saveUser({
        ...currentUser,
        id: profile.id,
        name: profile.name,
        surname: profile.surname,
      })
    }
    return profile
  }

  async updateMyProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/users/me/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Update failed' }))
      throw new Error(error.error || 'Failed to update profile')
    }

    const profile = mapProfile(await response.json())
    const currentUser = authService.getUser()
    if (currentUser) {
      authService.saveUser({
        ...currentUser,
        id: profile.id,
        name: profile.name,
        surname: profile.surname,
      })
    }
    return profile
  }
}

export default new UserService()
