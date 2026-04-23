const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const DEFAULT_MODEL = 'openai/gpt-oss-120b:free';

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export async function generate(messages: Message[], config: OpenRouterConfig): Promise<string> {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/wsilva/ai-commit-pr-generator',
      'X-Title': 'AI Commit & PR Generator',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenRouter API');
  }

  return content.trim();
}
