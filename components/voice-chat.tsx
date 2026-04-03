'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Mic, Square, Send } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface VoiceChatProps {
  lastRecordingId?: string
  initialMessages: any[]
}

export function VoiceChat({ lastRecordingId, initialMessages }: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((msg: any) => ({
      ...msg,
      createdAt: new Date(msg.createdAt),
    }))
  )
  const [error, setError] = useState<string>('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const element = scrollRef.current as any
      if (element.scrollIntoViewIfNeeded) {
        element.scrollIntoViewIfNeeded({ behavior: 'smooth' })
      } else {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages])

  const startRecording = async () => {
    try {
      setError('')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording'
      setError(`Microphone error: ${message}`)
    }
  }

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

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Transcription failed')
        }

        // Add user message
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: data.transcription,
          createdAt: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        chunksRef.current = []

        // Generate AI response
        await generateResponse(data.transcription)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transcription failed'
        setError(message)
      } finally {
        setIsTranscribing(false)
      }
    }, 100)
  }

  const generateResponse = async (transcription: string) => {
    setIsResponding(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcription,
          recordingId: lastRecordingId,
          history: messages,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response')
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate response'
      setError(message)
    } finally {
      setIsResponding(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    await generateResponse(content)
  }

  return (
    <div className="space-y-6">
      {/* Chat Messages */}
      <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/50">
        <div className="space-y-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No messages yet. Start by recording or typing something.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-200 dark:bg-gray-800 text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}

          {isResponding && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex gap-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={isTranscribing || isResponding}
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            Record
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            disabled={isTranscribing || isResponding}
            variant="destructive"
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
        )}

        {isTranscribing && (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Transcribing...
          </span>
        )}
      </div>

      {/* Text Input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Or type a message..."
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              const value = e.currentTarget.value
              handleSendMessage(value)
              e.currentTarget.value = ''
            }
          }}
        />
        <Button
          onClick={(e) => {
            const textarea = (e.currentTarget.previousElementSibling as HTMLTextAreaElement)
            const value = textarea.value
            handleSendMessage(value)
            textarea.value = ''
          }}
          disabled={isTranscribing || isResponding}
          className="gap-2 self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
