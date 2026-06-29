import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import VideoPlayer from '../components/VideoPlayer'
import videoService from '../services/videoService'
import authService from '../services/authService'
import { Video, Comment } from '../types'

export default function VideoPage() {
  const { id } = useParams<{ id: string }>()

  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)
  const isAuthenticated = authService.isAuthenticated()

  // Load video by ID
  useEffect(() => {
    if (!id) {
      setError('No video ID provided')
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await videoService.getVideoById(Number(id))
        setVideo(data)
        setLiked(data.likedByMe ?? false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Load comments once video is known
  useEffect(() => {
    if (!video) return
    videoService
      .getComments(video.id)
      .then(setComments)
      .catch(() => {})
  }, [video?.id])

  const handleLikeToggle = async () => {
    if (!video) return
    if (!isAuthenticated) {
      setLikeError('Please log in to like videos.')
      return
    }
    setLikeError(null)
    try {
      if (liked) {
        await videoService.unlikeVideo(video.id)
        setLiked(false)
      } else {
        await videoService.likeVideo(video.id)
        setLiked(true)
      }
    } catch (err) {
      setLikeError(err instanceof Error ? err.message : 'Failed to update like.')
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </main>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-8">
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

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-6"
        >
          <ChevronLeftIcon />
          Back to videos
        </Link>

        <VideoPlayer src={streamUrl} title={video.title} />

        <div className="mt-5">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold leading-snug">{video.title}</h1>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                onClick={handleLikeToggle}
                aria-label={liked ? 'Unlike this video' : 'Like this video'}
                aria-pressed={liked}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                  ${
                    liked
                      ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700'
                      : 'border-red-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400'
                  }`}
              >
                <ThumbUpIcon filled={liked} />
                {liked ? 'Liked' : 'Like'}
              </button>
              {likeError && (
                <p className="text-xs text-red-600 dark:text-red-400">{likeError}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pb-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {video.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{video.author}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                  Uploaded on {video.uploadedAt}
                </p>
              </div>
            </div>
            <span className="text-xs text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-1 rounded-full">
              {video.size}
            </span>
          </div>

          {/* Comments section */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-4">
              {comments.length} Comment{comments.length !== 1 ? 's' : ''}
            </h2>

            {/* New comment input */}
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
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
                  <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold shrink-0">
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
