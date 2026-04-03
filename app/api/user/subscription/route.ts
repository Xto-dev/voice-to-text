import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    // If no subscription exists, return default free status
    if (!subscription) {
      return NextResponse.json({
        status: 'free',
        isActive: false,
        currentPeriodEnd: null,
      })
    }

    const isActive = ['active', 'trial'].includes(subscription.status)

    return NextResponse.json({
      status: subscription.status,
      isActive,
      currentPeriodEnd: subscription.currentPeriodEnd,
      priceId: subscription.priceId,
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}
