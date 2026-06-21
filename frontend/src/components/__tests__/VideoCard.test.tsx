import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import VideoCard from '../VideoCard'

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

describe('VideoCard', () => {
  const mockVideo = {
    id: 42,
    title: 'UniTube Tutorial',
    description: 'Learn React development',
    author: 'Alice Smith',
    authorId: 10,
    size: '15.4 MB',
    uploadedAt: '2026-06-09 03:34:02',
    url: 'http://example.com/video.mp4',
    tags: [],
  }

  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders video details correctly', () => {
    render(<VideoCard video={mockVideo} onDelete={mockOnDelete} currentUserId={null} />)

    expect(screen.getByText('UniTube Tutorial')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText(/15.4 MB/)).toBeInTheDocument()
    expect(screen.getByText(/2026-06-09 03:34:02/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /UniTube Tutorial/i })).toHaveAttribute('href', '/watch/42')
  })

  test('does not show delete button if current user is not the author', () => {
    render(<VideoCard video={mockVideo} onDelete={mockOnDelete} currentUserId={5} />)

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  test('shows delete button and calls onDelete if current user is the author', () => {
    render(<VideoCard video={mockVideo} onDelete={mockOnDelete} currentUserId={10} />)

    const deleteBtn = screen.getByRole('button', { name: /delete/i })
    expect(deleteBtn).toBeInTheDocument()

    fireEvent.click(deleteBtn)
    expect(mockOnDelete).toHaveBeenCalledWith(42)
  })

  test('handles mouse hover to trigger play/pause preview', () => {
    const playMock = jest.fn().mockResolvedValue(undefined)
    const pauseMock = jest.fn()

    render(<VideoCard video={mockVideo} onDelete={mockOnDelete} currentUserId={null} />)

    const videoEl = screen.getByRole('link', { name: '' }).querySelector('video')!
    Object.defineProperty(videoEl, 'play', { value: playMock })
    Object.defineProperty(videoEl, 'pause', { value: pauseMock })

    fireEvent.mouseEnter(videoEl)
    expect(playMock).toHaveBeenCalled()

    fireEvent.mouseLeave(videoEl)
    expect(pauseMock).toHaveBeenCalled()
    expect(videoEl.currentTime).toBe(0)
  })
})
