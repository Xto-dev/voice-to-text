'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Mic, Square } from 'lucide-react'

interface TranscriptionResult {
  success: boolean
  transcription: string
  requiresAuth?: boolean
  isFree?: boolean
  recordingId?: string
  error?: string
}

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState<string>('')
  const [error, setError] = useState<string>('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const router = useRouter()

  // Start recording
  const startRecording = async () => {
    try {
      setError('')
      setTranscription('')

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording'
      setError(`Microphone error: ${message}`)
    }
  }

  // Stop recording and transcribe
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return

    setIsRecording(false)
    mediaRecorderRef.current.stop()

    setIsTranscribing(true)

    // Wait for ondataavailable to be called
    setTimeout(async () => {
      try {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', audioBlob)

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        })

        const data: TranscriptionResult = await response.json()

        if (!response.ok) {
          if (data.requiresAuth) {
            setError('Free transcription used. Please sign in to continue.')
            // Redirect to sign-in
            setTimeout(() => router.push('/sign-in?redirect_url=/pricing'), 1000)
            return
          }
          throw new Error(data.error || 'Transcription failed')
        }

        setTranscription(data.transcription)
        chunksRef.current = []
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transcription failed'
        setError(message)
      } finally {
        setIsTranscribing(false)
      }
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <div className="flex gap-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={isTranscribing}
            size="lg"
            className="gap-2"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            disabled={isTranscribing}
            size="lg"
            variant="destructive"
            className="gap-2"
          >
            <Square className="w-5 h-5" />
            Stop Recording
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isTranscribing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Transcribing your audio...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Transcription Result */}
      {transcription && (
        <div className="p-4 bg-secondary rounded-lg">
          <p className="text-sm font-medium text-foreground/70 mb-2">Transcription</p>
          <p className="text-base leading-relaxed">{transcription}</p>
        </div>
      )}
    </div>
  )
}
