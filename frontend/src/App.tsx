import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import WatchVideoPage from './pages/WatchVideoPage'
import LivePage from './pages/LivePage'
import LoginPage from './pages/LoginPage'
import { Video } from './types'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  const [, setVideos] = useState<Video[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [liveTitle, setLiveTitle] = useState('')

  function handleUpload(newVideos: Video[]) {
    setVideos((prev) => [...newVideos, ...prev])
  }

  function handleDelete(id: number) {
    setVideos((prev) => prev.filter((v) => v.id !== id))
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
            isLive={!!stream}
            onUpload={handleUpload}
            onDelete={handleDelete}
            onGoLive={handleGoLive}
          />
        }
      />
      <Route path="/watch/:id" element={<WatchVideoPage />} />
      <Route
        path="/live"
        element={
          <LivePage
            stream={stream}
            title={liveTitle}
            onEnd={handleEndStream}
            onRecordingSaved={(video) => handleUpload([video])}
          />
        }
      />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile/:id" element={<ProfilePage />} />
    </Routes>
  )
}
