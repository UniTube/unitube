import { Link } from 'react-router-dom'

interface HeaderProps {
  onUploadClick?: () => void
  onGoLiveClick?: () => void
  isLive?: boolean
  uploadInput?: React.ReactNode
}

export default function Header({ onUploadClick, onGoLiveClick, isLive, uploadInput }: HeaderProps) {
  return (
    <header className="bg-white border-b border-red-100 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link
        to="/"
        className="text-xl font-bold tracking-tight text-red-600 hover:opacity-80 transition-opacity"
      >
        UniTube
      </Link>

      {onUploadClick && (
        <div className="flex items-center gap-3">
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <UploadIcon />
            Upload video
          </button>
          {uploadInput}

          {isLive ? (
            /* Already live — link back to the broadcast page */
            <Link
              to="/live"
              className="flex items-center gap-2 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
              You are live
            </Link>
          ) : (
            <button
              onClick={onGoLiveClick}
              className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              Go live
            </button>
          )}
        </div>
      )}
    </header>
  )
}

function UploadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}
