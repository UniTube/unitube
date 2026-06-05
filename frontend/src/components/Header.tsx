import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import UploadVideoModal from './UploadVideoModal'
import authService from '../services/authService'
import { Video } from '../types'

interface HeaderProps {
  onUpload?: (video: Video) => void
  onGoLiveClick?: () => void
  isLive?: boolean
}

export default function Header({ onUpload, onGoLiveClick, isLive }: HeaderProps) {
  const { theme, toggle } = useTheme()

  const [showUploadModal, setShowUploadModal] = useState(false)
  const navigate = useNavigate()
  const isAuthenticated = authService.isAuthenticated()

  function handleLogout() {
    authService.removeToken()
    navigate('/login')
  }

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-red-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link
        to="/"
        className="text-xl font-bold tracking-tight text-red-600 hover:opacity-80 transition-opacity"
      >
        UniTube
      </Link>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

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
                    className="flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-zinc-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-zinc-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                    Go live
                  </button>
                )
              )}

              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
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
      </div>

      {showUploadModal && onUpload && (
        <UploadVideoModal
          onUpload={(video) => {
            onUpload(video)
            setShowUploadModal(false)
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </header>
  )
}

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
