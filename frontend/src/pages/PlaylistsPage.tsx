import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import authService from '../services/authService'
import playlistService from '../services/playlistService'
import { Playlist } from '../types'

export default function PlaylistsPage() {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New-playlist form state
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }
    playlistService
      .getMyPlaylists()
      .then(setPlaylists)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load playlists'))
      .finally(() => setLoading(false))
  }, [navigate])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const created = await playlistService.createPlaylist(newName.trim())
      setPlaylists((prev) => [created, ...prev])
      setNewName('')
      setNewDesc('')
      setShowForm(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create playlist')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Delete this playlist? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await playlistService.deletePlaylist(id)
      setPlaylists((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete playlist')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              My Playlists
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Organisieren Sie Ihre Videos in benutzerdefinierten Wiedergabelisten, um sie leicht zu
              finden und zu teilen.
            </p>
          </div>
          <button
            id="new-playlist-btn"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <PlusIcon />
            New Playlist
          </button>
        </div>

        {/* Create-playlist inline form */}
        {showForm && (
          <div
            className="mb-8 bg-white dark:bg-zinc-900 border border-red-100 dark:border-zinc-700 rounded-2xl p-6 shadow-sm"
            style={{ animation: 'slideDown 0.2s ease-out' }}
          >
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <PlaylistPlusIcon />
              Eine neue Wiedergabeliste erstellen
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="playlist-name-input"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Tutorials, Favourites…"
                  maxLength={100}
                  className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="playlist-desc-input"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this playlist about?"
                  rows={2}
                  maxLength={300}
                  className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                />
              </div>
              {createError && (
                <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    'Create'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setNewName('')
                    setNewDesc('')
                    setCreateError(null)
                  }}
                  className="border border-zinc-200 dark:border-zinc-700 text-sm font-medium px-5 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-5 py-4 rounded-xl">
            <p className="font-medium"> Die Playlists konnten nicht geladen werden </p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && playlists.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5">
              <EmptyPlaylistIcon />
            </div>
            <h2 className="text-xl font-semibold mb-2">No playlists yet</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
              Erstellen Sie Ihre erste Wiedergabeliste, um Ihre Videos zu organisieren
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              Eine Wiedergabeliste erstellen
            </button>
          </div>
        )}

        {/* Playlist grid */}
        {!loading && !error && playlists.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                deleting={deletingId === playlist.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ─── Playlist Card ──────────────────────────────────────────────────────── */

interface PlaylistCardProps {
  playlist: Playlist
  deleting: boolean
  onDelete: (id: number, e: React.MouseEvent) => void
}

function PlaylistCard({ playlist, deleting, onDelete }: PlaylistCardProps) {
  return (
    <Link
      to={`/playlists/${playlist.id}`}
      className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-red-300 dark:hover:border-red-900 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
    >
      {/* Thumbnail area */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-red-900/40 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,.03)_10px,rgba(255,255,255,.03)_20px)]" />
        <PlaylistBigIcon />
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md font-medium">
          {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 px-4 py-3">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {playlist.name}
        </h3>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => onDelete(playlist.id, e)}
        disabled={deleting}
        aria-label={`Delete playlist ${playlist.name}`}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-full transition-all duration-200 disabled:opacity-50"
      >
        {deleting ? (
          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
        ) : (
          <TrashSmallIcon />
        )}
      </button>
    </Link>
  )
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */

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

function PlaylistPlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 text-red-600"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="14" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
      <line x1="18" y1="15" x2="18" y2="21" />
      <line x1="15" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function PlaylistBigIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-12 h-12 text-zinc-400"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="9" />
    </svg>
  )
}

function EmptyPlaylistIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-10 h-10 text-red-400"
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

function TrashSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
