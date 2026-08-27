/**
 * Client-safe catalogue of AI providers an admin can plug their own key into.
 * Every provider except Anthropic speaks the OpenAI chat-completions shape,
 * so a single adapter covers them all.
 */
export const AI_PROVIDERS = [
  {
    id: "lovable",
    label: "Lovable AI (built in)",
    baseUrl: "https://ai.gateway.lovable.dev/v1",
    keyHint: "Managed automatically — no key needed",
    models: ["openai/gpt-5.6-sol", "openai/gpt-5.6-terra", "google/gemini-3.6-flash"],
  },
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    keyHint: "sk-...",
    models: ["gpt-5.1", "gpt-4.1", "gpt-4o"],
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    baseUrl: "https://api.anthropic.com/v1",
    keyHint: "sk-ant-...",
    models: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-3-5-haiku-latest"],
  },
  {
    id: "google",
    label: "Google (Gemini)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    keyHint: "AIza...",
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    baseUrl: "https://api.x.ai/v1",
    keyHint: "xai-...",
    models: ["grok-4", "grok-3-mini"],
  },
  {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    keyHint: "gsk_...",
    models: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    keyHint: "sk-or-...",
    models: ["anthropic/claude-sonnet-4.5", "google/gemini-2.5-pro", "openai/gpt-4.1"],
  },
  {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    keyHint: "...",
    models: ["mistral-large-latest"],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    keyHint: "sk-...",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    baseUrl: "",
    keyHint: "Any key your endpoint expects",
    models: [],
  },
] as const;

export type AiProviderId = (typeof AI_PROVIDERS)[number]["id"];

export function providerMeta(id: string) {
  return AI_PROVIDERS.find((provider) => provider.id === id) ?? AI_PROVIDERS[AI_PROVIDERS.length - 1];
}