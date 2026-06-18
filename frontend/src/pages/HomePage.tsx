import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import GoLiveModal from '../components/GoLiveModal'
import UploadVideoModal from '../components/UploadVideoModal'
import VideoCard from '../components/VideoCard'
import videoService, { mapVideo } from '../services/videoService'
import authService from '../services/authService'
import { Video } from '../types'

interface HomePageProps {
  isLive: boolean
  onUpload: (video: Video[]) => void
  onDelete: (id: number) => void
  onGoLive: (title: string, stream: MediaStream) => void
}

function getDeterministicTag(video: Video, availableTags: string[]): string {
  if (availableTags.length <= 1) return 'All'
  const filterableTags = availableTags.filter((t) => t.toLowerCase() !== 'all')
  if (filterableTags.length === 0) return 'All'

  const titleLower = video.title.toLowerCase()
  const descLower = (video.description || '').toLowerCase()

  // 1. Check if video title or description contains the tag name
  for (const tag of filterableTags) {
    if (titleLower.includes(tag.toLowerCase()) || descLower.includes(tag.toLowerCase())) {
      return tag
    }
  }

  // 2. Otherwise, map deterministically based on video.id
  const index = video.id % filterableTags.length
  return filterableTags[index]
}

export default function HomePage({ isLive, onUpload, onDelete, onGoLive }: HomePageProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGoLiveModal, setShowGoLiveModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newVideoIds, setNewVideoIds] = useState<Set<number>>(new Set())
  const navigate = useNavigate()

  const [tags, setTags] = useState<string[]>(['All'])
  const [selectedTag, setSelectedTag] = useState<string>('All')
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const location = useLocation()

  useEffect(() => {
    const newVideo = (location.state as { newVideo?: Video } | null)?.newVideo
    if (!newVideo) return
    setVideos((prev) => (prev.some((v) => v.id === newVideo.id) ? prev : [newVideo, ...prev]))
    onUpload([newVideo])
    navigate('.', { replace: true, state: {} })
  }, [location.state, navigate, onUpload])

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

  useEffect(() => {
    const SSE_URL = 'http://127.0.0.1:8088/sse'
    const eventSource = new EventSource(SSE_URL, { withCredentials: true })

    eventSource.addEventListener('connected', (e) => {
      localStorage.setItem('ClientID', JSON.parse(e.data).client_id)
      console.log('[SSE] Connected to video events stream:', JSON.parse(e.data).client_id)
    })

    eventSource.addEventListener('new_video', (e) => {
      try {
        const eventData = JSON.parse(e.data)
        if (eventData.type === 'new_video' && eventData.payload) {
          const mappedVideo = mapVideo(eventData.payload)

          setVideos((prev) => {
            if (prev.some((v) => v.id === mappedVideo.id)) {
              return prev
            }

            setNewVideoIds((prevSet) => {
              const newSet = new Set(prevSet)
              newSet.add(mappedVideo.id)
              return newSet
            })

            setTimeout(() => {
              setNewVideoIds((prevSet) => {
                const newSet = new Set(prevSet)
                newSet.delete(mappedVideo.id)
                return newSet
              })
            }, 5000)

            return [mappedVideo, ...prev]
          })
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event data:', err)
      }
    })

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection error:', err)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  useEffect(() => {
    async function fetchTags() {
      try {
        const response = await fetch('http://127.0.0.1:8088/api/v1/tags')
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            const cleanTags = ['All', ...data.filter((t) => t.toLowerCase() !== 'all')]
            setTags(cleanTags)
            return
          }
        }
      } catch (err) {
        console.warn('Failed to fetch tags from API, using fallback', err)
      }
      setTags(['All', 'Music', 'Gaming', 'Tech', 'Sports', 'Comedy', 'Education', 'News'])
    }
    fetchTags()
  }, [])

  function handleGoLiveStart(title: string, stream: MediaStream) {
    if (!authService.isAuthenticated()) {
      setShowGoLiveModal(false)
      navigate('/login', { state: { message: 'Please log in before going live.' } })
      return
    }
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

  const filteredVideos = videos.filter((video) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesTitle = video.title.toLowerCase().includes(q)
      const matchesDesc = (video.description || '').toLowerCase().includes(q)
      if (!matchesTitle && !matchesDesc) {
        return false
      }
    }

    if (selectedTag !== 'All') {
      const videoTag = getDeterministicTag(video, tags)
      if (videoTag.toLowerCase() !== selectedTag.toLowerCase()) {
        return false
      }
    }

    return true
  })

  return (
    <div className="min-h-screen bg-red-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Header
        onUpload={handleUploadVideo}
        onGoLiveClick={() => setShowGoLiveModal(true)}
        isLive={isLive}
      />

      {/* Dynamic Tag Chips List */}
      <div className="w-full bg-white dark:bg-zinc-900 border-b border-red-50 dark:border-zinc-800 shadow-sm">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto py-3 px-4 max-w-7xl mx-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer select-none ${
                selectedTag === tag
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700/50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

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

          {/* Empty State (No videos at all) */}
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
                <p className="text-gray-400 dark:text-zinc-500 text-sm mb-6">
                  Upload your first video to get started
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  Upload Video
                </button>
              </div>
            </div>
          )}

          {/* No Search/Filter Results State */}
          {!loading && videos.length > 0 && filteredVideos.length === 0 && (
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-zinc-400 font-medium mb-2">
                  No videos match your search or filter
                </p>
                <p className="text-gray-400 dark:text-zinc-500 text-sm mb-6">
                  Try clearing your search query or choosing another tag.
                </p>
                <button
                  onClick={() => {
                    setSelectedTag('All')
                    navigate('/')
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}

          {/* Videos Grid */}
          {!loading && filteredVideos.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Videos</h2>
                <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
                  {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`rounded-xl p-1 transition-all duration-300 ${
                      newVideoIds.has(video.id) ? 'animate-new-card ring-2 ring-red-500/50' : ''
                    }`}
                  >
                    <VideoCard
                      video={video}
                      onDelete={handleDeleteVideo}
                      currentUserId={authService.getUser()?.id ?? null}
                    />
                  </div>
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
