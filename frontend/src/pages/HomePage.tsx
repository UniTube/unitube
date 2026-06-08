import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import GoLiveModal from '../components/GoLiveModal'
import UploadVideoModal from '../components/UploadVideoModal'
import VideoCard from '../components/VideoCard'
import videoService from '../services/videoService'
import { Video } from '../types'

interface HomePageProps {
  isLive: boolean
  onUpload: (video: Video[]) => void
  onDelete: (id: number) => void
  onGoLive: (title: string, stream: MediaStream) => void
}

export default function HomePage({ isLive, onUpload, onDelete, onGoLive }: HomePageProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGoLiveModal, setShowGoLiveModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await videoService.getVideos()
        setVideos(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos')
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [])

  function handleGoLiveStart(title: string, stream: MediaStream) {
    setShowGoLiveModal(false)
    onGoLive(title, stream)
    navigate('/live')
  }

  function handleUploadVideo(newVideo: Video) {
    setVideos((prev) => [newVideo, ...prev])
    onUpload([newVideo, ...videos])
    setShowUploadModal(false)
  }

  function handleDeleteVideo(id: number) {
    setVideos((prev) => prev.filter((v) => v.id !== id))
    onDelete(id)
  }

  return (
    <div className="min-h-screen bg-red-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Header
        onUpload={handleUploadVideo}
        onGoLiveClick={() => setShowGoLiveModal(true)}
        isLive={isLive}
      />

      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium">Error loading videos</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400 dark:text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-zinc-400 font-medium mb-2">No videos yet</p>
                <p className="text-gray-400 dark:text-zinc-500 text-sm mb-6">Upload your first video to get started</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  Upload Video
                </button>
              </div>
            </div>
          )}

          {/* Videos Grid */}
          {!loading && videos.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Videos</h2>
                <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
                  {videos.length} {videos.length === 1 ? 'video' : 'videos'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} onDelete={handleDeleteVideo} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showGoLiveModal && (
        <GoLiveModal onStart={handleGoLiveStart} onClose={() => setShowGoLiveModal(false)} />
      )}

      {showUploadModal && (
        <UploadVideoModal onUpload={handleUploadVideo} onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  )
}
