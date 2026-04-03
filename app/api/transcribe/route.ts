import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { transcribeAudio } from '@/lib/openai-utils'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    // Get FormData with audio blob
    const formData = await req.formData()
    const audioBlob = formData.get('audio') as Blob | null
    
    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
    }

    // Convert Blob to Buffer
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    // If not authenticated, check for free use (localStorage cookie-based)
    if (!userId) {
      const freeUseKey = 'voice-to-text-free-used'
      const cookies = req.headers.get('cookie')
      const hasFreeUsed = cookies?.includes(`${freeUseKey}=true`)

      if (hasFreeUsed) {
        return NextResponse.json(
          { 
            error: 'Free transcription limit exceeded. Please sign in to continue.',
            requiresAuth: true,
          },
          { status: 403 }
        )
      }

      // Allow free transcription
      const transcription = await transcribeAudio(audioBuffer)

      const response = NextResponse.json({
        success: true,
        transcription,
        isFree: true,
      })

      // Set cookie to track free use
      response.cookies.set(freeUseKey, 'true', {
        maxAge: 86400 * 365, // 1 year
        httpOnly: true,
        sameSite: 'lax',
      })

      return response
    }

    // Authenticated user: transcribe and save to DB
    const transcription = await transcribeAudio(audioBuffer)

    // Verify subscription status
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription || subscription.status === 'free' || subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription required for additional transcriptions' },
        { status: 403 }
      )
    }

    // Save recording to database
    const recording = await prisma.recording.create({
      data: {
        userId,
        audioUrl: '', // TODO: Upload to Supabase and get URL
        transcription,
      },
    })

    return NextResponse.json({
      success: true,
      transcription,
      recordingId: recording.id,
    })
  } catch (error) {
    console.error('Transcribe API error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}
