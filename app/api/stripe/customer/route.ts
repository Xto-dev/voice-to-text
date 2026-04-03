import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateStripeCustomer } from '@/lib/stripe-utils'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, name } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(email, name)

    // Ensure user exists in DB (should exist after Clerk signup)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      // Create user record if it doesn't exist
      await prisma.user.create({
        data: {
          id: userId,
          email,
          name: name || undefined,
        },
      })
    }

    // Create subscription record if it doesn't exist
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeCustomerId: customer.id },
    })

    if (!existingSubscription) {
      await prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId: customer.id,
          status: 'free',
        },
      })
    }

    return NextResponse.json({
      customerId: customer.id,
      email: customer.email,
    })
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
