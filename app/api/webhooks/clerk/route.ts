import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

// Clerk webhook secret
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  try {
    const svix_id = req.headers.get('svix-id')
    const svix_timestamp = req.headers.get('svix-timestamp')
    const svix_signature = req.headers.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: 'Invalid headers' }, { status: 400 })
    }

    const body = await req.text()
    const wh = new Webhook(webhookSecret)

    let evt

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as any
    } catch (err) {
      console.error('Webhook verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle user.created event
    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data

      // Create user in database
      await prisma.user.create({
        data: {
          id,
          email: email_addresses[0]?.email_address || '',
          name: `${first_name || ''} ${last_name || ''}`.trim() || undefined,
        },
      })

      console.log(`User created: ${id}`)
    }

    // Handle user.updated event
    if (evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data

      await prisma.user.update({
        where: { id },
        data: {
          email: email_addresses[0]?.email_address || '',
          name: `${first_name || ''} ${last_name || ''}`.trim() || undefined,
        },
      })

      console.log(`User updated: ${id}`)
    }

    // Handle user.deleted event
    if (evt.type === 'user.deleted') {
      const { id } = evt.data

      // Delete all associated data via cascade
      await prisma.user.delete({
        where: { id },
      })

      console.log(`User deleted: ${id}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Clerk webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
