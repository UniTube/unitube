import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStreamRecorder } from '../hooks/useStreamRecorder'
import { uploadStreamRecording } from '../utils/recordingUpload'
import authService from '../services/authService'
import { Video } from '../types'

interface LivePageProps {
  stream: MediaStream | null
  title: string
  onEnd: () => void
  onRecordingSaved?: (video: Video) => void
}

export default function LivePage({ stream, title, onEnd, onRecordingSaved }: LivePageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()
  const endingRef = useRef(false)
  const { stopRecording } = useStreamRecorder(stream)
  const [duration, setDuration] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // Simulated viewer count that slowly fluctuates
  const [viewers, setViewers] = useState(1)

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Redirect home if there's no active stream (e.g. direct URL access)
  useEffect(() => {
    if (!stream) navigate('/', { replace: true })
  }, [stream, navigate])

  const finishStream = useCallback(async () => {
    if (endingRef.current || !stream) return
    endingRef.current = true
    setSaving(true)
    setSaveError(null)

    let savedVideo: Video | undefined

    try {
      if (!authService.isAuthenticated()) {
        throw new Error('You must be logged in to save your recording.')
      }

      const blob = await stopRecording()
      if (blob.size > 0) {
        savedVideo = await uploadStreamRecording(blob, title)
        onRecordingSaved?.(savedVideo)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save recording'
      setSaveError(message)
      setSaving(false)
      endingRef.current = false
      if (message.includes('log in')) {
        stream.getTracks().forEach((t) => t.stop())
        onEnd()
        navigate('/login', { replace: true, state: { message } })
      }
      return
    }

    stream.getTracks().forEach((t) => t.stop())
    onEnd()
    navigate('/', { replace: true, state: savedVideo ? { newVideo: savedVideo } : undefined })
  }, [stream, stopRecording, title, onRecordingSaved, onEnd, navigate])

  // Stop streaming if all tracks end (e.g. user closes browser screen-share picker)
  useEffect(() => {
    if (!stream) return
    const handleTrackEnd = () => {
      finishStream()
    }
    stream.getTracks().forEach((t) => t.addEventListener('ended', handleTrackEnd))
    return () => stream.getTracks().forEach((t) => t.removeEventListener('ended', handleTrackEnd))
  }, [stream, finishStream])

  // Live duration counter
  useEffect(() => {
    const id = setInterval(() => setDuration((d) => d + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Simulated viewer fluctuation
  useEffect(() => {
    const id = setInterval(() => {
      setViewers((v) => Math.max(1, v + Math.floor(Math.random() * 3) - 1))
    }, 4000)
    return () => clearInterval(id)
  }, [])

  function handleEnd() {
    finishStream()
  }

  function formatDuration(s: number) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  if (!stream) return null

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative">
      {saving && (
        <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Saving recording…</p>
            <p className="text-xs text-neutral-400 mt-1">Uploading your stream as a video</p>
          </div>
        </div>
      )}

      {saveError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-red-100 text-sm px-4 py-2 rounded-lg max-w-md text-center">
          {saveError}
        </div>
      )}

      {/* Top bar */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-red-500 hover:opacity-80 transition-opacity">
          UniTube
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
          <span className="text-sm text-neutral-400 font-mono">{formatDuration(duration)}</span>
        </div>

        <button
          onClick={handleEnd}
          disabled={saving}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <StopIcon />
          End stream
        </button>
      </header>

      {/* Stream preview */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Video */}
        <div className="flex-1 bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full max-h-[calc(100vh-56px-200px)] lg:max-h-[calc(100vh-56px)] object-contain [transform:scaleX(-1)]"
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col">
          {/* Stream info */}
          <div className="px-5 py-4 border-b border-neutral-800">
            <h1 className="font-semibold text-white text-sm leading-snug">{title}</h1>
            <p className="text-xs text-neutral-400 mt-1">Broadcasting now</p>
          </div>

          {/* Stats */}
          <div className="px-5 py-4 border-b border-neutral-800 grid grid-cols-2 gap-4">
            <Stat label="Viewers" value={viewers.toString()} highlight />
            <Stat label="Duration" value={formatDuration(duration)} />
          </div>

          {/* Stream health */}
          <div className="px-5 py-4 border-b border-neutral-800">
            <p className="text-xs font-medium text-neutral-400 mb-3">Stream health</p>
            <div className="space-y-2">
              <HealthRow label="Video" status="good" />
              <HealthRow label="Audio" status={stream.getAudioTracks().length > 0 ? 'good' : 'none'} />
            </div>
          </div>

          {/* Track list */}
          <div className="px-5 py-4 flex-1">
            <p className="text-xs font-medium text-neutral-400 mb-3">Active tracks</p>
            <ul className="space-y-2">
              {stream.getTracks().map((track) => (
                <li key={track.id} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-neutral-300 capitalize">{track.kind}</span>
                  <span className="text-neutral-500 truncate ml-auto">{track.label || 'Unknown device'}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* End stream */}
          <div className="px-5 py-4 border-t border-neutral-800">
            <button
              onClick={handleEnd}
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              End stream
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function HealthRow({ label, status }: { label: string; status: 'good' | 'none' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-neutral-300">{label}</span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          status === 'good' ? 'bg-green-900/60 text-green-400' : 'bg-neutral-800 text-neutral-500'
        }`}
      >
        {status === 'good' ? 'Good' : 'No signal'}
      </span>
    </div>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}
