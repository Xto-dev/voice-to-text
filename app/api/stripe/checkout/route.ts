import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createCheckoutSession } from '@/lib/stripe-utils'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { customerId, priceId, successUrl, cancelUrl } = await req.json()

    if (!customerId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
