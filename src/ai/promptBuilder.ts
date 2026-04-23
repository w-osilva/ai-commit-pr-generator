import { Message } from './openRouterClient';
import { CommitEntry } from '../git/gitProvider';
import { DEFAULT_PR_TEMPLATE } from '../utils/templateReader';

const COMMIT_PROMPT = `You are a senior engineer writing a git commit message for a production codebase.

Given these staged changes:

{diff}

Write a commit message following Conventional Commits (https://www.conventionalcommits.org).

Format: <type>(<scope>): <short summary in imperative mood, max 72 chars>

[body — optional, only if the WHY or business context is non-obvious]

Rules:
- Types: feat, fix, refactor, perf, test, chore, docs
- Scope: the module, page, or domain affected (e.g. guardian-dashboard, billing, auth)
- Summary: imperative mood ("add", "remove", "replace"), no period at the end
- Body: explain WHY the change was made and any non-obvious business logic or trade-offs. Skip it if the summary is self-explanatory. Do NOT describe what the diff shows — the reader can see that.
- No bullet points in the body; use plain prose, max 3 sentences
- Do not mention file names or line numbers

Output only the commit message, no explanation.`;

const PR_WRITING_GUIDELINES = `When writing the description, follow these guidelines:

- Be extremely clear, direct, and concise (1-2 sentences max for each section). No emojis.
- Bullet lists are fine, but don't bold the start of each bullet.
- Focus on "why" the changes were made and "how" they achieve the goal, rather than describing "what" was changed.
- Avoid unnecessary adjectives or salesy language.
- Omit any template section entirely if you have nothing meaningful to add.
- Unless the git history is completely focused on the test suite, do not include information about test changes in the description.`;

const PR_PROMPT = `Generate a pull request description based on the following context.

<git_history>
{history}
</git_history>

<pull_request_template>
{template}
</pull_request_template>

Provide a title for the pull request and a description following the pull request template above.

The title must be in Conventional Commits format: <type>(<scope>): <short summary>.

${PR_WRITING_GUIDELINES}

Reply with ONLY a valid JSON object: {"title": "...", "body": "..."}. No text outside the JSON.`;

export function buildCommitMessages(diff: string, customPrompt?: string): Message[] {
  const prompt = customPrompt || COMMIT_PROMPT;
  const content = prompt
    .replace('{diff}', diff)
    .replace('{changes}', diff); // accept both placeholders

  return [{ role: 'user', content }];
}

export function buildPRMessages(
  history: CommitEntry[],
  template: string | null,
  customPrompt?: string
): Message[] {
  const templateSection = template ?? DEFAULT_PR_TEMPLATE;
  const historyJson = JSON.stringify(history, null, 2);

  const prompt = customPrompt || PR_PROMPT;
  const content = prompt
    .replace('{history}', historyJson)
    .replace('{template}', templateSection);

  return [{ role: 'user', content }];
}

export interface PRResult {
  title: string;
  body: string;
}

export function parsePRResponse(raw: string): PRResult {
  // Strip markdown code fences if model wraps in ```json
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();

  try {
    const parsed = JSON.parse(cleaned) as { title?: string; body?: string };
    return {
      title: parsed.title ?? '',
      body: parsed.body ?? cleaned,
    };
  } catch {
    // Best-effort fallback: first line as title, rest as body
    const lines = raw.split('\n');
    return {
      title: lines[0].replace(/^#+\s*/, '').trim(),
      body: lines.slice(1).join('\n').trim(),
    };
  }
}
