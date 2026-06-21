import { uploadStreamRecording } from '../recordingUpload'
import videoService from '../../services/videoService'

jest.mock('../../services/videoService', () => ({
  uploadVideo: jest.fn(),
}))

describe('uploadStreamRecording', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('constructs File and calls videoService.uploadVideo with webm extension', async () => {
    const mockBlob = new Blob(['webm-data'], { type: 'video/webm' })
    const mockUploadResponse = {
      id: 42,
      authorId: 10,
      title: 'My Recorded Live',
      size: '1.2 MB',
      uploadedAt: '2026-06-21 12:00:00',
      description: 'Recorded from live stream',
      author: 'Bob',
      url: '/videos/42',
    }
    ;(videoService.uploadVideo as jest.Mock).mockResolvedValueOnce(mockUploadResponse)

    const result = await uploadStreamRecording(mockBlob, 'My Recorded Live')

    expect(videoService.uploadVideo).toHaveBeenCalledWith({
      title: 'My Recorded Live',
      description: 'Recorded from live stream',
      file: expect.any(File),
    })

    const passedFile = (videoService.uploadVideo as jest.Mock).mock.calls[0][0].file
    expect(passedFile.name).toBe('My Recorded Live.webm')
    expect(passedFile.type).toBe('video/webm')

    expect(result).toEqual({
      id: 42,
      authorId: 10,
      title: 'My Recorded Live',
      size: '1.2 MB',
      uploadedAt: '2026-06-21 12:00:00',
      description: 'Recorded from live stream',
      author: 'Bob',
      url: '/videos/42',
    })
  })

  test('constructs File and calls videoService.uploadVideo with mp4 extension if not webm', async () => {
    const mockBlob = new Blob(['mp4-data'], { type: 'video/mp4' })
    const mockUploadResponse = {
      id: 43,
      authorId: 11,
      title: 'Another Recorded Live',
      size: '2.5 MB',
      uploadedAt: '2026-06-21 13:00:00',
      description: 'Custom description',
      author: 'Charlie',
      url: '/videos/43',
    }
    ;(videoService.uploadVideo as jest.Mock).mockResolvedValueOnce(mockUploadResponse)

    const result = await uploadStreamRecording(
      mockBlob,
      'Another Recorded Live',
      'Custom description',
    )

    expect(videoService.uploadVideo).toHaveBeenCalledWith({
      title: 'Another Recorded Live',
      description: 'Custom description',
      file: expect.any(File),
    })

    const passedFile = (videoService.uploadVideo as jest.Mock).mock.calls[0][0].file
    expect(passedFile.name).toBe('Another Recorded Live.mp4')
    expect(passedFile.type).toBe('video/mp4')

    expect(result.id).toBe(43)
  })

  test('uses fallback title if name is empty', async () => {
    const mockBlob = new Blob(['data'], { type: 'video/mp4' })
    const mockUploadResponse = {
      id: 44,
      authorId: 12,
      title: 'Live stream recording',
      size: '1.0 MB',
      uploadedAt: '2026-06-21 14:00:00',
      description: 'Recorded from live stream',
      author: 'David',
      url: '/videos/44',
    }
    ;(videoService.uploadVideo as jest.Mock).mockResolvedValueOnce(mockUploadResponse)

    await uploadStreamRecording(mockBlob, '   ')

    const passedFile = (videoService.uploadVideo as jest.Mock).mock.calls[0][0].file
    expect(passedFile.name).toBe('Live stream recording.mp4')
  })
})

test('handles empty video', async () => {
  const mockBlob = new Blob([], { type: 'video/webm' })
  const mockUploadResponse = {
    id: 45,
    authorId: 13,
    title: 'Empty Recording',
    size: '0 MB',
    uploadedAt: '2026-06-21 15:00:00',
    description: 'Recorded from live stream',
    author: 'Eve',
    url: '/videos/45',
  }
  ;(videoService.uploadVideo as jest.Mock).mockResolvedValueOnce(mockUploadResponse)

  const result = await uploadStreamRecording(mockBlob, 'Empty Recording')

  expect(videoService.uploadVideo).toHaveBeenCalledWith({
    title: 'Empty Recording',
    description: 'Recorded from live stream',
    file: expect.any(File),
  })

  const passedFile = (videoService.uploadVideo as jest.Mock).mock.calls[0][0].file
  expect(passedFile.name).toBe('Empty Recording.webm')
  expect(passedFile.type).toBe('video/webm')

  expect(result).toEqual(mockUploadResponse)
})
