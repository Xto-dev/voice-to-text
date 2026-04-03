import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { CheckoutButton } from '@/components/checkout-button'

const plans = [
  {
    name: 'Free',
    priceId: null,
    price: 0,
    description: 'Perfect for testing',
    features: [
      'One free transcription',
      'Basic audio quality',
      'Limited to 30 seconds',
      '30-day retention',
    ],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    name: 'Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
    price: 9.99,
    description: 'For regular users',
    features: [
      'Unlimited transcriptions',
      'High audio quality',
      'Unlimited duration',
      'Full history retention',
      'AI chat responses',
      'Priority support',
    ],
    cta: 'Subscribe Now',
    highlight: true,
  },
  {
    name: 'Enterprise',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE,
    price: 49.99,
    description: 'For teams and power users',
    features: [
      'Everything in Pro',
      'Team accounts',
      'API access',
      'Custom integration',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
]

export default async function PricingPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in?redirect_url=/pricing')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for you
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <Card
              key={idx}
              className={`flex flex-col transition-all ${
                plan.highlight
                  ? 'ring-2 ring-primary shadow-lg scale-105'
                  : ''
              }`}
            >
              {plan.highlight && (
                <div className="bg-primary text-primary-foreground py-2 px-4 text-center font-semibold text-sm">
                  Most Popular
                </div>
              )}

              <CardHeader className="flex-1">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>

                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold">
                    ${plan.price}
                    <span className="text-lg font-normal text-muted-foreground">
                      {plan.price > 0 ? '/month' : ''}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex gap-2 items-start">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.priceId ? (
                  <CheckoutButton priceId={plan.priceId} planName={plan.name} />
                ) : (
                  <Button variant="outline" disabled className="w-full">
                    {plan.cta}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-2xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked</h2>

          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes, you can cancel your subscription at any time with no cancellation fees.',
            },
            {
              q: 'Do you offer refunds?',
              a: 'We offer a 7-day money-back guarantee if you\'re not satisfied.',
            },
            {
              q: 'What audio formats are supported?',
              a: 'We support MP3, WAV, WebM, M4A, and other common audio formats.',
            },
          ].map((faq, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="text-muted-foreground text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
