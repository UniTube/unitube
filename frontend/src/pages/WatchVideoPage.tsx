import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import VideoPlayer from '../components/VideoPlayer'
import EditVideoModal from '../components/EditVideoModal'
import videoService from '../services/videoService'
import authService from '../services/authService'
import { Video, Comment } from '../types'

function formatDate(raw: string | undefined): string {
  if (!raw) return '—'

  // 1. Extract the main date/time part (first 19 characters: "2026-06-09 03:34:02")
  const cleanDateString = raw.substring(0, 19).replace(' ', 'T')

  // 2. Create the date object
  const d = new Date(cleanDateString)

  if (isNaN(d.getTime())) return raw // Return original if still invalid

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

export default function WatchVideoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)

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

  // Load comments once video is known
  useEffect(() => {
    if (!video) return
    videoService
      .getComments(video.id)
      .then(setComments)
      .catch(() => {})
  }, [video?.id])

  const handleLike = async () => {
    if (liked || !video) return
    try {
      await videoService.likeVideo(video.id)
      setLiked(true)
    } catch {}
  }

  const handleAddComment = async () => {
    const content = newComment.trim()
    if (!content || isSubmitting || !video) return
    setIsSubmitting(true)
    try {
      const comment = await videoService.addComment(video.id, content)
      setComments((prev) => [...prev, comment])
      setNewComment('')
    } catch {}
    setIsSubmitting(false)
  }

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
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-6"
          >
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
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-4"
        >
          <ChevronLeftIcon />
          Back to videos
        </Link>

        <VideoPlayer src={streamUrl} title={video.title} />

        <div className="mt-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold leading-snug flex-1">{video.title}</h1>

            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {/* Like button */}
              <button
                onClick={handleLike}
                disabled={liked}
                aria-label="Like this video"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                  ${
                    liked
                      ? 'bg-red-600 border-red-600 text-white cursor-default'
                      : 'border-red-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400'
                  }`}
              >
                <ThumbUpIcon filled={liked} />
                {liked ? 'Liked' : 'Like'}
              </button>

              {/* Author-only actions */}
              {isAuthor && (
                <>
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
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {video.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <Link
                  to={isAuthor ? '/profile/me' : `/profile/${video.authorId}`}
                  className="text-sm font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {video.author}
                </Link>
                <p className="text-xs text-gray-500 dark:text-zinc-500">
                  {formatDate(video.uploadedAt)}
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto text-xs text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
              {video.size}
            </span>
          </div>

          {video.description && (
            <div className="mt-4 bg-gray-50 dark:bg-zinc-900 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-800 dark:text-zinc-300 whitespace-pre-wrap">
                {video.description}
              </p>
            </div>
          )}

          {/* Comments section */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-4">
              {comments.length} Comment{comments.length !== 1 ? 's' : ''}
            </h2>

            {/* New comment input */}
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {currentUser?.surname.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  rows={2}
                  className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-700 focus:border-red-500 outline-none text-sm resize-none py-1 transition-colors placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setNewComment('')}
                    className="text-xs px-3 py-1.5 rounded-full text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white disabled:opacity-40 hover:bg-red-700 transition-colors"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>

            {/* Comment list */}
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 flex text-white items-center justify-center text-xs font-bold shrink-0">
                    {c.authorUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-0.5">
                      {c.authorUsername}
                    </p>
                    <p className="text-sm">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {showEditModal && (
        <EditVideoModal
          video={video}
          onSave={(updated) => {
            setVideo(updated)
            setShowEditModal(false)
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ThumbUpIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}
