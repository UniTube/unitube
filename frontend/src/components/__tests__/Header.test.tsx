import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Header from '../Header'
import authService from '../../services/authService'

const mockNavigate = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, jest.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

const mockToggleTheme = jest.fn()
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggle: mockToggleTheme,
  }),
}))

jest.mock('../../services/authService')

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  test('renders Sign In link when user is unauthenticated', () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false)

    render(<Header />)

    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /upload video/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /go live/i })).not.toBeInTheDocument()
  })

  test('renders navigation controls when user is authenticated', () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true)

    render(<Header onUpload={jest.fn()} onGoLiveClick={jest.fn()} isLive={false} />)

    expect(screen.getByRole('button', { name: /upload video/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go live/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument()
  })

  test('shows live status indicator when stream is active', () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true)

    render(<Header onUpload={jest.fn()} onGoLiveClick={jest.fn()} isLive={true} />)

    expect(screen.getByText(/you are live/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /go live/i })).not.toBeInTheDocument()
  })

  test('toggles the application theme', () => {
    render(<Header />)

    const themeBtn = screen.getByLabelText(/switch to/i)
    fireEvent.click(themeBtn)

    expect(mockToggleTheme).toHaveBeenCalled()
  })

  test('handles searching query submission', () => {
    render(<Header />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'learn rust' } })

    const searchForm = screen.getByPlaceholderText(/search/i).closest('form')!
    fireEvent.submit(searchForm)

    expect(mockNavigate).toHaveBeenCalledWith('/?search=learn%20rust')
  })

  test('handles logout process', () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true)

    render(<Header onUpload={jest.fn()} />)

    const logoutBtn = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutBtn)

    expect(authService.removeToken).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
