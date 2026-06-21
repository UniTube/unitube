import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '../LoginPage'
import authService from '../../services/authService'

const mockNavigate = jest.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockLocationState: any = null

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: mockLocationState,
  }),
}))

jest.mock('../../services/authService')

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocationState = null
  })

  test('renders login form with all inputs and submit button', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sich einloggen/i })).toBeInTheDocument()
  })

  test('displays session message from navigation state if present', () => {
    mockLocationState = { message: 'Bitte einloggen' }
    render(<LoginPage />)
    expect(screen.getByText('Bitte einloggen')).toBeInTheDocument()
  })

  test('calls authService.login and navigates on successful submit', async () => {
    const mockResponse = { token: 'mock-token', user: { id: 1, email: 'test@test.com' } }
    ;(authService.login as jest.Mock).mockResolvedValueOnce(mockResponse)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /sich einloggen/i }))

    expect(screen.getByRole('button', { name: /verbindung.../i })).toBeDisabled()

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      })
      expect(authService.saveToken).toHaveBeenCalledWith('mock-token')
      expect(authService.saveUser).toHaveBeenCalledWith(mockResponse.user)
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  test('shows error message on login failure', async () => {
    ;(authService.login as jest.Mock).mockRejectedValueOnce(new Error('Ungültige Anmeldedaten'))

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'wrong-password' },
    })

    fireEvent.click(screen.getByRole('button', { name: /sich einloggen/i }))

    await waitFor(() => {
      expect(screen.getByText('Ungültige Anmeldedaten')).toBeInTheDocument()
    })
  })
})
