import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider, LLMRequest, LLMResponse } from '@/lib/types'

export class ClaudeProvider implements LLMProvider {
  name = 'claude'
  private client: Anthropic | null = null

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    }
    return this.client
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const client = this.getClient()
    const model = request.model || this.defaultModel()
    const start = Date.now()

    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const systemText = request.system ||
      request.messages.find(m => m.role === 'system')?.content

    const response = await client.messages.create({
      model,
      max_tokens: request.max_tokens || 4096,
      messages,
      ...(systemText ? { system: systemText } : {}),
    })

    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => 'text' in block ? block.text : '')
      .join('')

    return {
      content,
      model,
      provider: this.name,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
      duration_ms: Date.now() - start,
    }
  }

  listModels(): string[] {
    return [
      'claude-sonnet-4-6',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-6',
    ]
  }

  defaultModel(): string {
    return 'claude-sonnet-4-6'
  }
}
