import { SignUp as ClerkSignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/50">
      <div className="w-full max-w-md px-4">
        <ClerkSignUp />
      </div>
    </div>
  )
}
