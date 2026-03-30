import type { LLMProvider, LLMRequest, LLMResponse } from '@/lib/types'

const providers = new Map<string, LLMProvider>()

export function registerProvider(provider: LLMProvider): void {
  providers.set(provider.name, provider)
}

export function getProvider(name?: string): LLMProvider {
  const providerName = name || getDefaultProviderName()
  const provider = providers.get(providerName)
  if (!provider) {
    throw new Error(`LLM provider "${providerName}" not registered. Available: ${Array.from(providers.keys()).join(', ')}`)
  }
  return provider
}

export function getDefaultProviderName(): string {
  // Extension point: could read from config/env
  return 'claude'
}

export function listProviders(): string[] {
  return Array.from(providers.keys())
}

export async function chat(request: LLMRequest, providerName?: string): Promise<LLMResponse> {
  const provider = getProvider(providerName)
  return provider.chat(request)
}
