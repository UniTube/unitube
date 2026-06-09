import { useState, useRef } from 'react'
import { Video } from '../types'
import videoService from '../services/videoService'

interface UploadVideoModalProps {
  onUpload: (video: Video) => void
  onClose: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadVideoModal({ onUpload, onClose }: UploadVideoModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string>('')
  const [uploadedAt] = useState<string>(new Date().toLocaleString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile)
      setTitle(selectedFile.name.replace(/\.[^.]+$/, ''))
      setFileSize(formatBytes(selectedFile.size))
      setError(null)

      // Create video preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setError('Please select a valid video file')
    }
  }

  async function handleUpload() {
    if (!title.trim() || !file) return
    setError(null)
    setIsLoading(true)

    try {
      const response = await videoService.uploadVideo({
        title: title.trim(),
        description: description.trim(),
        file,
      })

      const video: Video = {
        id: response.id,
        authorId: response.authorId,
        title: response.title,
        size: response.size,
        uploadedAt: response.uploadedAt,
        description: response.description,
        author: response.author,
        url: response.url || preview || undefined,
      }

      onUpload(video)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(message)
      setIsLoading(false)
    }
  }

  function handleClose() {
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const canUpload = title.trim().length > 0 && file && !isLoading

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Upload video</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-sm text-red-700 flex items-start gap-2">
            <AlertIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row">
          {/* Video preview ──────────────────────────────────────── */}
          <div className="relative bg-gray-950 sm:w-80 aspect-video sm:aspect-auto flex items-center justify-center shrink-0 min-h-48">
            {file && preview ? (
              <video src={preview} className="w-full h-full object-cover" />
            ) : (
              <div
                onClick={() => !isLoading && fileInputRef.current?.click()}
                className={`absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 transition-colors ${
                  isLoading ? 'cursor-not-allowed opacity-50' : 'hover:text-gray-300 cursor-pointer'
                }`}
              >
                <UploadIcon className="w-8 h-8" />
                <span className="text-sm text-center px-4">Click to select a video file</span>
              </div>
            )}

            {/* Upload button overlay */}
            {preview && !isLoading && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 hover:bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors"
              >
                Change file
              </button>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xs text-white">Uploading…</span>
                </div>
              </div>
            )}

            {/* Upload badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Preview
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="hidden"
            />
          </div>

          {/* ── Settings panel ─────────────────────────────────────── */}
          <div className="flex-1 flex flex-col px-6 py-5 gap-5">
            {/* Video title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter a title for your video…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleUpload()}
                disabled={isLoading}
                className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Description</label>
              <textarea
                placeholder="Add a description for your video…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* File info (read-only) */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">File info</p>
              <InfoRow label="Size" value={fileSize || '—'} />
              <InfoRow label="Uploaded at" value={uploadedAt || '—'} />
              <InfoRow label="Author" value="You" />
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!canUpload}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    Upload video
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────── */

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
      <span className="text-xs text-gray-500 dark:text-zinc-400 w-20 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-800 dark:text-zinc-200 truncate">{value}</span>
    </div>
  )
}

/* ── Icons ───────────────────────────────────────────────────────────── */

function XIcon() {
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

function UploadIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function AlertIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
