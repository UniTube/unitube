import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import VideoPlayer from '../VideoPlayer'

describe('VideoPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined)
    window.HTMLMediaElement.prototype.pause = jest.fn()
    Element.prototype.requestFullscreen = jest.fn().mockResolvedValue(undefined)
    document.exitFullscreen = jest.fn().mockResolvedValue(undefined)
  })

  test('renders with title and correct src', () => {
    render(<VideoPlayer src="http://example.com/movie.mp4" title="Sample Video" />)

    const video = screen.getByLabelText('Sample Video') as HTMLVideoElement
    expect(video).toBeInTheDocument()
    expect(video.src).toBe('http://example.com/movie.mp4')
  })

  test('handles toggling play/pause when buttons and video are clicked', () => {
    render(<VideoPlayer src="http://example.com/movie.mp4" title="Sample Video" />)

    const video = screen.getByLabelText('Sample Video') as HTMLVideoElement
    const bigPlayBtn = screen.getByRole('button', { name: /play video/i })
    
    // Initial: paused
    fireEvent.click(bigPlayBtn)
    expect(video.play).toHaveBeenCalled()

    // Trigger video play event to update playing state
    fireEvent(video, new Event('play'))
    
    const pauseControlBtn = screen.getByRole('button', { name: 'Pause' })
    expect(pauseControlBtn).toBeInTheDocument()

    fireEvent.click(pauseControlBtn)
    expect(video.pause).toHaveBeenCalled()
  })

  test('handles volume change and muting toggles', () => {
    render(<VideoPlayer src="http://example.com/movie.mp4" title="Sample Video" />)

    const video = screen.getByLabelText('Sample Video') as HTMLVideoElement
    const muteBtn = screen.getByRole('button', { name: 'Mute' })

    // Mute toggle
    fireEvent.click(muteBtn)
    expect(video.muted).toBe(true)

    // Unmute
    const unmuteBtn = screen.getByRole('button', { name: 'Unmute' })
    fireEvent.click(unmuteBtn)
    expect(video.muted).toBe(false)

    // Volume input range change
    const volumeSlider = screen.getByLabelText('Volume') as HTMLInputElement
    fireEvent.change(volumeSlider, { target: { value: '0.8' } })
    expect(video.volume).toBe(0.8)
  })

  test('handles 10 second skipping controls', () => {
    render(<VideoPlayer src="http://example.com/movie.mp4" title="Sample Video" />)

    const video = screen.getByLabelText('Sample Video') as HTMLVideoElement
    video.currentTime = 50

    const skipForwardBtn = screen.getByRole('button', { name: /next 10 seconds/i })
    fireEvent.click(skipForwardBtn)
    expect(video.currentTime).toBe(60)

    const skipBackBtn = screen.getByRole('button', { name: /previous 10 seconds/i })
    fireEvent.click(skipBackBtn)
    expect(video.currentTime).toBe(50)
  })

  test('enters and exits fullscreen using player controls', () => {
    render(<VideoPlayer src="http://example.com/movie.mp4" title="Sample Video" />)

    const fullscreenBtn = screen.getByRole('button', { name: /enter fullscreen/i })
    fireEvent.click(fullscreenBtn)

    expect(Element.prototype.requestFullscreen).toHaveBeenCalled()

    // Mock document fullscreen state active
    Object.defineProperty(document, 'fullscreenElement', {
      value: {},
      writable: true,
      configurable: true,
    })
    fireEvent(document, new Event('fullscreenchange'))

    const exitFullscreenBtn = screen.getByRole('button', { name: /exit fullscreen/i })
    expect(exitFullscreenBtn).toBeInTheDocument()

    fireEvent.click(exitFullscreenBtn)
    expect(document.exitFullscreen).toHaveBeenCalled()
  })
})
