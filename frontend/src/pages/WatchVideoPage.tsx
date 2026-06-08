import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import VideoPlayer from '../components/VideoPlayer'
import EditVideoModal from '../components/EditVideoModal'
import videoService from '../services/videoService'
import authService from '../services/authService'
import { Video } from '../types'

export default function WatchVideoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const currentUser = authService.getUser()
  const isAuthor = !!currentUser && !!video && video.authorId === currentUser.id

  useEffect(() => {
    if (!id) {
      setError('No video ID provided')
      setLoading(false)
      return
    }

    const loadVideo = async () => {
      try {
        setLoading(true)
        setError(null)
        const videoData = await videoService.getVideoById(Number(id))
        setVideo(videoData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video')
        setVideo(null)
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [id])

  async function handleDelete() {
    if (!video || !window.confirm(`Delete "${video.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await videoService.deleteVideo(video.id)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </main>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-6">
            <ChevronLeftIcon />
            Back to videos
          </Link>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading video</p>
            <p className="text-sm">{error || 'Video not found'}</p>
          </div>
        </main>
      </div>
    )
  }

  const streamUrl = video.url || videoService.getStreamUrl(video.id)

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-4">
          <ChevronLeftIcon />
          Back to videos
        </Link>

        <VideoPlayer src={streamUrl} title={video.title} />

        <div className="mt-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold leading-snug flex-1">{video.title}</h1>

            {/* Author-only actions */}
            {isAuthor && (
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <PencilIcon />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <span className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                  ) : (
                    <TrashIcon />
                  )}
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {video.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{video.author}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-500">{video.uploadedAt}</p>
              </div>
            </div>

            <span className="self-start sm:self-auto text-xs text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
              {video.size}
            </span>
          </div>

          {video.description && (
            <div className="mt-4 bg-gray-50 dark:bg-zinc-900 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-800 dark:text-zinc-300 whitespace-pre-wrap">{video.description}</p>
            </div>
          )}
        </div>
      </main>

      {showEditModal && (
        <EditVideoModal
          video={video}
          onSave={(updated) => { setVideo(updated); setShowEditModal(false) }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
