# Development Guide

## Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org)
- **PostgreSQL** — [Local setup](https://www.postgresql.org/download) or [Supabase](https://supabase.com)
- **Git** — [Download](https://git-scm.com)

---

## 🔧 Local Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd voice-to-text
npm install
```

### 2. Install Additional Dependencies

```bash
npm install stripe openai @prisma/client svix
```

### 3. Create `.env.local`

```bash
cp .env.example .env.local
```

Fill in your credentials (see [SETUP.md](SETUP.md) for details).

### 4. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create database schema
npx prisma migrate dev --name init

# (Optional) Open database UI
npx prisma studio
```

---

## 🚀 Running Locally

### Development Server

```bash
npm run dev
```

App will be at: http://localhost:3000

### Build & Check Type Errors

```bash
npm run build  # Catches TypeScript errors
npm run lint   # ESLint checks
```

---

## 🌐 Testing External Services

### Clerk Webhooks (Local)

1. **Install ngrok** (expose local server):
   ```bash
   npm install -g ngrok
   ngrok http 3000
   # Copy the https URL
   ```

2. **Update Clerk Webhook** in [Dashboard](https://dashboard.clerk.com):
   - Go to Integrations → Webhooks → Add endpoint
   - URL: `https://<your-ngrok-url>/api/webhooks/clerk`
   - Events: user.created, user.updated, user.deleted

3. **Test by signing up** in app — you should see:
   - New user in Prisma Studio
   - New subscription record

### Stripe Webhooks (Local)

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (chocolatey)
   choco install stripe-cli

   # Or download: https://github.com/stripe/stripe-cli
   ```

2. **Start webhook listener**:
   ```bash
   stripe login  # Authenticate
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   # Copy the webhook signing secret
   ```

3. **Add to `.env.local`**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. **Trigger test events**:
   ```bash
   # In another terminal
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.updated
   stripe trigger invoice.payment_failed
   ```

5. **Monitor logs** in development server terminal

---

## 🧪 Testing Workflows

### Manual Test: Free Transcription

```
1. Open http://localhost:3000
2. Record audio for 5+ seconds
3. Click "Stop Recording"
4. Wait for transcription
5. See result displayed
6. Try to record again → should see "requires auth" message
7. Check browser cookies for `voice-to-text-free-used`
```

### Manual Test: Auth & Subscription

```
1. Click "Sign In" on error message
2. Create account with Clerk
3. Should redirect to /dashboard automatically
4. Check Prisma Studio for new user/subscription
5. Go to /pricing
6. Click "Subscribe to Pro"
7. Enter Stripe test card: 4242 4242 4242 4242
8. Complete payment
9. Stripe webhook fires → should update subscription status
10. Redirect to /dashboard
11. Can now record unlimited
```

### Manual Test: Dashboard

```
1. Sign in (use same account)
2. Go to /dashboard
3. Record audio in Voice Chat tab
4. Type message in text input
5. See transcription + AI response
6. Go to History tab
7. See list of past recordings
```

---

## 🐛 Debugging

### Enable Verbose Logging

Add to `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Show all logs
})

export default prisma
```

### Check Database

```bash
npx prisma studio
# Opens UI to inspect/edit database records
```

### View Stripe Events

```bash
# After running: stripe listen ...
stripe events list
stripe events describe <event-id>
```

### Check Clerk Webhooks

```bash
# Dashboard → Integrations → Webhooks → Click endpoint
# View delivery logs and retry failed events
```

### Browser DevTools

```javascript
// Console commands
localStorage.getItem('voice-to-text-free-used') // Check free tier status
```

---

## 📝 Code Style & Conventions

### File Structure

```
components/
  ├── audio-recorder.tsx      (Client component, starts with verb)
  ├── navbar.tsx              (Client component)
  └── ui/                      (shadcn components)

lib/
  ├── prisma.ts               (Singletons)
  ├── stripe-utils.ts         (Helper functions)
  ├── types.ts                (Type definitions)
  ├── constants.ts            (Constants)
  └── errors.ts               (Error utilities)

app/
  ├── layout.tsx              (Server by default)
  ├── page.tsx                (Server by default)
  └── api/
      └── route.ts            (Server functions)
```

### Naming Conventions

```typescript
// Components (PascalCase)
export function AudioRecorder() {}

// Utilities (camelCase)
export function createErrorResponse() {}

// Constants (UPPER_SNAKE_CASE)
export const MAX_FILE_SIZE = 25 * 1024 * 1024

// Types (PascalCase)
export interface UserWithSubscription {}

// Exports: use named exports
export async function transcribeAudio() {}
export function AudioRecorder() {}
```

### Comments Style

```typescript
/**
 * Primary function comment (JSDoc)
 * @param audio - The audio blob to transcribe
 * @returns Transcribed text
 * @throws AppError if transcription fails
 */
export async function transcribeAudio(audio: Blob): Promise<string> {
  // Inline comment for complex logic
  const buffer = await audio.arrayBuffer()
  
  try {
    // Business logic
  } catch (error) {
    // Error handling with context
    logError(error, { context: 'transcribeAudio' })
  }
}
```

---

## 🔄 Git & Version Control

### Branch Strategy

```bash
# Main branch: production-ready code
git checkout main

# Feature branch: for development
git checkout -b feature/user-auth

# Fix branch: for bug fixes
git checkout -b fix/transcribe-error
```

### Commit Messages

```bash
# Format: <type>(<scope>): <message>
git commit -m "feat(transcribe): add audio upload progress"
git commit -m "fix(dashboard): fix message scroll issue"
git commit -m "docs(setup): add environment variables guide"
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 🚀 Optimization Tips

### Performance

```typescript
// Use React.memo for expensive components
export const VoiceChat = React.memo(function VoiceChat(props) {
  // ...
})

// Use useCallback for memoized callbacks
const handleRecord = useCallback(() => {
  // ...
}, [dependencies])

// Use Suspense for async components
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### Database

```typescript
// Always use select to limit fields
const users = await prisma.user.findMany({
  select: { id: true, email: true },
})

// Use include only when needed
const userWithSubs = await prisma.user.findUnique({
  where: { id: userId },
  include: { subscription: true },
})

// Use take/skip for pagination
const page1 = await prisma.recording.findMany({
  take: 10,
  skip: 0,
})
```

### API Response

```typescript
// Compress responses
// Add caching headers
export async function GET(req: NextRequest) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
```

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma generate     # Regenerate Prisma client
npx prisma migrate dev  # Create & apply migration
npx prisma db push      # Sync schema to DB
npx prisma studio      # Open database UI

# Git
git status              # Check uncommitted changes
git diff                # Show file changes
git log                 # View commit history
```

---

## 🆘 Common Issues & Solutions

### Issue: "PRISMA_DATABASE_URL not set"
```bash
# Solution: Add DATABASE_URL to .env.local
echo 'DATABASE_URL="postgresql://..."' >> .env.local
```

### Issue: "Cannot find module '@/components/...'"
```bash
# Solution: Restart dev server
# TypeScript path aliases need restart
npm run dev
```

### Issue: "Stripe webhook not triggering"
```bash
# Solution: Check webhook signature
# Verify STRIPE_WEBHOOK_SECRET is correct and matches Stripe dashboard
echo $STRIPE_WEBHOOK_SECRET
```

### Issue: "Transcription API 401 Unauthorized"
```bash
# Solution: Check OpenAI API key
# Verify it's not expired and has credits
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

---

## 📞 Need Help?

- **Next.js docs**: https://nextjs.org/docs
- **Clerk support**: https://clerk.com/support
- **Stripe docs**: https://stripe.com/docs
- **OpenAI docs**: https://platform.openai.com/docs
- **Issues**: Create a GitHub issue
