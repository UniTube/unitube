import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import VideoPage from './pages/VideoPage'
import { Video } from './types'

export default function App() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLive, setIsLive] = useState(false)

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

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            videos={videos}
            isLive={isLive}
            onUpload={handleUpload}
            onDelete={handleDelete}
            onToggleLive={() => setIsLive((v) => !v)}
          />
        }
      />
      <Route path="/watch/:id" element={<VideoPage videos={videos} />} />
    </Routes>
  )
}
