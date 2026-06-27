import { useEffect, useRef, useState } from 'react'
import playlistService from '../services/playlistService'
import authService from '../services/authService'
import { Playlist } from '../types'

interface AddToPlaylistModalProps {
  videoId: number
  onClose: () => void
}

type ToastState = { type: 'success' | 'error'; message: string } | null

export default function AddToPlaylistModal({ videoId, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Add-to-playlist state per playlist row
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())

  // Create new playlist state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [toast, setToast] = useState<ToastState>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [onClose])

  // Fetch playlists on mount
  useEffect(() => {
    if (!authService.isAuthenticated()) return
    playlistService
      .getMyPlaylists()
      .then(setPlaylists)
      .catch((err) =>
        setFetchError(err instanceof Error ? err.message : 'Could not load playlists'),
      )
      .finally(() => setLoading(false))
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleAdd(playlistId: number) {
    setAddingId(playlistId)
    try {
      await playlistService.addVideoToPlaylist(playlistId, videoId)
      setAddedIds((prev) => new Set([...prev, playlistId]))
      showToast('success', 'Added to playlist!')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to add video')
    } finally {
      setAddingId(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const created = await playlistService.createPlaylist({ name: newName.trim() })
      // Immediately add the current video to the new playlist
      await playlistService.addVideoToPlaylist(created.id, videoId)
      setPlaylists((prev) => [{ ...created, videoCount: 1 }, ...prev])
      setAddedIds((prev) => new Set([...prev, created.id]))
      setNewName('')
      setShowCreateForm(false)
      showToast('success', `Created "${created.name}" and added video!`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create playlist')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-10 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50"
      style={{ animation: 'dropdownFadeIn 0.15s ease-out forwards' }}
      role="dialog"
      aria-label="Save to playlist"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <SaveIcon />
          Save to playlist
        </h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-lg"
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-72 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
          </div>
        )}

        {fetchError && !loading && (
          <div className="px-4 py-3 text-xs text-red-600 dark:text-red-400">{fetchError}</div>
        )}

        {!loading && !fetchError && playlists.length === 0 && !showCreateForm && (
          <p className="px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            No playlists yet. Create one below!
          </p>
        )}

        {!loading && !fetchError && playlists.length > 0 && (
          <ul className="py-1">
            {playlists.map((pl) => {
              const isAdded = addedIds.has(pl.id)
              const isAdding = addingId === pl.id
              return (
                <li key={pl.id}>
                  <button
                    onClick={() => !isAdded && handleAdd(pl.id)}
                    disabled={isAdded || isAdding}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${
                        isAdded
                          ? 'cursor-default text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                      }`}
                  >
                    {/* Playlist thumbnail icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAdded ? 'bg-green-100 dark:bg-green-900/40' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                    >
                      {isAdded ? <CheckIcon /> : <SmallPlaylistIcon />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pl.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {pl.videoCount} video{pl.videoCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {isAdding && (
                      <span className="w-4 h-4 border-2 border-zinc-300 border-t-red-600 rounded-full animate-spin shrink-0" />
                    )}
                    {isAdded && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 shrink-0">
                        Saved
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Inline create form */}
        {showCreateForm && (
          <div
            className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3"
            style={{ animation: 'slideDown 0.15s ease-out' }}
          >
            <form onSubmit={handleCreate} className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                New playlist name
              </label>
              <input
                id="add-to-playlist-new-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. My favourites"
                autoFocus
                maxLength={100}
                className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
              />
              {createError && (
                <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-1">
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    'Create & Add'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewName('')
                    setCreateError(null)
                  }}
                  className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer — create new */}
      {!showCreateForm && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <PlusIcon />
            </div>
            <span className="font-medium">Create new playlist</span>
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg text-xs font-medium text-white shadow-lg
            ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          style={{ animation: 'toastIn 0.2s ease-out' }}
        >
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-red-500"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-green-600 dark:text-green-400"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SmallPlaylistIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-zinc-500 dark:text-zinc-400"
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

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      className="w-4 h-4"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
