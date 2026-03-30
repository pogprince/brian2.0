import { registerProvider, getProvider, chat, listProviders, getDefaultProviderName } from './provider'
import { ClaudeProvider } from './claude'

// Register default providers
registerProvider(new ClaudeProvider())

// Extension point: register additional providers here
// import { OpenAIProvider } from './openai'
// registerProvider(new OpenAIProvider())

export { getProvider, chat, listProviders, getDefaultProviderName, registerProvider }
