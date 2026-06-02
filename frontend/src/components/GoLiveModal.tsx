import { useState, useEffect, useRef, useCallback } from 'react'

const BAR_COUNT = 12

interface GoLiveModalProps {
  onStart: (title: string, stream: MediaStream) => void
  onClose: () => void
}

export default function GoLiveModal({ onStart, onClose }: GoLiveModalProps) {
  const [title, setTitle] = useState('')
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [testingAudio, setTestingAudio] = useState(false)
  const [acquiring, setAcquiring] = useState(true)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [cameraLabel, setCameraLabel] = useState('—')
  const [micLabel, setMicLabel] = useState('—')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  // Direct DOM refs for bars — avoids re-renders on every animation frame
  const barEls = useRef<(HTMLDivElement | null)[]>(Array(BAR_COUNT).fill(null))

  // ── Acquire camera + mic on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream

        const videoTrack = stream.getVideoTracks()[0]
        const audioTrack = stream.getAudioTracks()[0]
        if (videoTrack) setCameraLabel(videoTrack.label || 'Camera')
        if (audioTrack) setMicLabel(audioTrack.label || 'Microphone')

        setAcquiring(false)
      })
      .catch(() => {
        if (cancelled) return
        setPermissionError('Could not access camera or microphone. Check browser permissions.')
        setAcquiring(false)
      })

    return () => {
      cancelled = true
      // Only stop tracks if we haven't handed the stream off via onStart
      streamRef.current?.getTracks().forEach((t) => t.stop())
      cancelAnimationFrame(rafRef.current)
      audioCtxRef.current?.close()
    }
  }, [])

  // ── Camera toggle ───────────────────────────────────────────────────
  function handleCameraToggle() {
    const next = !cameraOn
    setCameraOn(next)
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = next
    })
  }

  // ── Mic toggle ──────────────────────────────────────────────────────
  function handleMicToggle() {
    const next = !micOn
    setMicOn(next)
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = next
    })
  }

  // ── Audio visualiser loop (runs via requestAnimationFrame) ──────────
  const drawBars = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    barEls.current.forEach((el, i) => {
      if (!el) return
      const idx = Math.floor((i / BAR_COUNT) * data.length)
      const pct = Math.max(8, (data[idx] / 255) * 100)
      el.style.height = `${pct}%`
      el.style.backgroundColor = pct > 70 ? '#ef4444' : pct > 40 ? '#22c55e' : '#86efac'
    })
    rafRef.current = requestAnimationFrame(drawBars)
  }, [])

  // ── Audio test toggle ───────────────────────────────────────────────
  function handleAudioTest() {
    if (testingAudio) {
      cancelAnimationFrame(rafRef.current)
      audioCtxRef.current?.close()
      audioCtxRef.current = null
      analyserRef.current = null
      barEls.current.forEach((el) => {
        if (el) { el.style.height = '20%'; el.style.backgroundColor = '' }
      })
      setTestingAudio(false)
      return
    }

    if (!streamRef.current) return

    const ctx = new AudioContext()
    const src = ctx.createMediaStreamSource(streamRef.current)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    src.connect(analyser)

    audioCtxRef.current = ctx
    analyserRef.current = analyser
    setTestingAudio(true)
    rafRef.current = requestAnimationFrame(drawBars)
  }

  // ── Start stream ────────────────────────────────────────────────────
  function handleStart() {
    if (!title.trim() || !streamRef.current) return

    // Stop audio visualiser but keep the stream alive
    cancelAnimationFrame(rafRef.current)
    audioCtxRef.current?.close()
    audioCtxRef.current = null

    const stream = streamRef.current
    streamRef.current = null // prevent cleanup effect from stopping tracks
    onStart(title.trim(), stream)
  }

  // ── Cancel ──────────────────────────────────────────────────────────
  function handleClose() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    cancelAnimationFrame(rafRef.current)
    audioCtxRef.current?.close()
    onClose()
  }

  const canStart = title.trim().length > 0 && !acquiring && !permissionError

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Go live</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row">

          {/* ── Camera preview ─────────────────────────────────────── */}
          <div className="relative bg-gray-950 sm:w-80 aspect-video sm:aspect-auto flex items-center justify-center flex-shrink-0 min-h-48">

            {/* Actual camera feed */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transform-[scaleX(-1)] transition-opacity duration-300 ${
                cameraOn && !acquiring ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Acquiring spinner */}
            {acquiring && !permissionError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                <span className="w-6 h-6 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
                <span className="text-xs">Connecting…</span>
              </div>
            )}

            {/* Permission error */}
            {permissionError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <CameraOffIcon className="w-8 h-8 text-gray-500" />
                <p className="text-xs text-gray-400">{permissionError}</p>
              </div>
            )}

            {/* Camera-off overlay */}
            {!cameraOn && !acquiring && !permissionError && (
              <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-2">
                <CameraOffIcon className="w-8 h-8 text-gray-500" />
                <span className="text-xs text-gray-500">Camera is off</span>
              </div>
            )}

            {/* Overlay controls */}
            {!permissionError && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <ToggleButton
                  active={cameraOn}
                  disabled={acquiring}
                  onClick={handleCameraToggle}
                  activeIcon={<CameraOnIcon />}
                  inactiveIcon={<CameraOffIcon />}
                  label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
                />
                <ToggleButton
                  active={micOn}
                  disabled={acquiring}
                  onClick={handleMicToggle}
                  activeIcon={<MicOnIcon />}
                  inactiveIcon={<MicOffIcon />}
                  label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                />
              </div>
            )}

            {/* Preview badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Preview
            </div>
          </div>

          {/* ── Settings panel ─────────────────────────────────────── */}
          <div className="flex-1 flex flex-col px-6 py-5 gap-5">

            {/* Stream title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stream title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter a title for your stream…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Device status */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Devices</p>
              <DeviceRow icon={<CameraOnIcon />} label="Camera"       value={cameraOn ? cameraLabel : 'Off'}   active={cameraOn && !acquiring} />
              <DeviceRow icon={<MicOnIcon />}    label="Microphone"   value={micOn    ? micLabel    : 'Muted'} active={micOn    && !acquiring} />
            </div>

            {/* Audio visualiser */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Audio</p>
              <div className="flex items-center gap-3">
                <div className="flex items-end gap-0.5 h-6 w-24">
                  {Array.from({ length: BAR_COUNT }).map((_, i) => (
                    <div
                      key={i}
                      ref={(el) => { barEls.current[i] = el }}
                      className="flex-1 rounded-full bg-gray-200 transition-none"
                      style={{ height: '20%' }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleAudioTest}
                  disabled={acquiring || !!permissionError}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                    testingAudio
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {testingAudio ? 'Stop test' : 'Test audio'}
                </button>
              </div>
              {testingAudio && !micOn && (
                <p className="text-xs text-amber-600 mt-1.5">⚠ Microphone is muted — unmute to test.</p>
              )}
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-white" />
                Start streaming
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────── */

interface ToggleButtonProps {
  active: boolean
  disabled?: boolean
  onClick: () => void
  activeIcon: React.ReactNode
  inactiveIcon: React.ReactNode
  label: string
}

function ToggleButton({ active, disabled, onClick, activeIcon, inactiveIcon, label }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
        active
          ? 'bg-white/20 hover:bg-white/30 text-white'
          : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  )
}

interface DeviceRowProps {
  icon: React.ReactNode
  label: string
  value: string
  active: boolean
}

function DeviceRow({ icon, label, value, active }: DeviceRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50">
      <span className={`flex-shrink-0 ${active ? 'text-gray-600' : 'text-gray-300'}`}>{icon}</span>
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <span className={`text-xs truncate ${active ? 'text-gray-800' : 'text-gray-400'}`}>{value}</span>
    </div>
  )
}

/* ── Icons ───────────────────────────────────────────────────────────── */

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CameraOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

function CameraOffIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <path d="M23 7l-7 5 7 5V7z" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function MicOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <path d="M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2" />
      <path d="M19 10v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
