/**
 * Application constants and configuration
 */

// Free tier configuration
export const FREE_TIER_CONFIG = {
  MAX_RECORDINGS: 1,
  COOKIE_NAME: 'voice-to-text-free-used',
  COOKIE_MAX_AGE: 365 * 24 * 60 * 60, // 1 year in seconds
} as const

// API configuration
export const API_CONFIG = {
  TRANSCRIBE_TIMEOUT: 30000, // 30 seconds
  CHAT_TIMEOUT: 30000, // 30 seconds
  MAX_AUDIO_SIZE: 25 * 1024 * 1024, // 25MB (OpenAI Whisper limit)
} as const

// OpenAI configuration
export const OPENAI_CONFIG = {
  WHISPER_MODEL: 'whisper-1',
  CHAT_MODEL: 'claude-3-5-sonnet-20241022', // or 'gpt-4-turbo'
  CHAT_MAX_TOKENS: 1024,
  CHAT_TEMPERATURE: 0.7,
} as const

// Stripe configuration
export const STRIPE_CONFIG = {
  CURRENCY: 'usd',
  PLANS: {
    FREE: {
      name: 'Free',
      price: 0,
    },
    PRO: {
      name: 'Pro',
      price: 9.99,
      priceIdEnv: 'NEXT_PUBLIC_STRIPE_PRICE_ID_PRO',
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 49.99,
      priceIdEnv: 'NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE',
    },
  },
} as const

// Subscription statuses
export const SUBSCRIPTION_STATUSES = {
  FREE: 'free',
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
} as const

// Role types for chat
export const CHAT_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const

// Error messages
export const ERROR_MESSAGES = {
  MICROPHONE_ERROR: 'Failed to access microphone. Check browser permissions.',
  TRANSCRIPTION_FAILED: 'Failed to transcribe audio. Please try again.',
  CHAT_FAILED: 'Failed to generate response. Please try again.',
  AUTH_REQUIRED: 'Authentication required. Please sign in.',
  SUBSCRIPTION_REQUIRED: 'Active subscription required for this feature.',
  FREE_LIMIT_EXCEEDED: 'Free transcription limit exceeded. Please sign in to continue.',
  STRIPE_ERROR: 'Payment processing failed. Please try again.',
  DATABASE_ERROR: 'Database error. Please try again later.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  TRANSCRIPTION_COMPLETE: 'Transcription complete!',
  CHAT_RESPONSE_RECEIVED: 'Response received!',
  SUBSCRIPTION_UPDATED: 'Subscription updated successfully!',
  AUDIO_RECORDED: 'Audio recorded successfully!',
}

// Route paths
export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  PRICING: '/pricing',
  DASHBOARD: '/dashboard',
  API_TRANSCRIBE: '/api/transcribe',
  API_CHAT: '/api/chat',
  API_SUBSCRIPTION: '/api/user/subscription',
  API_STRIPE_WEBHOOK: '/api/stripe/webhook',
  API_CLERK_WEBHOOK: '/api/webhooks/clerk',
} as const

// UI configuration
export const UI_CONFIG = {
  SCROLL_AREA_HEIGHT: 400,
  MESSAGE_MAX_LENGTH: 2000,
  RECORDING_TIMEOUT: 60 * 1000, // 60 seconds
  TOAST_DURATION: 3000,
} as const
