// Global types and interfaces for the application

/**
 * Transcription API response
 */
export interface TranscriptionResponse {
  success: boolean
  transcription: string
  isFree?: boolean
  recordingId?: string
  requiresAuth?: boolean
  error?: string
}

/**
 * Chat API request
 */
export interface ChatRequest {
  message: string
  recordingId?: string
  history: ChatMessage[]
}

/**
 * Chat message
 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Chat API response
 */
export interface ChatResponse {
  success: boolean
  response: string
  error?: string
}

/**
 * Subscription status
 */
export interface SubscriptionStatus {
  status: 'free' | 'trial' | 'active' | 'past_due' | 'canceled'
  isActive: boolean
  currentPeriodEnd: Date | null
  priceId?: string
}

/**
 * Recording with metadata
 */
export interface RecordingWithMessages {
  id: string
  userId: string
  transcription: string
  createdAt: Date
  messages: ChatMessage[]
}

/**
 * Stripe customer creation response
 */
export interface CreateCustomerResponse {
  customerId: string
  email: string
}

/**
 * Stripe checkout session response
 */
export interface CheckoutSessionResponse {
  url: string | null
  sessionId: string
}
