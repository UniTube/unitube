import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import RegisterPage from '../RegisterPage'
import authService from '../../services/authService'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../services/authService')

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders registration form fields', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText(/vorname/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nachname/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^passwort$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/passwort bestätigen/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sich registrieren/i })).toBeInTheDocument()
  })

  test('displays error when passwords do not match', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText(/vorname/i), { target: { value: 'Jean' } })
    fireEvent.change(screen.getByLabelText(/nachname/i), { target: { value: 'Dupont' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/^passwort$/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/passwort bestätigen/i), {
      target: { value: 'different' },
    })

    fireEvent.click(screen.getByRole('button', { name: /sich registrieren/i }))

    expect(screen.getByText('Die Passwörter stimmen nicht überein')).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
  })

  test('displays error when password is too short', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText(/^passwort$/i), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText(/passwort bestätigen/i), { target: { value: '123' } })

    fireEvent.click(screen.getByRole('button', { name: /sich registrieren/i }))

    expect(screen.getByText('The password must be at least 6 characters long')).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
  })

  test('calls authService.register and navigates to login on success', async () => {
    ;(authService.register as jest.Mock).mockResolvedValueOnce({})
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText(/vorname/i), { target: { value: 'Jean' } })
    fireEvent.change(screen.getByLabelText(/nachname/i), { target: { value: 'Dupont' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/^passwort$/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/passwort bestätigen/i), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /sich registrieren/i }))

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        id: null,
        name: 'Jean',
        surname: 'Dupont',
        email: 'test@test.com',
        password: 'password123',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
