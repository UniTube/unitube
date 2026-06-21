import authService from '../authService'

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  test('login sends credentials and returns response', async () => {
    const mockResponse = { token: 'token-abc', user: { id: 1, email: 'user@test.com' } }
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const credentials = { email: 'user@test.com', password: 'password123' }
    const result = await authService.login(credentials)

    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    expect(result).toEqual(mockResponse)
  })

  test('login throws error on failure response', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid password' }),
    })

    await expect(authService.login({ email: 'u@t.com', password: 'p' })).rejects.toThrow(
      'Invalid password',
    )
  })

  test('register sends userData and returns response', async () => {
    const mockUser = {
      id: 1,
      name: 'John',
      surname: 'Doe',
      email: 'john@test.com',
      password: 'password',
    }
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    })

    const result = await authService.register(mockUser)

    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockUser),
    })
    expect(result).toEqual(mockUser)
  })

  test('token and user storage operations', () => {
    authService.saveToken('token-xyz')
    expect(authService.getToken()).toBe('token-xyz')

    const mockUser = {
      id: 10,
      name: 'Alice',
      surname: 'Smith',
      email: 'alice@test.com',
      password: '',
    }
    authService.saveUser(mockUser)
    expect(authService.getUser()).toEqual(mockUser)
    expect(authService.isAuthenticated()).toBe(true)

    expect(authService.getAuthHeaders()).toEqual({ Authorization: 'Bearer token-xyz' })

    authService.removeToken()
    expect(authService.getToken()).toBeNull()
    expect(authService.getUser()).toBeNull()
    expect(authService.isAuthenticated()).toBe(false)
    expect(authService.getAuthHeaders()).toEqual({})
  })

  test('authenticatedFetch appends Bearer token', async () => {
    authService.saveToken('token-abc')
    global.fetch = jest.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
    })

    await authService.authenticatedFetch('http://example.com/api', { method: 'GET' })

    const lastFetchOptions = (global.fetch as jest.Mock).mock.calls[0][1]
    expect(lastFetchOptions.headers.get('Authorization')).toBe('Bearer token-abc')
    expect(lastFetchOptions.headers.get('Accept')).toBe('application/json')
  })

  test('authenticatedFetch clears session on 401 response', async () => {
    authService.saveToken('token-expired')
    authService.saveUser({ id: 1, name: 'E', surname: 'X', email: 'e@x.com', password: '' })

    global.fetch = jest.fn().mockResolvedValueOnce({
      status: 401,
      ok: false,
    })

    await expect(authService.authenticatedFetch('http://example.com/api')).rejects.toThrow(
      'Session expired',
    )

    expect(authService.getToken()).toBeNull()
    expect(authService.getUser()).toBeNull()
  })
})

test('logout clears session', () => {
  authService.saveToken('token-to-clear')
  authService.saveUser({ id: 2, name: 'F', surname: 'G', email: 'f@g.com', password: '' })

  authService.logout()

  expect(authService.getToken()).toBeNull()
  expect(authService.getUser()).toBeNull()
})
