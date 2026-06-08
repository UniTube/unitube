import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import VideoPlayer from '../components/VideoPlayer'
import videoService from '../services/videoService'
import { Video } from '../types'

export default function WatchVideoPage() {
  const { id } = useParams<{ id: string }>()
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
          </div>
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
          <h1 className="text-xl sm:text-2xl font-semibold leading-snug">
            {video.title}
          </h1>

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
