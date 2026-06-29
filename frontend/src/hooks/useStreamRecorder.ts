import { useRef, useEffect, useCallback } from 'react'

const TIMESLICE_MS = 1000

function buildRecordingStream(stream: MediaStream): MediaStream | null {
  const tracks = stream.getTracks().filter((t) => t.readyState === 'live' && t.enabled)
  if (tracks.length === 0) return null
  return new MediaStream(tracks)
}

function getSupportedMimeType(recordingStream: MediaStream): string {
  const hasVideo = recordingStream.getVideoTracks().length > 0
  const hasAudio = recordingStream.getAudioTracks().length > 0

  if (hasVideo) {
    const videoTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ]
    const match = videoTypes.find((t) => MediaRecorder.isTypeSupported(t))
    if (match) return match
  }

  if (hasAudio) {
    const audioTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg']
    const match = audioTypes.find((t) => MediaRecorder.isTypeSupported(t))
    if (match) return match
  }

  return ''
}

function defaultBlobType(recordingStream: MediaStream | null): string {
  if (!recordingStream) return 'video/webm'
  if (recordingStream.getVideoTracks().length > 0) return 'video/webm'
  return 'audio/webm'
}

export function useStreamRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const stoppingRef = useRef(false)
  const recordingStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!stream) return

    chunksRef.current = []
    stoppingRef.current = false

    const recordingStream = buildRecordingStream(stream)
    recordingStreamRef.current = recordingStream
    if (!recordingStream) return

    const mimeType = getSupportedMimeType(recordingStream)
    let recorder: MediaRecorder
    try {
      recorder = mimeType
        ? new MediaRecorder(recordingStream, { mimeType })
        : new MediaRecorder(recordingStream)
    } catch {
      recorder = new MediaRecorder(recordingStream)
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.start(TIMESLICE_MS)
    recorderRef.current = recorder

    return () => {
      if (stoppingRef.current) return
      recorderRef.current = null
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }, [stream])

  const stopRecording = useCallback((): Promise<Blob> => {
    stoppingRef.current = true

    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current
      const fallbackType = defaultBlobType(recordingStreamRef.current)

      const finalize = () => {
        const type =
          recorder?.mimeType ||
          chunksRef.current[0]?.type ||
          (recordingStreamRef.current ? getSupportedMimeType(recordingStreamRef.current) : '') ||
          fallbackType
        resolve(new Blob(chunksRef.current, { type }))
      }

      if (!recorder || recorder.state === 'inactive') {
        finalize()
        return
      }

      recorder.onstop = () => {
        recorderRef.current = null
        finalize()
      }

      recorder.onerror = () => {
        reject(new Error('Recording failed'))
      }

      try {
        if (recorder.state === 'recording') {
          recorder.requestData()
        }
        recorder.stop()
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Recording failed'))
      }
    })
  }, [])

  return { stopRecording }
}
