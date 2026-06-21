import { renderHook } from '@testing-library/react'
import { useStreamRecorder } from '../useStreamRecorder'

class MockMediaRecorder {
  stream: any
  options: any
  state = 'recording'
  mimeType = 'video/webm;codecs=vp9,opus'
  ondataavailable: any = null
  onstop: any = null
  onerror: any = null

  static isTypeSupported = jest.fn().mockReturnValue(true)
  static instances: MockMediaRecorder[] = []

  constructor(stream: any, options: any) {
    this.stream = stream
    this.options = options
    MockMediaRecorder.instances.push(this)
  }

  start = jest.fn()
  stop = jest.fn(() => {
    this.state = 'inactive'
    if (this.onstop) this.onstop()
  })
}

global.MediaRecorder = MockMediaRecorder as any

describe('useStreamRecorder hook', () => {
  let mockStream: any

  beforeEach(() => {
    jest.clearAllMocks()
    MockMediaRecorder.instances = []
    mockStream = {
      getTracks: jest.fn().mockReturnValue([]),
    }
  })

  test('starts recording automatically on mount when stream is provided', () => {
    renderHook(() => useStreamRecorder(mockStream))

    expect(MockMediaRecorder.instances.length).toBe(1)
    const recorderInstance = MockMediaRecorder.instances[0]
    expect(recorderInstance.start).toHaveBeenCalledWith(1000)
    expect(recorderInstance.options).toEqual({ mimeType: 'video/webm;codecs=vp9,opus' })
  })

  test('does not start recording if stream is null', () => {
    renderHook(() => useStreamRecorder(null))

    expect(MockMediaRecorder.instances.length).toBe(0)
  })

  test('collects recording chunks on data available and resolves them in stopRecording', async () => {
    const { result } = renderHook(() => useStreamRecorder(mockStream))

    const recorderInstance = MockMediaRecorder.instances[0]

    // Simulate chunk events
    const chunk1 = new Blob(['chunk1-content'], { type: 'video/webm' })
    const chunk2 = new Blob(['chunk2-content'], { type: 'video/webm' })
    recorderInstance.ondataavailable({ data: chunk1 })
    recorderInstance.ondataavailable({ data: chunk2 })

    // Stop recording
    const stopPromise = result.current.stopRecording()

    // Trigger recorder stop
    recorderInstance.stop()

    const resolvedBlob = await stopPromise

    expect(recorderInstance.stop).toHaveBeenCalled()
    expect(resolvedBlob).toBeInstanceOf(Blob)
    expect(resolvedBlob.type).toBe('video/webm;codecs=vp9,opus')
  })

  test('handles stopRecording when recorder is already inactive', async () => {
    const { result } = renderHook(() => useStreamRecorder(mockStream))

    const recorderInstance = MockMediaRecorder.instances[0]
    recorderInstance.state = 'inactive'

    // Add a chunk
    const chunk1 = new Blob(['chunk1-content'], { type: 'video/webm' })
    recorderInstance.ondataavailable({ data: chunk1 })

    const resolvedBlob = await result.current.stopRecording()

    expect(recorderInstance.stop).not.toHaveBeenCalled()
    expect(resolvedBlob).toBeInstanceOf(Blob)
  })
})
