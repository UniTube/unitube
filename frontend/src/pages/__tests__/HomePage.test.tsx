import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '../HomePage'
import videoService from '../../services/videoService'
import authService from '../../services/authService'

const mockNavigate = jest.fn()
let mockSearchParams = new URLSearchParams()
let mockLocationState: any = null

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, jest.fn()],
  useLocation: () => ({
    state: mockLocationState,
  }),
}))

jest.mock('../../services/videoService', () => ({
  getVideos: jest.fn(),
  mapVideo: (video: any) => ({
    id: video.id,
    title: video.title,
    size: video.size || '—',
    uploadedAt: video.uploadedAt || '—',
    description: video.description || '',
    author: video.author || 'Unknown',
    authorId: video.authorId,
    url: `/videos/${video.id}`,
    tags: video.tags || [],
  }),
}))

jest.mock('../../services/authService', () => ({
  isAuthenticated: jest.fn(),
  getUser: jest.fn(),
}))

jest.mock('../../components/Header', () => ({ onGoLiveClick, onUpload, isLive }: any) => (
  <div data-testid="header">
    <button data-testid="go-live-btn" onClick={onGoLiveClick}>Go live</button>
    {isLive && <span data-testid="is-live-indicator">Live</span>}
  </div>
))

jest.mock('../../components/GoLiveModal', () => ({ onStart, onClose }: any) => (
  <div data-testid="go-live-modal">
    <button data-testid="start-stream-btn" onClick={() => onStart('My Live Stream', { getTracks: () => [] })}>Start</button>
    <button data-testid="close-go-live-btn" onClick={onClose}>Close</button>
  </div>
))

jest.mock('../../components/UploadVideoModal', () => () => <div data-testid="upload-modal" />)

jest.mock('../../components/VideoCard', () => ({ video, onDelete }: any) => (
  <div data-testid="video-card">
    <h3>{video.title}</h3>
    <button data-testid={`delete-btn-${video.id}`} onClick={() => onDelete(video.id)}>Delete</button>
  </div>
))

// Mock EventSource for SSE testing
class MockEventSource {
  url: string
  listeners: { [key: string]: Function[] } = {}

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  removeEventListener() {}
  close() {}

  dispatchEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback({ data: JSON.stringify(data) }))
    }
  }

  static instances: MockEventSource[] = []
}

global.EventSource = MockEventSource as any

describe('HomePage', () => {
  const mockVideos = [
    { id: 1, title: 'React Guide', description: 'Intro to React', tags: ['Education'] },
    { id: 2, title: 'Gaming stream', description: 'Let play Minecraft', tags: ['Gaming'] },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    MockEventSource.instances = []
    mockSearchParams = new URLSearchParams()
    mockLocationState = null
    ;(videoService.getVideos as jest.Mock).mockResolvedValue(mockVideos)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ['All', 'Education', 'Gaming', 'Music'],
    })
  })

  test('renders layout components, loads videos and fetches dynamic tags', async () => {
    render(<HomePage isLive={false} onUpload={jest.fn()} onDelete={jest.fn()} onGoLive={jest.fn()} />)

    expect(screen.getByTestId('header')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('React Guide')).toBeInTheDocument()
      expect(screen.getByText('Gaming stream')).toBeInTheDocument()
      expect(screen.getByText('Education')).toBeInTheDocument()
      expect(screen.getByText('Gaming')).toBeInTheDocument()
    })
  })

  test('filters videos by search query parameter', async () => {
    mockSearchParams.set('search', 'minecraft')
    render(<HomePage isLive={false} onUpload={jest.fn()} onDelete={jest.fn()} onGoLive={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Gaming stream')).toBeInTheDocument()
      expect(screen.queryByText('React Guide')).not.toBeInTheDocument()
    })
  })

  test('filters videos by selecting tag chip', async () => {
    render(<HomePage isLive={false} onUpload={jest.fn()} onDelete={jest.fn()} onGoLive={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('React Guide')).toBeInTheDocument()
    })

    const educationTagBtn = screen.getByRole('button', { name: 'Education' })
    fireEvent.click(educationTagBtn)

    expect(screen.getByText('React Guide')).toBeInTheDocument()
    expect(screen.queryByText('Gaming stream')).not.toBeInTheDocument()
  })

  test('inserts a new video when receiving SSE new_video event', async () => {
    render(<HomePage isLive={false} onUpload={jest.fn()} onDelete={jest.fn()} onGoLive={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('React Guide')).toBeInTheDocument()
    })

    expect(MockEventSource.instances.length).toBe(1)
    const eventSourceInstance = MockEventSource.instances[0]

    // Simulate new video SSE event
    eventSourceInstance.dispatchEvent('new_video', {
      type: 'new_video',
      payload: {
        id: 3,
        title: 'SSE Live Video',
        description: 'Testing live update',
        tags: ['Music'],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('SSE Live Video')).toBeInTheDocument()
    })
  })

  test('Go Live triggers login redirect if user is not authenticated', async () => {
    ;(authService.isAuthenticated as jest.Mock).mockReturnValue(false)
    render(<HomePage isLive={false} onUpload={jest.fn()} onDelete={jest.fn()} onGoLive={jest.fn()} />)

    const goLiveBtn = screen.getByTestId('go-live-btn')
    fireEvent.click(goLiveBtn)

    const startStreamBtn = screen.getByTestId('start-stream-btn')
    fireEvent.click(startStreamBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { message: 'Please log in before going live.' },
    })
  })

  test('Go Live starts broadcast and navigates to LivePage if authenticated', async () => {
    ;(authService.isAuthenticated as jest.Mock).mockReturnValue(true)
    const mockOnGoLive = jest.fn()
    render(<HomePage isLive={false} onUpload={jest.fn()} onDelete={jest.fn()} onGoLive={mockOnGoLive} />)

    const goLiveBtn = screen.getByTestId('go-live-btn')
    fireEvent.click(goLiveBtn)

    const startStreamBtn = screen.getByTestId('start-stream-btn')
    fireEvent.click(startStreamBtn)

    expect(mockOnGoLive).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/live')
  })
})
