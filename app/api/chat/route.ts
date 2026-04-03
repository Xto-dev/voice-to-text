import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateChatResponse } from '@/lib/openai-utils'
import { prisma } from '@/lib/prisma'

interface ChatRequest {
  message: string
  recordingId?: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, recordingId, history }: ChatRequest = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Check subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription || !['active', 'trial'].includes(subscription.status)) {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      )
    }

    // Generate response using OpenAI
    const response = await generateChatResponse(message, history)

    // Save message to database if recordingId provided
    if (recordingId) {
      // Save user message
      await prisma.message.create({
        data: {
          userId,
          recordingId,
          role: 'user',
          content: message,
        },
      })

      // Save assistant response
      await prisma.message.create({
        data: {
          userId,
          recordingId,
          role: 'assistant',
          content: response,
        },
      })
    }

    return NextResponse.json({
      success: true,
      response,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
