import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import VideoPage from '../VideoPage'
import videoService from '../../services/videoService'
import authService from '../../services/authService'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '12' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

jest.mock('../../services/videoService', () => ({
  getVideoById: jest.fn(),
  getComments: jest.fn(),
  likeVideo: jest.fn(),
  unlikeVideo: jest.fn(),
  addComment: jest.fn(),
  getStreamUrl: (id: number) => `http://127.0.0.1:8088/api/v1/videos/${id}`,
}))

jest.mock('../../services/authService')

jest.mock('../../components/Header', () => () => <div data-testid="header" />)
jest.mock('../../components/VideoPlayer', () => ({ src, title }: any) => (
  <div data-testid="video-player" data-src={src} data-title={title} />
))

describe('VideoPage', () => {
  const mockVideo = {
    id: 12,
    title: 'Testing VideoPage',
    description: 'Learn everything about tests',
    author: 'Bob Vance',
    authorId: 5,
    size: '10.2 MB',
    uploadedAt: '2026-06-20 10:00:00',
    url: '',
  }

  const mockComments = [
    { id: 1, content: 'Nice testing!', authorUsername: 'pam' },
  ]

  beforeEach(() => {
    jest.clearAllMocks();
    (videoService.getVideoById as jest.Mock).mockResolvedValue(mockVideo);
    (videoService.getComments as jest.Mock).mockResolvedValue(mockComments)
  })

  test('renders loading spinner and then video metadata and comments', async () => {
    render(<VideoPage />)

    expect(screen.getByTestId('header')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('video-player')).toBeInTheDocument()
      expect(screen.getByText('Testing VideoPage')).toBeInTheDocument()
      expect(screen.getByText('Bob Vance')).toBeInTheDocument()
      expect(screen.getByText('10.2 MB')).toBeInTheDocument()
      expect(screen.getByText('Nice testing!')).toBeInTheDocument()
      expect(screen.getByText('pam')).toBeInTheDocument()
    })
  })

  test('handles liking a video successfully', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true)
    render(<VideoPage />)

    await screen.findByText('Testing VideoPage')

    const likeBtn = screen.getByRole('button', { name: /like this video/i })
    fireEvent.click(likeBtn)

    await waitFor(() => {
      expect(videoService.likeVideo).toHaveBeenCalledWith(12)
      expect(likeBtn).toHaveTextContent('Liked')
      expect(likeBtn).not.toBeDisabled()
    })
  })

  test('submits a new comment successfully', async () => {
    const mockNewComment = { id: 2, content: 'Very neat!', authorUsername: 'jim' };
    (videoService.addComment as jest.Mock).mockResolvedValueOnce(mockNewComment)

    render(<VideoPage />)

    await screen.findByText('Testing VideoPage')

    const textarea = screen.getByPlaceholderText('Add a comment…')
    fireEvent.change(textarea, { target: { value: 'Very neat!' } })

    const commentSubmitBtn = screen.getByRole('button', { name: /^comment$/i })
    fireEvent.click(commentSubmitBtn)

    await waitFor(() => {
      expect(videoService.addComment).toHaveBeenCalledWith(12, 'Very neat!')
      expect(screen.getByText('Very neat!')).toBeInTheDocument()
      expect(textarea).toHaveValue('')
    })
  })

  test('renders error state if video fetch fails', async () => {
    (videoService.getVideoById as jest.Mock).mockRejectedValueOnce(new Error('Video unavailable'))

    render(<VideoPage />)

    await waitFor(() => {
      expect(screen.getByText('Video unavailable')).toBeInTheDocument()
    })
  })
})
