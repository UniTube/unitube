import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

interface LivePageProps {
  stream: MediaStream | null
  title: string
  onEnd: () => void
}

export default function LivePage({ stream, title, onEnd }: LivePageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()
  const [duration, setDuration] = useState(0)
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

  // Stop streaming if all tracks end (e.g. user closes browser screen-share picker)
  useEffect(() => {
    if (!stream) return
    const handleTrackEnd = () => {
      onEnd()
      navigate('/', { replace: true })
    }
    stream.getTracks().forEach((t) => t.addEventListener('ended', handleTrackEnd))
    return () => stream.getTracks().forEach((t) => t.removeEventListener('ended', handleTrackEnd))
  }, [stream, onEnd, navigate])

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
    stream?.getTracks().forEach((t) => t.stop())
    onEnd()
    navigate('/')
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-red-500 hover:opacity-80 transition-opacity">
          UniTube
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
          <span className="text-sm text-gray-400 font-mono">{formatDuration(duration)}</span>
        </div>

        <button
          onClick={handleEnd}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
            className="w-full max-h-[calc(100vh-56px-200px)] lg:max-h-[calc(100vh-56px)] object-contain"
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col">
          {/* Stream info */}
          <div className="px-5 py-4 border-b border-gray-800">
            <h1 className="font-semibold text-white text-sm leading-snug">{title}</h1>
            <p className="text-xs text-gray-400 mt-1">Broadcasting now</p>
          </div>

          {/* Stats */}
          <div className="px-5 py-4 border-b border-gray-800 grid grid-cols-2 gap-4">
            <Stat label="Viewers" value={viewers.toString()} highlight />
            <Stat label="Duration" value={formatDuration(duration)} />
          </div>

          {/* Stream health */}
          <div className="px-5 py-4 border-b border-gray-800">
            <p className="text-xs font-medium text-gray-400 mb-3">Stream health</p>
            <div className="space-y-2">
              <HealthRow label="Video" status="good" />
              <HealthRow label="Audio" status={stream.getAudioTracks().length > 0 ? 'good' : 'none'} />
            </div>
          </div>

          {/* Track list */}
          <div className="px-5 py-4 flex-1">
            <p className="text-xs font-medium text-gray-400 mb-3">Active tracks</p>
            <ul className="space-y-2">
              {stream.getTracks().map((track) => (
                <li key={track.id} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-gray-300 capitalize">{track.kind}</span>
                  <span className="text-gray-500 truncate ml-auto">{track.label || 'Unknown device'}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* End stream */}
          <div className="px-5 py-4 border-t border-gray-800">
            <button
              onClick={handleEnd}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
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
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function HealthRow({ label, status }: { label: string; status: 'good' | 'none' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-300">{label}</span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          status === 'good' ? 'bg-green-900/60 text-green-400' : 'bg-gray-800 text-gray-500'
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
