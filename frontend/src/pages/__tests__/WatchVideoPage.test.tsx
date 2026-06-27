import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import WatchVideoPage from '../WatchVideoPage'
import videoService from '../../services/videoService'
import authService from '../../services/authService'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '42' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

jest.mock('../../services/videoService', () => ({
  getVideoById: jest.fn(),
  getComments: jest.fn(),
  likeVideo: jest.fn(),
  addComment: jest.fn(),
  deleteVideo: jest.fn(),
  getStreamUrl: (id: number) => `http://127.0.0.1:8088/api/v1/videos/${id}`,
}))

jest.mock('../../services/authService')

jest.mock('../../components/Header', () => () => <div data-testid="header" />)
jest.mock('../../components/VideoPlayer', () => ({ src, title }: any) => (
  <div data-testid="video-player" data-src={src} data-title={title} />
))
jest.mock('../../components/EditVideoModal', () => () => <div data-testid="edit-modal" />)

describe('WatchVideoPage', () => {
  const mockVideo = {
    id: 42,
    title: 'UniTube Tutorial',
    description: 'Learn React development',
    author: 'Alice Smith',
    authorId: 10,
    size: '15.4 MB',
    uploadedAt: '2026-06-09 03:34:02',
    url: '',
  }

  const mockComments = [
    { id: 1, content: 'Great video!', authorUsername: 'bob' },
    { id: 2, content: 'Very helpful.', authorUsername: 'charlie' },
  ]

  beforeEach(() => {
    jest.clearAllMocks();
    (videoService.getVideoById as jest.Mock).mockResolvedValue(mockVideo);
    (videoService.getComments as jest.Mock).mockResolvedValue(mockComments)
  })

  test('renders loading spinner initially, then displays video details', async () => {
    render(<WatchVideoPage />)

    expect(screen.getByRole('main')).toHaveTextContent('') // loading spin has no text

    await waitFor(() => {
      expect(screen.getByTestId('video-player')).toBeInTheDocument()
      expect(screen.getByText('UniTube Tutorial')).toBeInTheDocument()
      expect(screen.getByText('Learn React development')).toBeInTheDocument()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('15.4 MB')).toBeInTheDocument()
      expect(screen.getByText('Great video!')).toBeInTheDocument()
      expect(screen.getByText('Very helpful.')).toBeInTheDocument()
    })
  })

  test('handles liking a video', async () => {
    (authService.getUser as jest.Mock).mockReturnValue({ id: 1, surname: 'User' })
    render(<WatchVideoPage />)

    await screen.findByText('UniTube Tutorial')

    const likeButton = screen.getByRole('button', { name: /like this video/i })
    fireEvent.click(likeButton)

    await waitFor(() => {
      expect(videoService.likeVideo).toHaveBeenCalledWith(42)
      expect(screen.getByRole('button', { name: /like this video/i })).toHaveTextContent('Liked')
    })
  })

  test('shows liked state when video was previously liked', async () => {
    (videoService.getVideoById as jest.Mock).mockResolvedValue({ ...mockVideo, likedByMe: true })
    render(<WatchVideoPage />)

    await waitFor(() => {
      const likeButton = screen.getByRole('button', { name: /like this video/i })
      expect(likeButton).toHaveTextContent('Liked')
      expect(likeButton).toBeDisabled()
    })
  })

  test('adds a new comment successfully', async () => {
    const mockNewComment = { id: 3, content: 'Awesome!', authorUsername: 'user3' };
    (authService.getUser as jest.Mock).mockReturnValue({ id: 1, surname: 'User3' });
    (videoService.addComment as jest.Mock).mockResolvedValueOnce(mockNewComment)

    render(<WatchVideoPage />)

    await screen.findByText('UniTube Tutorial')

    const textarea = screen.getByPlaceholderText('Add a comment…')
    fireEvent.change(textarea, { target: { value: 'Awesome!' } })

    const commentButton = screen.getByRole('button', { name: /comment/i })
    fireEvent.click(commentButton)

    await waitFor(() => {
      expect(videoService.addComment).toHaveBeenCalledWith(42, 'Awesome!')
      expect(screen.getByText('Awesome!')).toBeInTheDocument()
      expect(textarea).toHaveValue('')
    })
  })

  test('shows Edit and Delete buttons if current user is the author', async () => {
    (authService.getUser as jest.Mock).mockReturnValue({ id: 10, surname: 'Alice' }) // Matching authorId = 10

    render(<WatchVideoPage />)

    await screen.findByText('UniTube Tutorial')

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  test('handles deleting the video on confirm', async () => {
    (authService.getUser as jest.Mock).mockReturnValue({ id: 10, surname: 'Alice' })
    window.confirm = jest.fn(() => true)

    render(<WatchVideoPage />)

    await screen.findByText('UniTube Tutorial')

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled()
      expect(videoService.deleteVideo).toHaveBeenCalledWith(42)
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
