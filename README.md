# VoiceToText - AI-Powered Audio Transcription MVP

A production-ready SaaS micro-MVP built with **Next.js 14+**, **Clerk**, **Stripe**, **OpenAI**, and **Supabase/Prisma**.

## 🎯 Features

✅ **Voice Recording** — Record audio directly in browser using MediaRecorder API  
✅ **AI Transcription** — OpenAI Whisper for accurate speech-to-text  
✅ **Free Tier** — 1 free transcription (tracked via cookie)  
✅ **User Auth** — Clerk for seamless authentication  
✅ **Stripe Integration** — Subscription payments with webhook support  
✅ **Dashboard** — Voice chat with AI, recording history  
✅ **Production Ready** — Error handling, loading states, TypeScript, responsive UI  

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Clerk, Stripe, OpenAI API keys

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   npm install stripe openai @prisma/client svix
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Fill in your credentials (see SETUP.md for detailed instructions)
   ```

3. **Initialize database:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

---

## 📋 User Flow

```
Home Page (Free Tier)
  ↓
Record Audio (1 free transcription)
  ↓
View Transcription
  ↓
Try Again? → Sign In (Clerk)
  ↓
Select Plan (Stripe Checkout)
  ↓
Payment Confirmed (Webhook)
  ↓
Dashboard Access (Unlimited records + AI chat)
```

---

## 🏗 Project Structure

```
├── app/
│   ├── page.tsx                    # Home with recording
│   ├── pricing/page.tsx            # Pricing plans
│   ├── dashboard/page.tsx          # User dashboard
│   └── api/
│       ├── transcribe/route.ts     # Whisper transcription
│       ├── chat/route.ts           # AI chat responses
│       └── stripe/webhook/route.ts # Stripe events
├── components/
│   ├── audio-recorder.tsx          # Recording UI
│   ├── voice-chat.tsx              # Dashboard chat
│   └── navbar.tsx                  # Navigation
├── lib/
│   ├── prisma.ts                   # DB client
│   ├── stripe-utils.ts             # Stripe helpers
│   └── openai-utils.ts             # OpenAI helpers
└── prisma/
    └── schema.prisma               # Database models
```

---

## 🔐 Key Implementation Details

### Authentication
- **Clerk** for sign-in/sign-up with webhook support
- Middleware protects `/dashboard` and `/api/*` routes
- Free users can access only home page + 1 transcription

### Transcription
- **OpenAI Whisper API** converts audio to text
- Free tier: localStorage cookie marks single use
- Paid tier: saves all recordings to database

### Payments
- **Stripe** for subscription management
- Plans: Free, Pro ($9.99/mo), Enterprise ($49.99/mo)
- Webhooks handle: checkout completion, subscription updates, failed payments

### Database
- **PostgreSQL** with **Prisma** ORM
- Models: User, Subscription, Recording, Message
- Automatic cascade deletes for data cleanup

---

## 📚 Setup & Deployment

For detailed setup instructions (environment variables, webhooks, deployment):

→ **See [SETUP.md](SETUP.md)**

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript |
| **Auth** | Clerk v7+ |
| **Database** | PostgreSQL + Prisma ORM |
| **Payments** | Stripe |
| **AI/ML** | OpenAI Whisper + Claude/GPT-4 |
| **UI** | shadcn/ui + TailwindCSS |
| **Storage** | Supabase (optional) |
| **Deploy** | Vercel |

---

## 📖 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Prisma ORM Guide](https://www.prisma.io/docs)

---

## 🚀 Deployment

Deploy to Vercel in one click:

```bash
git push origin main
# → Automatic deployment via Vercel GitHub integration
```

Don't forget to:
1. Add environment variables in Vercel dashboard
2. Update Stripe & Clerk webhook URLs to production domain

---

## 📝 API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/transcribe` | Optional | Transcribe audio |
| POST | `/api/chat` | Required | Generate AI response |
| GET | `/api/user/subscription` | Required | Get subscription status |
| POST | `/api/stripe/customer` | Required | Create Stripe customer |
| POST | `/api/stripe/checkout` | Required | Create checkout session |
| POST | `/api/stripe/webhook` | Public | Handle Stripe events |
| POST | `/api/webhooks/clerk` | Public | Handle Clerk events |

---

## 🐛 Common Issues

**Q: Transcription API fails?**
- A: Check OpenAI API key and quota. Ensure audio is WebM format.

**Q: Webhook not triggering?**
- A: Verify webhook URL is public and secret matches `.env.local`.

**Q: Stripe checkout redirects here?**
- A: Ensure price IDs are valid and in `.env.local`.

---

## 📄 License

MIT License
