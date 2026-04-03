import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { AudioRecorder } from '@/components/audio-recorder'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Voice to Text Made Simple
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Record your voice and get instant transcriptions powered by AI. 
            One free transcription to get started!
          </p>
        </div>

        {/* Main Recording Card */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Try It Now</CardTitle>
              <CardDescription>
                Record a message and we'll transcribe it for you instantly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioRecorder />
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎙️ Crystal Clear</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced audio processing for accurate transcriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚡ Instant Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get transcriptions in seconds, not minutes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔐 Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your voice data is encrypted and never shared
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Want unlimited transcriptions and AI chat? Sign up to unlock premium features
          </p>
          <div className="flex gap-4 justify-center">
            <SignInButton mode="modal">
              <Button variant="outline">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Sign Up Free</Button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </main>
  )
}
