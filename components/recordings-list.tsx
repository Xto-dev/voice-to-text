'use client'

import { Card } from '@/components/ui/card'
import { FileText } from 'lucide-react'

interface Recording {
  id: string
  transcription: string
  createdAt: Date | string
}

interface RecordingsListProps {
  recordings: Recording[]
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const time = typeof date === 'string' ? new Date(date) : date
  const milliseconds = now.getTime() - time.getTime()
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function RecordingsList({ recordings }: RecordingsListProps) {
  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">
          No recordings yet. Start by recording a voice message in the chat tab.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {recordings.map((recording) => (
        <Card key={recording.id} className="p-4 hover:bg-muted/50 transition cursor-pointer">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {recording.transcription || 'No transcription'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(recording.createdAt)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
