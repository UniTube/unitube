import { Link } from 'react-router-dom'
import { Video } from '../types'

interface VideoCardProps {
  video: Video
  onDelete: (id: number) => void
}

export default function VideoCard({ video, onDelete }: VideoCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(video.id)
  }

  const handlePlayPreview = (e: HTMLVideoElement) => {
    e.play().catch(() => {})
  }

  const handlePausePreview = (e: HTMLVideoElement) => {
    e.pause()
    e.currentTime = 0
  }

  return (
    <div className="group flex flex-col cursor-pointer transition-transform duration-200 hover:scale-105 relative">
      <Link
        to={`/watch/${video.id}`}
        className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3 flex items-center justify-center hover:no-underline"
      >
        {video.url ? (
          <video
            src={video.url}
            className="w-full h-full object-cover"
            muted
            onMouseEnter={(e) => handlePlayPreview(e.currentTarget)}
            onMouseLeave={(e) => handlePausePreview(e.currentTarget)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <svg className="w-12 h-12 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Delete Button - Visible on Hover */}
      <button
        onClick={handleDelete}
        aria-label={`Delete ${video.title}`}
        className="absolute top-5 right-3 bg-black bg-opacity-60 hover:bg-opacity-100 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Video Information */}
      <Link to={`/watch/${video.id}`} className="flex-1 min-w-0 hover:no-underline">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-gray-600 mt-1 truncate">{video.author}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {video.size} • {video.uploadedAt}
        </p>
      </Link>
    </div>
  )
}
