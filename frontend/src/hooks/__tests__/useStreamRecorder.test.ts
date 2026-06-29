import { renderHook } from '@testing-library/react'
import { useStreamRecorder } from '../useStreamRecorder'

type MockTrack = {
  kind: 'video' | 'audio'
  enabled: boolean
  readyState: MediaStreamTrackState
}

class MockMediaRecorder {
  stream: MediaStream
  options: MediaRecorderOptions | undefined
  state: RecordingState = 'recording'
  mimeType = 'video/webm;codecs=vp9,opus'
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null

  static isTypeSupported = jest.fn((type: string) => type.startsWith('video/') || type.startsWith('audio/'))
  static instances: MockMediaRecorder[] = []

  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    this.stream = stream
    this.options = options
    MockMediaRecorder.instances.push(this)
  }

  start = jest.fn()
  requestData = jest.fn()
  stop = jest.fn(() => {
    this.state = 'inactive'
    this.onstop?.()
  })
}

class MockMediaStream {
  private tracks: MockTrack[]

  constructor(tracks: MockTrack[] = []) {
    this.tracks = tracks
  }

  getTracks(): MediaStreamTrack[] {
    return this.tracks as unknown as MediaStreamTrack[]
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === 'video') as unknown as MediaStreamTrack[]
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === 'audio') as unknown as MediaStreamTrack[]
  }
}

function createMockStream(tracks: MockTrack[]): MediaStream {
  const recordingStream = new MockMediaStream(tracks)
  return {
    getTracks: () => recordingStream.getTracks(),
    getVideoTracks: () => recordingStream.getVideoTracks(),
    getAudioTracks: () => recordingStream.getAudioTracks(),
  } as MediaStream
}

beforeAll(() => {
  globalThis.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder
  globalThis.MediaStream = MockMediaStream as unknown as typeof MediaStream
})

describe('useStreamRecorder hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    MockMediaRecorder.instances = []
  })

  test('starts recording automatically on mount when stream is provided', () => {
    const stream = createMockStream([{ kind: 'video', enabled: true, readyState: 'live' }])

    renderHook(() => useStreamRecorder(stream))

    expect(MockMediaRecorder.instances).toHaveLength(1)
    const recorderInstance = MockMediaRecorder.instances[0]
    expect(recorderInstance.start).toHaveBeenCalledWith(1000)
    expect(recorderInstance.options).toEqual({ mimeType: 'video/webm;codecs=vp9,opus' })
  })

  test('does not start recording if stream is null', () => {
    renderHook(() => useStreamRecorder(null))

    expect(MockMediaRecorder.instances).toHaveLength(0)
  })

  test('collects recording chunks on data available and resolves them in stopRecording', async () => {
    const stream = createMockStream([{ kind: 'video', enabled: true, readyState: 'live' }])
    const { result } = renderHook(() => useStreamRecorder(stream))

    const recorderInstance = MockMediaRecorder.instances[0]

    const chunk1 = new Blob(['chunk1-content'], { type: 'video/webm' })
    const chunk2 = new Blob(['chunk2-content'], { type: 'video/webm' })
    recorderInstance.ondataavailable?.({ data: chunk1 } as BlobEvent)
    recorderInstance.ondataavailable?.({ data: chunk2 } as BlobEvent)

    const resolvedBlob = await result.current.stopRecording()

    expect(recorderInstance.requestData).toHaveBeenCalled()
    expect(recorderInstance.stop).toHaveBeenCalled()
    expect(resolvedBlob).toBeInstanceOf(Blob)
    expect(resolvedBlob.type).toBe('video/webm;codecs=vp9,opus')
  })

  test('handles stopRecording when recorder is already inactive', async () => {
    const stream = createMockStream([{ kind: 'video', enabled: true, readyState: 'live' }])
    const { result } = renderHook(() => useStreamRecorder(stream))

    const recorderInstance = MockMediaRecorder.instances[0]
    recorderInstance.state = 'inactive'

    const chunk1 = new Blob(['chunk1-content'], { type: 'video/webm' })
    recorderInstance.ondataavailable?.({ data: chunk1 } as BlobEvent)

    const resolvedBlob = await result.current.stopRecording()

    expect(recorderInstance.stop).not.toHaveBeenCalled()
    expect(resolvedBlob).toBeInstanceOf(Blob)
  })

  test('records audio-only when video track is disabled', () => {
    const stream = createMockStream([
      { kind: 'video', enabled: false, readyState: 'live' },
      { kind: 'audio', enabled: true, readyState: 'live' },
    ])

    renderHook(() => useStreamRecorder(stream))

    expect(MockMediaRecorder.instances).toHaveLength(1)
    const recorderInstance = MockMediaRecorder.instances[0]
    expect(recorderInstance.stream.getVideoTracks()).toHaveLength(0)
    expect(recorderInstance.stream.getAudioTracks()).toHaveLength(1)
    expect(recorderInstance.options?.mimeType).toMatch(/^audio\//)
  })

  test('does not start recorder when all tracks are disabled', () => {
    const stream = createMockStream([{ kind: 'video', enabled: false, readyState: 'live' }])

    renderHook(() => useStreamRecorder(stream))

    expect(MockMediaRecorder.instances).toHaveLength(0)
  })
})
