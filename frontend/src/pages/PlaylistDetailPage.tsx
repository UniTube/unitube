import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import authService from '../services/authService'
import playlistService from '../services/playlistService'
import { Playlist, Video } from '../types'

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }
    if (!id) {
      setError('No playlist ID provided')
      setLoading(false)
      return
    }
    playlistService
      .getPlaylist(Number(id))
      .then(setPlaylist)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load playlist'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleRemoveVideo(videoId: number) {
    if (!playlist) return
    if (!window.confirm('Remove this video from the playlist?')) return
    setRemovingId(videoId)
    try {
      await playlistService.removeVideoFromPlaylist(playlist.id, videoId)
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              videos: prev.videos.filter((v) => v.id !== videoId),
              videoCount: prev.videoCount - 1,
            }
          : prev,
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove video')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <Link
          to="/playlists"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-6"
        >
          <ChevronLeftIcon />
          My Playlists
        </Link>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-5 py-4 rounded-xl">
            <p className="font-medium">Could not load playlist</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        )}

        {/* Content */}
        {playlist && !loading && (
          <>
            {/* Playlist header */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 mb-8 flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Icon */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0 shadow-lg">
                <PlaylistHeaderIcon />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold truncate">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {playlist.description}
                  </p>
                )}
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                  {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}
                  {playlist.createdAt && (
                    <>
                      {' '}
                      &middot; Created{' '}
                      {new Date(playlist.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Video grid */}
            {playlist.videos.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {playlist.videos.map((video) => (
                  <PlaylistVideoCard
                    key={video.id}
                    video={video}
                    removing={removingId === video.id}
                    onRemove={handleRemoveVideo}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

/* ─── Video card for playlist ────────────────────────────────────────────── */

interface PlaylistVideoCardProps {
  video: Video
  removing: boolean
  onRemove: (id: number) => void
}

function PlaylistVideoCard({ video, removing, onRemove }: PlaylistVideoCardProps) {
  const handlePlay = (el: HTMLVideoElement) => el.play().catch(() => {})
  const handlePause = (el: HTMLVideoElement) => {
    el.pause()
    el.currentTime = 0
  }

  return (
    <div className="group relative flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1">
      <Link
        to={`/watch/${video.id}`}
        className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden mb-3 flex items-center justify-center hover:no-underline shadow-md group-hover:shadow-xl transition-shadow"
      >
        {video.url ? (
          <video
            src={video.url}
            className="w-full h-full object-cover"
            muted
            onMouseEnter={(e) => handlePlay(e.currentTarget)}
            onMouseLeave={(e) => handlePause(e.currentTarget)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <svg className="w-12 h-12 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-200">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </div>
        </div>
      </Link>

      {/* Remove button */}
      <button
        onClick={() => onRemove(video.id)}
        disabled={removing}
        aria-label={`Remove ${video.title} from playlist`}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-full transition-all duration-200 disabled:opacity-50 z-10"
        title="Remove from playlist"
      >
        {removing ? (
          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
        ) : (
          <RemoveIcon />
        )}
      </button>

      {/* Video info */}
      <Link to={`/watch/${video.id}`} className="flex-1 min-w-0 hover:no-underline">
        <h3 className="font-medium text-sm text-gray-900 dark:text-zinc-100 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">{video.author}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          {video.size} &middot; {video.uploadedAt}
        </p>
      </Link>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-10 h-10 text-zinc-400"
        >
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
          <polyline points="17 2 12 7 7 2" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">This playlist is empty</h2>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
        Watch a video and use the ⋮ menu to add it here
      </p>
      <Link
        to="/"
        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
      >
        Browse videos
      </Link>
    </div>
  )
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function PlaylistHeaderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-9 h-9"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function RemoveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
