import { useRef, useEffect, useCallback } from 'react'

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

export function useStreamRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!stream) return

    chunksRef.current = []
    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.start(1000)
    recorderRef.current = recorder

    return () => {
      recorderRef.current = null
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
    }
  }, [stream])

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        const type = chunksRef.current[0]?.type || 'video/webm'
        resolve(new Blob(chunksRef.current, { type }))
        return
      }

      recorder.onstop = () => {
        const type = recorder.mimeType || chunksRef.current[0]?.type || 'video/webm'
        resolve(new Blob(chunksRef.current, { type }))
      }
      recorder.onerror = () => reject(new Error('Recording failed'))
      recorder.stop()
    })
  }, [])

  return { stopRecording }
}
