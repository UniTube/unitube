import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import UploadVideoModal from './UploadVideoModal'
import authService from '../services/authService'
import { Video } from '../types'
import { useInstallPWA } from '../hooks/useInstallPWA'

interface HeaderProps {
  onUpload?: (video: Video) => void
  onGoLiveClick?: () => void
  isLive?: boolean
}

export default function Header({ onUpload, onGoLiveClick, isLive }: HeaderProps) {
  const { theme, toggle } = useTheme()
  const { canInstall, install } = useInstallPWA()

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const navigate = useNavigate()
  const isAuthenticated = authService.isAuthenticated()
  const currentUser = authService.getUser()

  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('search') || ''
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '')
  }, [searchParams])

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!showProfileMenu) return
    function handleOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showProfileMenu])

  function handleLogout() {
    authService.logout()
    setShowProfileMenu(false)
    navigate('/login')
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/')
    }
  }

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-red-100 dark:border-zinc-800 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm">
      <Link
        to="/"
        className="text-xl font-bold tracking-tight text-red-600 hover:opacity-80 transition-opacity shrink-0"
      >
        UniTube
      </Link>
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-[140px] min-[400px]:max-w-[200px] min-[480px]:max-w-[260px] sm:max-w-[360px] md:max-w-[500px] lg:max-w-[600px] mx-2 sm:mx-4 flex items-center"
      >
        <div className="flex items-center flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-l-full focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden shadow-inner transition-colors">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors mr-1 cursor-pointer"
            >
              <ClearIcon />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-650 border border-l-0 border-zinc-300 dark:border-zinc-700 rounded-r-full px-4 md:px-5 py-1.5 md:py-2 text-zinc-600 dark:text-zinc-300 transition-colors flex items-center justify-center shadow-sm cursor-pointer"
          title="Search"
        >
          <SearchIcon />
        </button>
        <button
          type="button"
          className="hidden sm:flex items-center justify-center ml-2 md:ml-3 p-2 md:p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          title="Search with your voice"
        >
          <MicrophoneIcon />
        </button>
      </form>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* PWA Install button — only shown when browser fires beforeinstallprompt */}
        {canInstall && (
          <button
            id="pwa-install-btn"
            onClick={install}
            title="Install UniTube app"
            aria-label="Install UniTube as an app"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 dark:bg-zinc-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-zinc-700 hover:bg-red-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <InstallIcon />
            Install
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <UploadIcon />
                Upload video
              </button>

              {isLive ? (
                <Link
                  to="/live"
                  className="flex items-center gap-2 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                  You are live
                </Link>
              ) : (
                <button
                  onClick={onGoLiveClick || (() => navigate('/', { state: { triggerGoLive: true } }))}
                  className="flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-zinc-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-zinc-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                  Go live
                </button>
              )}

              {/* Profile avatar with dropdown */}
              {currentUser && (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    id="profile-menu-btn"
                    onClick={() => setShowProfileMenu((v) => !v)}
                    aria-haspopup="true"
                    aria-expanded={showProfileMenu}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center text-sm font-bold hover:from-red-600 hover:to-red-800 transition-all shadow-md ring-2 ring-transparent hover:ring-red-300 dark:hover:ring-red-800 focus:outline-none focus:ring-red-400"
                    title="Account menu"
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </button>

                  {showProfileMenu && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50"
                      style={{ animation: 'dropdownFadeIn 0.15s ease-out forwards' }}
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {currentUser.name} {currentUser.surname}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          to="/profile/me"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <UserIcon />
                          My Profile
                        </Link>
                        <Link
                          to="/playlists"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <PlaylistIcon />
                          My Playlists
                        </Link>
                      </div>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <LogoutIcon />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
      </div>
      {showUploadModal && (
        <UploadVideoModal
          onUpload={(video) => {
            if (onUpload) {
              onUpload(video)
            } else {
              navigate('/', { state: { newVideo: video } })
            }
            setShowUploadModal(false)
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
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

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 md:w-5 md:h-5"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function MicrophoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 md:w-5 md:h-5"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function ClearIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function InstallIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function PlaylistIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
