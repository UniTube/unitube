import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UploadVideoModal from './UploadVideoModal'
import authService from '../services/authService'
import { Video } from '../types'

interface HeaderProps {
  onUpload?: (video: Video) => void
  onGoLiveClick?: () => void
  isLive?: boolean
}

export default function Header({ onUpload, onGoLiveClick, isLive }: HeaderProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const navigate = useNavigate()
  const isAuthenticated = authService.isAuthenticated()

  function handleLogout() {
    authService.removeToken()
    navigate('/login')
  }

  return (
    <>
      <header className="bg-white border-b border-red-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-red-600 hover:opacity-80 transition-opacity"
        >
          UniTube
        </Link>

        <div className="flex items-center gap-3">
          {(onUpload || onGoLiveClick) && isAuthenticated && (
            <>
              {onUpload && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <UploadIcon />
                  Upload video
                </button>
              )}

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
                onGoLiveClick && (
                  <button
                    onClick={onGoLiveClick}
                    className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                    Go live
                  </button>
                )
              )}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              )}
            </>
          )}

          {!isAuthenticated && (
            <Link
              to="/login"
              className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {showUploadModal && onUpload && (
        <UploadVideoModal
          onUpload={(video) => {
            onUpload(video)
            setShowUploadModal(false)
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </>
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
