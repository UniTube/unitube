import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import GoLiveModal from '../GoLiveModal'

describe('GoLiveModal', () => {
  let mockTrack: any
  let mockStream: any
  let mockOnStart: jest.Mock
  let mockOnClose: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnStart = jest.fn()
    mockOnClose = jest.fn()

    mockTrack = {
      enabled: true,
      label: 'Mock Device',
      stop: jest.fn(),
    }

    mockStream = {
      getTracks: jest.fn(() => [mockTrack]),
      getVideoTracks: jest.fn(() => [mockTrack]),
      getAudioTracks: jest.fn(() => [mockTrack]),
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    })

    // Mock AudioContext and requestAnimationFrame for audio test
    class MockAudioContext {
      close = jest.fn()
      createMediaStreamSource = jest.fn().mockReturnValue({
        connect: jest.fn(),
      })
      createAnalyser = jest.fn().mockReturnValue({
        fftSize: 0,
        frequencyBinCount: 12,
        getByteFrequencyData: jest.fn(),
      })
    }
    global.AudioContext = MockAudioContext as any
    global.requestAnimationFrame = (cb: any) => setTimeout(cb, 0) as any
    global.cancelAnimationFrame = jest.fn()
  })

  test('acquires stream on mount and displays devices status', async () => {
    render(<GoLiveModal onStart={mockOnStart} onClose={mockOnClose} />)

    expect(screen.getByText('Connecting…')).toBeInTheDocument()

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
      expect(screen.queryByText('Connecting…')).not.toBeInTheDocument()
      expect(screen.getByText('Mock Device')).toBeInTheDocument()
    })
  })

  test('displays permission error if getUserMedia fails', async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'))

    render(<GoLiveModal onStart={mockOnStart} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText(/Could not access camera or microphone/i)).toBeInTheDocument()
    })
  })

  test('toggles camera and microphone tracks status', async () => {
    render(<GoLiveModal onStart={mockOnStart} onClose={mockOnClose} />)

    await screen.findByText('Mock Device')

    const cameraToggleBtn = screen.getByRole('button', { name: /turn off camera/i })
    fireEvent.click(cameraToggleBtn)
    expect(mockTrack.enabled).toBe(false)

    const micToggleBtn = screen.getByRole('button', { name: /mute microphone/i })
    fireEvent.click(micToggleBtn)
    expect(mockTrack.enabled).toBe(false)
  })

  test('enables audio test and runs visualiser loop', async () => {
    render(<GoLiveModal onStart={mockOnStart} onClose={mockOnClose} />)

    await screen.findByText('Mock Device')

    const testAudioBtn = screen.getByRole('button', { name: /test audio/i })
    fireEvent.click(testAudioBtn)

    expect(testAudioBtn).toHaveTextContent(/stop test/i)

    fireEvent.click(testAudioBtn)
    expect(testAudioBtn).toHaveTextContent(/test audio/i)
  })

  test('validates title and triggers onStart callback', async () => {
    render(<GoLiveModal onStart={mockOnStart} onClose={mockOnClose} />)

    await screen.findByText('Mock Device')

    const startBtn = screen.getByRole('button', { name: /start streaming/i })
    expect(startBtn).toBeDisabled()

    const titleInput = screen.getByPlaceholderText(/enter a title for your stream…/i)
    fireEvent.change(titleInput, { target: { value: 'My Test Stream' } })

    expect(startBtn).not.toBeDisabled()
    fireEvent.click(startBtn)

    expect(mockOnStart).toHaveBeenCalledWith('My Test Stream', mockStream)
  })

  test('closes modal and stops tracks when cancel button is clicked', async () => {
    render(<GoLiveModal onStart={mockOnStart} onClose={mockOnClose} />)

    await screen.findByText('Mock Device')

    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtn)

    expect(mockTrack.stop).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })
})
