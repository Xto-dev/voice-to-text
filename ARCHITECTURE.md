# Architecture & Implementation Notes

## 🎯 System Design

### User Journey

1. **Unauthenticated User (Free Tier)**
   - Accesses `/` → `AudioRecorder` component
   - Records audio → `/api/transcribe` (no auth)
   - Backend checks `cookie:voice-to-text-free-used`
   - If not used: transcribe + set cookie
   - If used: return 403 with `requiresAuth: true`
   - Frontend redirects to `/sign-in?redirect_url=/pricing`

2. **Authenticated User (Paid Tier)**
   - Logs in via Clerk → webhook creates DB user
   - Redirects to `/pricing` → selects plan
   - Clicks "Subscribe" → calls `/api/stripe/customer` → `/api/stripe/checkout`
   - Stripe Checkout modal → payment
   - On success → Stripe webhook → updates subscription status → redirects to `/dashboard`
   - Can now access `/dashboard` with unlimited recordings

### Key State Flows

```
HOME PAGE:
┌──────────────────────────────────────┐
│ User can record (1 free attempt)     │
│ ↓                                    │
│ Transcribe button → /api/transcribe  │
│ ↓                                    │
│ Result OR requiresAuth: true         │
│ ├─ Success: show transcription       │
│ └─ Limit hit: redirect to /sign-in   │
└──────────────────────────────────────┘

AUTH FLOW:
┌──────────────────────────────────────┐
│ Sign In (Clerk modal)                │
│ ↓                                    │
│ Webhook: user.created                │
│ ├─ Create DB user                    │
│ └─ Create free subscription          │
│ ↓                                    │
│ Redirect to /pricing                 │
│ ├─ User selects plan                 │
│ └─ Stripe Checkout                   │
│ ↓                                    │
│ Stripe Webhook: checkout.completed   │
│ ├─ Create Stripe customer            │
│ ├─ Update subscription status        │
│ └─ Redirect to /dashboard            │
└──────────────────────────────────────┘

DASHBOARD:
┌──────────────────────────────────────┐
│ Voice Chat (VoiceChat component)     │
│ ├─ Record → /api/transcribe          │
│ ├─ Send to AI → /api/chat            │
│ └─ Save to DB + display              │
│ ↓                                    │
│ Chat History (RecordingsList)        │
│ ├─ Show all user recordings          │
│ └─ Click to show details             │
└──────────────────────────────────────┘
```

---

## 🔐 Security & Middleware

### Route Protection (middleware.ts)

```typescript
PUBLIC ROUTES:
  / (home)
  /pricing (anyone)
  /sign-in, /sign-up (Clerk handles)
  /api/transcribe (free + paid)
  /api/stripe/webhook (Stripe signature verification)
  /api/webhooks/clerk (Clerk signature verification)

PROTECTED ROUTES:
  /dashboard/* (requires auth)
  /api/record/* (requires auth)
  /api/chat (requires auth + active subscription)
  /api/user/* (requires auth)
```

### Rate Limiting Recommendations

```typescript
// TODO: Add rate limiting for transcription
// Implement: redis-rate-limit or upstash
// Limit: 10 requests/hour for free users, 100/hour for paid

// TODO: Add rate limiting for chat
// Limit: 30 requests/hour for paid users
```

---

## 🗄 Database Schema

### Models

**User**
- `id` (Clerk ID) → primary key
- `email` → unique, synced from Clerk
- `name` → optional, synced from Clerk

**Subscription**
- `id` → primary key
- `userId` → FK to User
- `stripeCustomerId` → unique, synced from Stripe
- `stripeSubId` → nullable (subscription ID)
- `status` → free | trial | active | past_due | canceled
- `priceId` → Stripe price ID
- `currentPeriodEnd` → renewal date

**Recording**
- `id` → primary key
- `userId` → FK to User
- `audioUrl` → S3/Supabase path (TODO: implement storage)
- `transcription` → OpenAI result
- `createdAt` → timestamp

**Message**
- `id` → primary key
- `userId` → FK to User
- `recordingId` → nullable FK to Recording
- `role` → user | assistant
- `content` → text
- `createdAt` → timestamp

---

## 📡 API Route Specifications

### POST /api/transcribe

**Request:**
```typescript
Body: FormData with 'audio' (Blob)
Auth: Optional (cookie-based for free)
```

**Response (Success):**
```json
{
  "success": true,
  "transcription": "Hello world",
  "isFree": true,
  "recordingId": "uuid"
}
```

**Response (Limit Exceeded):**
```json
{
  "error": "Free transcription limit exceeded",
  "requiresAuth": true
}
HTTP 403
```

### POST /api/chat

**Request:**
```json
{
  "message": "tell me more",
  "recordingId": "uuid",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "Here's more information..."
}
```

### POST /api/stripe/webhook

**Handled Events:**
- `checkout.session.completed` → Create subscription
- `customer.subscription.updated` → Update status
- `invoice.payment_failed` → Mark past_due
- `customer.subscription.deleted` → Cancel subscription

---

## 🔧 Configuration

### Environment Variables Checklist

