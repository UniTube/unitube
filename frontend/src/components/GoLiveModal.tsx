import { useState } from 'react'

interface GoLiveModalProps {
  onStart: (title: string, stream: MediaStream) => void
  onClose: () => void
}

export default function GoLiveModal({ onStart: _onStart, onClose }: GoLiveModalProps) {
  const [title, setTitle] = useState('')
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [testingAudio, setTestingAudio] = useState(false)

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Go live</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row">

          {/* ── Camera preview ── */}
          <div className="relative bg-gray-950 sm:w-80 aspect-video sm:aspect-auto flex items-center justify-center flex-shrink-0">

            {/* Placeholder feed */}
            {cameraOn ? (
              <div className="w-full h-full flex items-center justify-center">
                {/* Simulated camera silhouette */}
                <div className="flex flex-col items-center gap-3 opacity-30">
                  <div className="w-16 h-16 rounded-full bg-gray-400" />
                  <div className="w-28 h-10 rounded-t-full bg-gray-400" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <CameraOffIcon />
                <span className="text-xs">Camera is off</span>
              </div>
            )}

            {/* Camera-off overlay */}
            {!cameraOn && (
              <div className="absolute inset-0 bg-gray-900/80" />
            )}

            {/* Overlay controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {/* Camera toggle */}
              <ToggleButton
                active={cameraOn}
                onClick={() => setCameraOn((v) => !v)}
                activeIcon={<CameraOnIcon />}
                inactiveIcon={<CameraOffIcon />}
                label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
              />

              {/* Mic toggle */}
              <ToggleButton
                active={micOn}
                onClick={() => setMicOn((v) => !v)}
                activeIcon={<MicOnIcon />}
                inactiveIcon={<MicOffIcon />}
                label={micOn ? 'Mute microphone' : 'Unmute microphone'}
              />
            </div>

            {/* Live indicator badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Preview
            </div>
          </div>

          {/* ── Settings panel ── */}
          <div className="flex-1 flex flex-col px-6 py-5 gap-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stream title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter a title for your stream…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Device status */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Devices</p>
              <DeviceRow
                icon={<CameraOnIcon />}
                label="Camera"
                value={cameraOn ? 'FaceTime HD Camera' : 'Off'}
                active={cameraOn}
              />
              <DeviceRow
                icon={<MicOnIcon />}
                label="Microphone"
                value={micOn ? 'Built-in Microphone' : 'Muted'}
                active={micOn}
              />
            </div>

            {/* Audio test */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Audio</p>
              <div className="flex items-center gap-3">
                {/* Static level bars */}
                <div className="flex items-end gap-0.5 h-5">
                  {[3, 5, 7, 4, 6, 8, 5, 3, 6, 4].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h * 10}%` }}
                      className={`w-1 rounded-full transition-all ${
                        testingAudio && micOn
                          ? 'bg-green-500 animate-pulse'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setTestingAudio((v) => !v)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    testingAudio
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {testingAudio ? 'Stop test' : 'Test audio'}
                </button>
              </div>
              {testingAudio && !micOn && (
                <p className="text-xs text-amber-600 mt-1.5">Microphone is muted.</p>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
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

/* ── Sub-components ───────────────────────────────────────────────── */

interface ToggleButtonProps {
  active: boolean
  onClick: () => void
  activeIcon: React.ReactNode
  inactiveIcon: React.ReactNode
  label: string
}

function ToggleButton({ active, onClick, activeIcon, inactiveIcon, label }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
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

/* ── Icons ────────────────────────────────────────────────────────── */

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CameraOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

function CameraOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <path d="M23 7l-7 5 7 5V7z" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function MicOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
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
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
