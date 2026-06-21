import videoService from '../videoService'
import authService from '../authService'

jest.mock('../authService')

describe('VideoService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  test('uploadVideo throws if unauthenticated', async () => {
    ;(authService.isAuthenticated as jest.Mock).mockReturnValue(false)

    await expect(
      videoService.uploadVideo({
        title: 'Video',
        description: 'Desc',
        file: new File([''], 'v.mp4'),
      })
    ).rejects.toThrow('You must be logged in to upload a video')
  })

  test('uploadVideo calls authenticatedFetch with FormData and client ID', async () => {
    ;(authService.isAuthenticated as jest.Mock).mockReturnValue(true)
    ;(authService.getUser as jest.Mock).mockReturnValue({ id: 10, email: 't@t.com' })
    localStorage.setItem('ClientID', 'client-123')

    const mockResponse = {
      id: 45,
      title: 'Uploaded Video',
      description: 'Test Upload',
      authorId: 10,
      size: '2MB',
      uploadedAt: '2026-06-21',
      tags: ['Tech'],
    }

    const mockAuthFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })
    ;(authService.authenticatedFetch as jest.Mock) = mockAuthFetch

    const result = await videoService.uploadVideo({
      title: 'Uploaded Video',
      description: 'Test Upload',
      file: new File(['video-content'], 'test.mp4', { type: 'video/mp4' }),
      tags: ['Tech'],
    })

    expect(mockAuthFetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/videos', {
      method: 'POST',
      headers: { 'X-Client-ID': 'client-123' },
      body: expect.any(FormData),
    })

    const body = mockAuthFetch.mock.calls[0][1].body as FormData
    expect(body.get('title')).toBe('Uploaded Video')
    expect(body.get('description')).toBe('Test Upload')
    expect(body.get('authorId')).toBe('10')
    expect(body.getAll('tags')).toEqual(['Tech'])

    expect(result.id).toBe(45)
  })

  test('getVideos calls fetch and maps results', async () => {
    const mockVideos = [
      { id: 1, title: 'V1', size: '1MB', uploadedAt: '2026-06-21', author: 'A1', authorId: 1 },
    ]
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideos,
    })

    const result = await videoService.getVideos()

    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/videos', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    expect(result[0].title).toBe('V1')
  })

  test('getVideoById calls fetch and returns mapped video', async () => {
    const mockVideo = { id: 2, title: 'V2', size: '2MB', uploadedAt: '2026-06-21', author: 'A2', authorId: 2 }
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideo,
    })

    const result = await videoService.getVideoById(2)

    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/videos/2/metadata', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    expect(result.id).toBe(2)
  })

  test('deleteVideo calls authenticatedFetch with DELETE method', async () => {
    const mockAuthFetch = jest.fn().mockResolvedValueOnce({ ok: true })
    ;(authService.authenticatedFetch as jest.Mock) = mockAuthFetch

    await videoService.deleteVideo(99)

    expect(mockAuthFetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/videos/99', {
      method: 'DELETE',
    })
  })

  test('addComment throws if user is not logged in', async () => {
    ;(authService.getUser as jest.Mock).mockReturnValue(null)

    await expect(videoService.addComment(1, 'nice')).rejects.toThrow('You must be logged in to comment')
  })

  test('addComment calls authenticatedFetch with JSON body', async () => {
    ;(authService.getUser as jest.Mock).mockReturnValue({ id: 5 })
    const mockComment = { id: 1, content: 'nice', authorUsername: 'bob' }
    
    const mockAuthFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockComment,
    })
    ;(authService.authenticatedFetch as jest.Mock) = mockAuthFetch

    const result = await videoService.addComment(10, 'nice')

    expect(mockAuthFetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/videos/10/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'nice', videoId: 10, authorId: 5 }),
    })
    expect(result).toEqual(mockComment)
  })

  test('getComments fetches comment list', async () => {
    const mockComments = [{ id: 1, content: 'Comment 1', authorUsername: 'user1' }]
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockComments,
    })

    const result = await videoService.getComments(42)

    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/videos/42/comments', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    expect(result).toEqual(mockComments)
  })

  test('likeVideo calls authenticatedFetch with POST method', async () => {
    const mockAuthFetch = jest.fn().mockResolvedValueOnce({ ok: true })
    ;(authService.authenticatedFetch as jest.Mock) = mockAuthFetch

    await videoService.likeVideo(42)

    expect(mockAuthFetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/videos/42/like', {
      method: 'POST',
    })
  })

  test('filterVideos calls filter endpoint with query params', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    await videoService.filterVideos('tut', ['tech', 'fun'])

    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8088/api/v1/videos/filter?name=tut&tags=tech&tags=fun', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  })
})
