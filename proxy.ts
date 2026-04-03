import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/user(.*)',
  '/api/recordings(.*)',
])

// Public API routes that don't require auth
const isPublicAPI = createRouteMatcher([
  '/api/transcribe',
  '/api/stripe/webhook',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const { pathname } = req.nextUrl

  // Allow all public API routes
  if (isPublicAPI(req)) {
    return NextResponse.next()
  }

  // Protect dashboard and user/recording routes
  if (isProtectedRoute(req)) {
    if (!userId) {
      // Redirect to sign-in, then to the original URL after auth
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
