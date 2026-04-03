import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-utils'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import Stripe from 'stripe'

// Stripe webhook secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle checkout.session.completed
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.customer || !session.subscription) {
    console.log('Missing customer or subscription in session')
    return
  }

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  // Get customer from Stripe
  const customer = await stripe.customers.retrieve(customerId)

  // Check if customer is not deleted and has email
  if (customer.deleted || !customer.email) {
    console.error('Customer deleted or has no email')
    return
  }

  // Get subscription details
  const sub = await stripe.subscriptions.retrieve(subscriptionId as string)
  const subscription = sub as any

  // Find or create user subscription
  let userSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!userSubscription) {
    // Find user by email (assumes user exists after Clerk signup)
    const user = await prisma.user.findUnique({
      where: { email: customer.email },
    })

    if (!user) {
      console.error(`User not found for email: ${customer.email}`)
      return
    }

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null

    userSubscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: customerId,
        stripeSubId: subscriptionId as string,
        status: subscription.status,
        priceId: subscription.items?.data[0]?.price.id || undefined,
        currentPeriodEnd: periodEnd,
      },
    })
  } else {
    // Update existing subscription
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null

    userSubscription = await prisma.subscription.update({
      where: { id: userSubscription.id },
      data: {
        stripeSubId: subscriptionId as string,
        status: subscription.status,
        priceId: subscription.items?.data[0]?.price.id || undefined,
        currentPeriodEnd: periodEnd,
      },
    })
  }

  console.log(`Subscription created/updated for customer: ${customerId}`)
}

// Handle customer.subscription.updated
async function handleSubscriptionUpdated(subscription: any) {
  const customerId = subscription.customer as string

  const userSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!userSubscription) {
    console.log(`Subscription not found for customer: ${customerId}`)
    return
  }

  // Update subscription status
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null

  await prisma.subscription.update({
    where: { id: userSubscription.id },
    data: {
      status: subscription.status,
      currentPeriodEnd: periodEnd,
    },
  })

  console.log(`Subscription updated for customer: ${customerId}`)
}

// Handle invoice.payment_failed
async function handlePaymentFailed(invoice: any) {
  const customerId = invoice.customer as string

  const userSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!userSubscription) {
    console.log(`Subscription not found for customer: ${customerId}`)
    return
  }

  // Update subscription status to past_due
  await prisma.subscription.update({
    where: { id: userSubscription.id },
    data: { status: 'past_due' },
  })

  console.log(`Payment failed for customer: ${customerId}`)
}

// Handle customer.subscription.deleted
async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer as string

  const userSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!userSubscription) {
    console.log(`Subscription not found for customer: ${customerId}`)
    return
  }

  // Update subscription status to canceled
  await prisma.subscription.update({
    where: { id: userSubscription.id },
    data: {
      status: 'canceled',
      stripeSubId: null,
    },
  })

  console.log(`Subscription canceled for customer: ${customerId}`)
}
