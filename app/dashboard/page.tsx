import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { prisma } from '@/lib/prisma'
import { VoiceChat } from '@/components/voice-chat'
import { RecordingsList } from '@/components/recordings-list'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in?redirect_url=/dashboard')
  }

  // Fetch user subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  // Fetch user's recordings
  const recordings = await prisma.recording.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Fetch user's messages for last recording
  const lastRecording = recordings[0]
  const messages = lastRecording
    ? await prisma.message.findMany({
        where: { recordingId: lastRecording.id },
        orderBy: { createdAt: 'asc' },
      })
    : []

  const subscriptionStatus = subscription?.status || 'free'
  const isActive = ['active', 'trial'].includes(subscriptionStatus)

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            {isActive
              ? 'Welcome back! Start recording to get transcriptions and chat.'
              : 'Upgrade to unlock unlimited transcriptions.'}
          </p>
        </div>

        {/* Subscription Status */}
        <Card className="mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subscription Status</p>
                <p className="text-lg font-semibold capitalize">
                  {subscriptionStatus}
                  {subscription?.currentPeriodEnd && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      • Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
              {!isActive && (
                <a href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Upgrade →
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        {isActive && (
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="chat">Voice Chat</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Voice Chat Tab */}
            <TabsContent value="chat" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Voice Chat</CardTitle>
                  <CardDescription>
                    Record a message, get transcription, and chat with AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VoiceChat
                    lastRecordingId={lastRecording?.id}
                    initialMessages={messages}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recording History</CardTitle>
                  <CardDescription>
                    All your transcriptions and chats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecordingsList recordings={recordings} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Upgrade CTA */}
        {!isActive && (
          <Card className="text-center py-12">
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Upgrade to Pro</h2>
                <p className="text-muted-foreground mb-6">
                  Get unlimited transcriptions, AI chat, and full recording history.
                </p>
              </div>
              <a href="/pricing">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition">
                  View Plans
                </button>
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
