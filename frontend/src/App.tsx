import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import VideoPage from './pages/VideoPage'
import LivePage from './pages/LivePage'
import LoginPage from './pages/LoginPage'
import { Video } from './types'

export default function App() {
  const [videos, setVideos] = useState<Video[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [liveTitle, setLiveTitle] = useState('')

  function handleUpload(newVideos: Video[]) {
    setVideos((prev) => [...newVideos, ...prev])
  }

  function handleDelete(id: number) {
    setVideos((prev) => {
      const removed = prev.find((v) => v.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter((v) => v.id !== id)
    })
  }

  function handleGoLive(title: string, mediaStream: MediaStream) {
    setLiveTitle(title)
    setStream(mediaStream)
  }

  function handleEndStream() {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setLiveTitle('')
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <HomePage
            videos={videos}
            isLive={!!stream}
            onUpload={handleUpload}
            onDelete={handleDelete}
            onGoLive={handleGoLive}
          />
        }
      />
      <Route path="/watch/:id" element={<VideoPage videos={videos} />} />
      <Route
        path="/live"
        element={<LivePage stream={stream} title={liveTitle} onEnd={handleEndStream} />}
      />
    </Routes>
  )
}
