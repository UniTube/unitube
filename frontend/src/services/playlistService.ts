import { Playlist, CreatePlaylistRequest, Video } from '../types'
import authService from './authService'
import { mapVideo } from './videoService'

const API_BASE_URL = 'http://127.0.0.1:8088/api/v1'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlaylist(data: any): Playlist {
  return {
    id: data.id,
    name: data.name,
    description: data.description ?? '',
    videoCount: data.videoCount ?? (data.videos ? data.videos.length : 0),
    createdAt: data.createdAt ?? '',
    videos: (data.videos ?? []).map(mapVideo) as Video[],
  }
}

class PlaylistService {
  /** GET /playlists/me — fetch all playlists owned by the authenticated user */
  async getMyPlaylists(): Promise<Playlist[]> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/playlists/me`)
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to load playlists' }))
      throw new Error(error.error || `Failed to load playlists (${response.status})`)
    }
    const data = await response.json()
    return Array.isArray(data) ? data.map(mapPlaylist) : []
  }

  /** GET /playlists/:id — fetch a single playlist with its videos */
  async getPlaylist(playlistId: number): Promise<Playlist> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/playlists/${playlistId}`,
    )
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to load playlist' }))
      throw new Error(error.error || `Failed to load playlist (${response.status})`)
    }
    return mapPlaylist(await response.json())
  }

  /** POST /playlists — create a new playlist */
  async createPlaylist(data: CreatePlaylistRequest): Promise<Playlist> {
    const user = authService.getUser()
    if (!user?.id) throw new Error('You must be logged in to create a playlist')

    const response = await authService.authenticatedFetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, ownerId: user.id }),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create playlist' }))
      throw new Error(error.error || `Failed to create playlist (${response.status})`)
    }
    return mapPlaylist(await response.json())
  }

  /** POST /playlists/:id/videos — add a video to a playlist */
  async addVideoToPlaylist(playlistId: number, videoId: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/playlists/${playlistId}/videos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      },
    )
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to add video' }))
      throw new Error(error.error || `Failed to add video to playlist (${response.status})`)
    }
  }

  /** DELETE /playlists/:id/videos/:videoId — remove a video from a playlist */
  async removeVideoFromPlaylist(playlistId: number, videoId: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/playlists/${playlistId}/videos/${videoId}`,
      { method: 'DELETE' },
    )
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to remove video' }))
      throw new Error(error.error || `Failed to remove video from playlist (${response.status})`)
    }
  }

  /** DELETE /playlists/:id — delete an entire playlist */
  async deletePlaylist(playlistId: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/playlists/${playlistId}`,
      { method: 'DELETE' },
    )
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete playlist' }))
      throw new Error(error.error || `Failed to delete playlist (${response.status})`)
    }
  }
}

export default new PlaylistService()
