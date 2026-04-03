import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Transcribe audio using Whisper API
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Convert Buffer to Blob (create a new Uint8Array to ensure compatibility)
    const uint8Array = new Uint8Array(audioBuffer)
    const blob = new Blob([uint8Array], { type: 'audio/webm' })
    const file = new File([blob], 'audio.webm', { type: 'audio/webm' })

    const response = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
    })

    return response.text
  } catch (error) {
    console.error('Transcription error:', error)
    throw new Error('Failed to transcribe audio')
  }
}

// Generate chat response based on transcription
export async function generateChatResponse(
  transcription: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const messages: any[] = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: transcription,
      },
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // or use gpt-3.5-turbo for cheaper option
      max_tokens: 1024,
      messages,
    })

    const firstChoice = response.choices[0]
    if (firstChoice?.message?.content) {
      return firstChoice.message.content
    }

    throw new Error('Unexpected response type')
  } catch (error) {
    console.error('Chat generation error:', error)
    throw new Error('Failed to generate response')
  }
}
