import { useRef, useState } from 'react'

interface Video {
  id: number
  name: string
  size: string
  uploadedAt: string
  url: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function App() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLive, setIsLive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleDelete(id: number) {
    setVideos((prev) => {
      const removed = prev.find((v) => v.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter((v) => v.id !== id)
    })
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newVideos: Video[] = files.map((file, i) => ({
      id: Date.now() + i,
      name: file.name,
      size: formatBytes(file.size),
      uploadedAt: new Date().toLocaleString(),
      url: URL.createObjectURL(file),
    }))
    setVideos((prev) => [...newVideos, ...prev])
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-red-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-red-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-red-600">UniTube</h1>

        <div className="flex items-center gap-3">
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <UploadIcon />
            Upload video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />

          {/* Live stream button */}
          <button
            onClick={() => setIsLive((v) => !v)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              isLive
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                : 'bg-white hover:bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${isLive ? 'bg-white animate-pulse' : 'bg-red-500'}`}
            />
            {isLive ? 'End stream' : 'Go live'}
          </button>
        </div>
      </header>

      {/* Live banner */}
      {isLive && (
        <div className="bg-red-600 text-white text-sm font-medium text-center py-2 flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
          You are live
        </div>
      )}

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Videos</h2>
          <span className="text-sm text-gray-400">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </span>
        </div>

        <ul className="space-y-3">
          {videos.map((video) => (
            <li
              key={video.id}
              className="bg-white border border-red-100 rounded-xl p-4 flex items-center gap-4 shadow-sm"
            >
              {/* Thumbnail */}
              <div className="w-24 h-14 rounded-lg bg-red-50 overflow-hidden">
                <video src={video.url} className="w-full h-full object-cover" muted />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{video.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {video.size} · {video.uploadedAt}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-red-600 hover:underline"
                >
                  Play
                </a>
                <button
                  onClick={() => handleDelete(video.id)}
                  aria-label={`Delete ${video.name}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
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
      className="w-4 h-4"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function UploadIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export default App
