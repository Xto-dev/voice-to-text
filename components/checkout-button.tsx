'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe-utils'

interface CheckoutButtonProps {
  priceId: string
  planName: string
}

export function CheckoutButton({ priceId, planName }: CheckoutButtonProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
      alert('User not authenticated')
      return
    }

    setIsLoading(true)

    try {
      // Create or get Stripe customer
      const customerResponse = await fetch('/api/stripe/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.primaryEmailAddress.emailAddress,
          name: user.fullName || 'User',
        }),
      })

      if (!customerResponse.ok) {
        throw new Error('Failed to create customer')
      }

      const { customerId } = await customerResponse.json()

      // Create checkout session
      const checkoutResponse = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          priceId,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await checkoutResponse.json()

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full gap-2"
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      Subscribe to {planName}
    </Button>
  )
}
