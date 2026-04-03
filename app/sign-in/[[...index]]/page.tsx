import { SignIn as ClerkSignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/50">
      <div className="w-full max-w-md px-4">
        <ClerkSignIn />
      </div>
    </div>
  )
}