```bash
# Database
✓ DATABASE_URL

# Clerk
✓ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
✓ CLERK_SECRET_KEY
✓ CLERK_WEBHOOK_SECRET

# OpenAI
✓ OPENAI_API_KEY

# Stripe
✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✓ STRIPE_SECRET_KEY
✓ STRIPE_WEBHOOK_SECRET
✓ NEXT_PUBLIC_STRIPE_PRICE_ID_PRO
✓ NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE

# Optional
? NEXT_PUBLIC_SUPABASE_URL
? NEXT_PUBLIC_SUPABASE_ANON_KEY
? SUPABASE_SERVICE_ROLE_KEY
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Run `npm run build` (ensure no TypeScript errors)
- [ ] Test all API routes locally
- [ ] Test Stripe webhook locally (use `stripe listen`)
- [ ] Test Clerk webhook locally
- [ ] Check all environment variables are defined

### Production Setup

- [ ] Set up PostgreSQL database (Supabase/RDS/etc)
- [ ] Create Stripe products & price IDs
- [ ] Generate Clerk webhook secret
- [ ] Generate Stripe webhook secret
- [ ] Create OpenAI API key

### Post-Deployment

- [ ] Update Stripe webhook URL to production
- [ ] Update Clerk webhook URL to production
- [ ] Test end-to-end: signup → checkout → dashboard
- [ ] Monitor error logs
- [ ] Set up Sentry/LogRocket for error tracking

---

## 📊 Performance Considerations

### Audio Upload
- Current: Upload as FormData blob
- TODO: Implement chunked upload for large files
- TODO: Add client-side compression

### Transcription
- Current: Single request to OpenAI
- TODO: Add queue system (Bull/RabbitMQ) for batch processing
- TODO: Add caching for duplicate audio

### Database
- Current: Prisma queries without optimization
- TODO: Add database indexes on `userId`, `createdAt`
- TODO: Implement pagination for recordings list
- TODO: Archive old messages (30+ days)

---

## 🔜 Future Enhancements

### MVP Scope
- [x] Voice recording → transcription
- [x] Free tier (1 recording)
- [x] Stripe checkout
- [x] Dashboard with chat
- [x] Recording history

### Phase 2
- [ ] Audio file storage (Supabase bucket)
- [ ] Download recordings as PDF
- [ ] Multiple languages support
- [ ] Voice editing interface
- [ ] Team/organization support
- [ ] API for developers

### Phase 3
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Batch transcription API
- [ ] Advanced analytics
- [ ] Custom models training

---

## 🐛 Known Limitations

### Current
1. **Audio Storage** — Not implemented (commented in schema)
2. **Rate Limiting** — Not implemented
3. **Caching** — No Redis caching
4. **Audio Processing** — WebM only (no MP3 conversion)
5. **Error Tracking** — No Sentry integration
6. **Analytics** — No event tracking

### Workarounds
- TODO items marked in code
- Use Vercel Analytics for basic monitoring
- Add Sentry manually if needed

---

## 📚 Code Patterns & Standards

### Server Components (Pages)
```typescript
// app/page.tsx
export default async function Page() {
  const auth = await auth() // Clerk
  const data = await db.query() // Prisma
  return <ClientComponent data={data} />
}
```

### Client Components
```typescript
// components/video-chat.tsx
'use client' // Enable use of hooks

export function VoiceChat() {
  const [state, setState] = useState()
  useEffect(() => { /* ... */ }, [])
  return ...
}
```

### API Routes
```typescript
// app/api/route.ts
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  // Auth check first
  // Validate input
  // Execute business logic
  // Return response with proper status code
}
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

**Home Page**
- [ ] Load `/` without auth
- [ ] Record audio → transcribe (should work)
- [ ] Try second recording → see "requires auth" message
- [ ] Check localStorage for `voice-to-text-free-used` cookie

**Auth Flow**
- [ ] Click "Sign Up"
- [ ] Complete Clerk signup
- [ ] Check DB for user creation (Prisma Studio)
- [ ] Should redirect to `/dashboard`

**Stripe Flow**
- [ ] Go to `/pricing` as authenticated user
- [ ] Click "Subscribe to Pro"
- [ ] Use Stripe test card: `4242 4242 4242 4242`
- [ ] Check Stripe dashboard for successful event
- [ ] Check DB for subscription update

**Dashboard**
- [ ] Record audio in chat
- [ ] See transcription + AI response
- [ ] Click "History" tab
- [ ] See list of recordings

---

## 📞 Support & Debugging

### Enable Verbose Logging

```typescript
// lib/prisma.ts
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma.$extends({
    query: {
      async $allOperations({ operation, ...rest }) {
        console.log(`[Prisma] ${operation}`)
        return rest.resolve()
      },
    },
  })
}
```

### Stripe Webhook Testing

```bash
# Terminal 1: Run app
npm run dev

# Terminal 2: Listen to Stripe events
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3: Trigger test events
stripe trigger checkout.session.completed
```

### Clerk Webhook Testing

Use ngrok to expose local server:
```bash
ngrok http 3000
# Update webhook URL in Clerk dashboard
# Test events from Clerk dashboard
```
