import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import VideoCard from '../components/VideoCard'
import userService from '../services/userService'
import authService from '../services/authService'
import videoService from '../services/videoService'
import { UserProfile } from '../types'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSurname, setEditSurname] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setIsOwnProfile(false)
      setCurrentUserId(null)
      return
    }
    userService
      .getMyProfile()
      .then((my) => {
        setCurrentUserId(my.id)
        setIsOwnProfile(id === 'me' || my.id === Number(id))
      })
      .catch(() => {
        setIsOwnProfile(id === 'me')
        setCurrentUserId(null)
      })
  }, [id])

  useEffect(() => {
    if (!isOwnProfile) setEditing(false)
  }, [isOwnProfile])

  useEffect(() => {
    if (!id) {
      setError('No user ID provided')
      setLoading(false)
      return
    }

    const loadProfile =
      id === 'me'
        ? userService.getMyProfile()
        : userService.getProfile(Number(id))

    loadProfile
      .then((data) => {
        setProfile(data)
        setEditName(data.name)
        setEditSurname(data.surname)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSaveProfile() {
    if (!profile || !editName.trim() || !isOwnProfile) return
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await userService.updateMyProfile({
        name: editName.trim(),
        surname: editSurname.trim(),
      })
      setProfile(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteVideo(videoId: number) {
    try {
      await videoService.deleteVideo(videoId)
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              videos: prev.videos.filter((v) => v.id !== videoId),
              videoCount: prev.videoCount - 1,
            }
          : prev,
      )
    } catch (err) {
      console.error('Failed to delete video:', err)
    }
  }

  const displayName = profile ? `${profile.name} ${profile.surname}`.trim() : ''

  return (
    <div className="min-h-screen bg-red-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {profile && !loading && (
          <>
            <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-zinc-800 p-6 md:p-8 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center text-3xl font-bold shrink-0">
                  {profile.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="space-y-3 max-w-md">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="First name"
                        className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={editSurname}
                        onChange={(e) => setEditSurname(e.target.value)}
                        placeholder="Last name"
                        className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm"
                      />
                      {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving || !editName.trim()}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false)
                            setEditName(profile.name)
                            setEditSurname(profile.surname)
                            setSaveError(null)
                          }}
                          disabled={saving}
                          className="border border-gray-200 dark:border-zinc-700 text-sm font-medium px-4 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                        Joined {profile.joinedAt} · {profile.videoCount}{' '}
                        {profile.videoCount === 1 ? 'video' : 'videos'}
                      </p>
                      {isOwnProfile && (
                        <button
                          onClick={() => setEditing(true)}
                          className="mt-4 text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Edit profile
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Videos</h2>
              {profile.videos.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-zinc-400">
                  <p className="font-medium">No videos yet</p>
                  {isOwnProfile && (
                    <Link to="/" className="text-red-600 hover:text-red-700 text-sm mt-2 inline-block">
                      Upload your first video
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {profile.videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onDelete={handleDeleteVideo}
                      currentUserId={isOwnProfile ? currentUserId : null}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
