import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LivePage from '../LivePage'
import authService from '../../services/authService'
import { uploadStreamRecording } from '../../utils/recordingUpload'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

const mockStopRecording = jest.fn()
jest.mock('../../hooks/useStreamRecorder', () => ({
  useStreamRecorder: () => ({
    stopRecording: mockStopRecording,
  }),
}))

jest.mock('../../utils/recordingUpload', () => ({
  uploadStreamRecording: jest.fn(),
}))

jest.mock('../../services/authService')

describe('LivePage', () => {
  let mockTrack: any
  let mockStream: any

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockTrack = {
      stop: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      kind: 'video',
      id: 'track-1',
      label: 'Mock Camera',
    }

    mockStream = {
      getTracks: jest.fn(() => [mockTrack]),
      getAudioTracks: jest.fn(() => []),
    }
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('redirects to home if no stream is provided', () => {
    render(<LivePage stream={null} title="Test Live" onEnd={jest.fn()} />)
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  test('renders active live stream UI with title and tracks', () => {
    render(<LivePage stream={mockStream} title="My Cool Broadcast" onEnd={jest.fn()} />)

    expect(screen.getByText('My Cool Broadcast')).toBeInTheDocument()
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.getByText('video')).toBeInTheDocument()
    expect(screen.getByText('Mock Camera')).toBeInTheDocument()
  })

  test('handles ending stream successfully when authenticated', async () => {
    ;(authService.isAuthenticated as jest.Mock).mockReturnValue(true)
    const mockBlob = new Blob(['recorded-video'], { type: 'video/mp4' })
    mockStopRecording.mockResolvedValueOnce(mockBlob)

    const mockSavedVideo = { id: 42, title: 'My Cool Broadcast', url: '/videos/42' }
    ;(uploadStreamRecording as jest.Mock).mockResolvedValueOnce(mockSavedVideo)

    const mockOnEnd = jest.fn()
    const mockOnRecordingSaved = jest.fn()

    render(
      <LivePage
        stream={mockStream}
        title="My Cool Broadcast"
        onEnd={mockOnEnd}
        onRecordingSaved={mockOnRecordingSaved}
      />,
    )

    const endButtons = screen.getAllByRole('button', { name: /end stream/i })
    fireEvent.click(endButtons[0]) // Click first "End stream" button

    expect(screen.getByText('Saving recording…')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockStopRecording).toHaveBeenCalled()
      expect(uploadStreamRecording).toHaveBeenCalledWith(mockBlob, 'My Cool Broadcast')
      expect(mockOnRecordingSaved).toHaveBeenCalledWith(mockSavedVideo)
      expect(mockTrack.stop).toHaveBeenCalled()
      expect(mockOnEnd).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/', {
        replace: true,
        state: { newVideo: mockSavedVideo },
      })
    })
  })

  test('updates duration counter every second', () => {
    render(<LivePage stream={mockStream} title="Test Live" onEnd={jest.fn()} />)

    expect(screen.getAllByText('00:00')).toBeInTheDocument()

    jest.advanceTimersByTime(2000)
    expect(screen.getAllByText('00:02')).toBeInTheDocument()
  })
})
