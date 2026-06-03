import { useParams, Link, Navigate } from 'react-router-dom'
import Header from '../components/Header'
import { Video } from '../types'

interface VideoPageProps {
  videos: Video[]
}

export default function VideoPage({ videos }: VideoPageProps) {
  const { id } = useParams<{ id: string }>()
  const video = videos.find((v) => v.id === Number(id))

  if (!video) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-red-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-6"
        >
          <ChevronLeftIcon />
          Back to videos
        </Link>

        <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg">
          <video
            src={video.url}
            controls
            autoPlay
            className="w-full max-h-[520px] object-contain"
          />
        </div>

        <div className="mt-5">
          <h1 className="text-xl font-semibold leading-snug">{video.name}</h1>

          <div className="flex items-center justify-between mt-3 pb-4 border-b border-red-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {video.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{video.author}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">Uploaded on {video.uploadedAt}</p>
              </div>
            </div>

            <span className="text-xs text-gray-400 dark:text-zinc-500 bg-white dark:bg-zinc-800 border border-red-100 dark:border-zinc-700 px-3 py-1 rounded-full">
              {video.size}
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
