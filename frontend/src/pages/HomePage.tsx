import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import GoLiveModal from '../components/GoLiveModal'
import { Video } from '../types'

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface HomePageProps {
  videos: Video[]
  isLive: boolean
  onUpload: (videos: Video[]) => void
  onDelete: (id: number) => void
  onGoLive: (title: string, stream: MediaStream) => void
}

export default function HomePage({ videos, isLive, onUpload, onDelete, onGoLive }: HomePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newVideos: Video[] = files.map((file, i) => ({
      id: Date.now() + i,
      name: file.name.replace(/\.[^.]+$/, ''),
      size: formatBytes(file.size),
      uploadedAt: new Date().toLocaleString(),
      url: URL.createObjectURL(file),
      author: 'You',
    }))
    onUpload(newVideos)
    e.target.value = ''
  }

  function handleGoLiveStart(title: string, stream: MediaStream) {
    setShowModal(false)
    onGoLive(title, stream)
    navigate('/live')
  }

  return (
    <div className="min-h-screen bg-red-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Header
        onUploadClick={() => fileInputRef.current?.click()}
        onGoLiveClick={() => setShowModal(true)}
        isLive={isLive}
        uploadInput={
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        }
      />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-zinc-200">Videos</h2>
          <span className="text-sm text-gray-400 dark:text-zinc-500">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </span>
        </div>

        {videos.length === 0 ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-red-200 dark:border-zinc-700 rounded-xl py-16 flex flex-col items-center gap-3 text-red-300 dark:text-zinc-600 hover:border-red-400 dark:hover:border-red-800 hover:text-red-500 dark:hover:text-red-500 transition-colors"
          >
            <UploadEmptyIcon />
            <span className="text-sm font-medium">Click to upload your first video</span>
          </button>
        ) : (
          <ul className="space-y-3">
            {videos.map((video) => (
              <li
                key={video.id}
                className="bg-white dark:bg-zinc-900 border border-red-100 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-sm"
              >
                <Link
                  to={`/watch/${video.id}`}
                  className="w-24 h-14 rounded-lg bg-red-50 dark:bg-zinc-800 flex-shrink-0 overflow-hidden block hover:opacity-90 transition-opacity"
                >
                  <video src={video.url} className="w-full h-full object-cover" muted />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/watch/${video.id}`}
                    className="font-medium text-sm truncate block hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    {video.name}
                  </Link>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    {video.author} · {video.size} · {video.uploadedAt}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    to={`/watch/${video.id}`}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Watch
                  </Link>
                  <button
                    onClick={() => onDelete(video.id)}
                    aria-label={`Delete ${video.name}`}
                    className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {showModal && (
        <GoLiveModal onStart={handleGoLiveStart} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function UploadEmptyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
