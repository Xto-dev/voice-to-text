# VoiceToText - Setup & Installation Guide

## 📋 Prerequisites

Before you start, make sure you have:
- Node.js 18+ (npm/yarn/pnpm)
- PostgreSQL database (local or cloud, e.g., [Supabase](https://supabase.com))
- [Clerk](https://clerk.com) account
- [Stripe](https://stripe.com) account (for payments)
- [OpenAI](https://openai.com/api) API key
- Optional: [Supabase](https://supabase.com) for file storage

---

## 🚀 Step-by-Step Setup

### 1. **Install Dependencies**

```bash
npm install
# or: yarn install / pnpm install
```

Additionally, install the required packages:

```bash
npm install stripe openai @prisma/client svix
```

### 2. **Set Up Environment Variables**

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

#### **Database** (PostgreSQL)
```
DATABASE_URL="postgresql://user:password@localhost:5432/voice_to_text"
```

#### **Clerk Authentication**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy your keys:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-publishable-key>
CLERK_SECRET_KEY=<your-secret-key>
CLERK_WEBHOOK_SECRET=<webhook-secret>
```

#### **OpenAI API**
1. Go to [OpenAI API Dashboard](https://platform.openai.com/api-keys)
2. Create an API key:

```
OPENAI_API_KEY=sk-...
```

#### **Stripe**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your keys from Developers → API keys:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. Create price IDs in Stripe:
   - Go to **Products → Create Product**
   - Create two products: **Pro** ($9.99/month) and **Enterprise** ($49.99/month)
   - Copy the price IDs:

```
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_...
```

### 3. **Set Up Prisma & Database**

Initialize Prisma and create tables:

```bash
# Generate Prisma Client
npx prisma generate

# Create database schema
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to inspect data
npx prisma studio
```

### 4. **Configure Clerk Webhooks**

1. Go to Clerk Dashboard → Integrations → Webhooks
2. Create a new endpoint:
   - URL: `https://your-vercel-app.vercel.app/api/webhooks/clerk` (or `http://localhost:3000/api/webhooks/clerk` for local)
   - Subscribe to events:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
3. Copy the webhook secret and add to `.env.local`:

```
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

### 5. **Configure Stripe Webhooks**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Create a new endpoint:
   - URL: `https://your-vercel-app.vercel.app/api/stripe/webhook` (or `http://localhost:3000/api/stripe/webhook` for local)
   - Subscribe to events:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `invoice.payment_failed`
     - ✅ `customer.subscription.deleted`
3. Copy the webhook secret and add to `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. **Update Clerk Middleware (Optional)**

The middleware is already configured in `middleware.ts`. Update redirect URLs if needed.

---

## 🏃 Running the Project

### Development Mode

```bash
npm run dev
```

App will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

---

## 🌐 Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial VoiceToText setup"
git push origin main
```

### 2. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Create a project" → Select your GitHub repo
3. Set environment variables (copy from `.env.local`)
4. Click "Deploy"

### 3. Update Webhook URLs

After deployment, update webhook URLs in Clerk & Stripe:

- Clerk: `https://your-project.vercel.app/api/webhooks/clerk`
- Stripe: `https://your-project.vercel.app/api/stripe/webhook`

---

## 📁 Project Structure

```
.
├── app/
│   ├── layout.tsx              # Root layout with Clerk + Navbar
│   ├── page.tsx                # Home page with recording
│   ├── pricing/page.tsx        # Pricing page
│   ├── dashboard/page.tsx      # Dashboard (authenticated)
│   ├── sign-in/                # Clerk sign-in page
│   ├── sign-up/                # Clerk sign-up page
│   └── api/
│       ├── transcribe/route.ts         # OpenAI Whisper transcription
│       ├── chat/route.ts               # OpenAI chat responses
│       ├── stripe/webhook/route.ts     # Stripe webhook
│       ├── stripe/customer/route.ts    # Create Stripe customer
│       ├── stripe/checkout/route.ts    # Stripe checkout session
│       ├── user/subscription/route.ts  # Get subscription status
│       └── webhooks/clerk/route.ts     # Clerk webhook
├── components/
│   ├── audio-recorder.tsx      # Recording UI (home page)
│   ├── voice-chat.tsx          # Voice chat (dashboard)
│   ├── recordings-list.tsx     # Recording history
│   ├── checkout-button.tsx     # Stripe checkout button
│   └── navbar.tsx              # Navigation bar
├── lib/
│   ├── prisma.ts              # Prisma Client singleton
│   ├── stripe-utils.ts        # Stripe utilities
│   └── openai-utils.ts        # OpenAI utilities
├── prisma/
│   └── schema.prisma          # Database schema
├── middleware.ts              # Clerk middleware
└── .env.local                 # Environment variables (not committed)
```

---

## 🔑 Key Features

### 1. **Free Tier (No Auth)**
- 1 free transcription via localStorage cookie
- After limit: redirect to sign-in

### 2. **Authentication**
- Clerk sign-in/sign-up
- User auto-creation via Clerk webhook

### 3. **Transcription**
- OpenAI Whisper API
- Saves to database only for authenticated users

### 4. **Stripe Integration**
- Checkout session for Pro/Enterprise plans
- Webhook handling for
 subscription updates
- Subscription status tracking

### 5. **Dashboard**
- Voice chat with AI
- Recording history
- Subscription status

---

## 🐛 Troubleshooting

### Webhook Not Triggering?
1. Check webhook URL is correct and publicly accessible
2. Verify webhook secret in `.env.local`
3. Check logs in provider dashboard (Clerk/Stripe)

### Database Connection Error?
1. Ensure `DATABASE_URL` is correct
2. Check PostgreSQL is running
3. Run `npx prisma db push` to sync schema

### OpenAI Rate Limit?
1. Check API key is valid
2. Upgrade to Pro plan on OpenAI
3. Add rate limiting if needed

### Transcription Failing?
1. Ensure audio format is WebM (supported by Whisper)
2. Check OpenAI API key and quota
3. Verify audio is not corrupted

---

## 📝 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

---

## 📄 License

MIT License - Feel free to use this as a template!
