import { Message } from './openRouterClient';
import { CommitEntry } from '../git/gitProvider';
import { DEFAULT_PR_TEMPLATE } from '../utils/defaultPrTemplate';
import { extractJsonObject } from './jsonExtract';

const WRITING_STYLE = `WRITING STYLE — applies to every word you write:
- One idea per sentence. If a sentence joins two clauses with "and" or a semicolon, split it.
- Active voice. "We now use X", not "X is now used".
- Common words. Never: shipped with, hand-rolled, leverage, surface (as a verb), sunset, in parallel, notably, furthermore, it is worth noting.
- Say what was wrong or missing, then what this change does about it. Nothing else.
- Cut all of this: the process you followed, how many review passes happened, counts and metrics, exhaustive lists of files or screens, and how the solution works internally. The reader has the diff for that. A number or detail earns its place only when the reader must act on it.
- No emojis. No filler adjectives. No salesy phrasing.`;

const COMMIT_PROMPT = `You write exactly ONE git commit message for the staged diff, in Conventional Commits. Reason silently, then output only the final message.

STEPS (silent): 1) find the dominant change and its intent; 2) pick the type; 3) write the subject; 4) add a body only if required; 5) output.

TYPE — pick the FIRST that fits: revert (undoes a commit) > fix (corrects a bug/regression) > perf (faster, same behavior) > feat (new/extended behavior) > refactor (restructure, no behavior change) > test (tests only) > docs (docs only) > build (deps/build config) > ci (pipeline only) > style (formatting only) > chore (anything else).

SUBJECT: \`type: description\`
- NEVER write a scope. There is no parenthesised form. Just the type, a colon, and the description.
- description: imperative, lowercase, no period. Whole line <= 72 chars. Spend the room on what changed and why it matters, not on the mechanism.
- breaking change: \`type!: ...\`.

${WRITING_STYLE}

BODY: none by default. Add one ONLY when the diff does not tell the story on its own — the why, a fix's root cause, a trade-off.
- ONE subject: short prose, at most 3 sentences.
- TWO OR MORE distinct fronts: one \`-\` bullet per front, one line each, a short label first.
- Plain text only. NEVER use markdown bold or backticks — git log renders them literally.
- Wrap at 72 columns. Never list file names.

NEVER: output anything but the message; use code fences/quotes/preamble; name files or lines; add trailers, sign-offs, ticket or AI/co-author lines.

EXAMPLES (format only, do not reuse):
fix: evict cache entries when their owner is deleted

Deleted records still came back from the cache. Other users could see data that should have been gone.
---
fix: stop the CLI runner from crashing the extension host

The child process can exit before it drains stdin. The unhandled stream error took the host down with it.

- Swallow EPIPE on the child process stdin
- Guard the error and close handlers against settling twice

<diff>
{diff}
</diff>

Write the commit message now. Output only the message.`;

const PR_PROMPT = `You write a pull request description for review. The git history is the source of truth for what changed; the template defines the exact structure your description must follow. Reason silently through the STEPS, then output only the JSON object.

<git_history>
{history}
</git_history>

<pull_request_template>
{template}
</pull_request_template>

STEPS (silent):
1. Read the whole history. Cluster the commits into a few themes (by feature/area), not commit-by-commit.
2. Infer the PR's PRIMARY intent and its motivation (the why), even if commit messages are terse.
3. Note anything a reviewer must not miss: breaking changes, data migrations, new dependencies, config/security changes, follow-ups. (Only surface these if the appropriate template section exists.)
4. Map the themes onto the template's sections, keeping its exact headers and order.
5. Draft concise prose per section. Then build and validate the JSON.

TITLE:
- Conventional Commits: \`type(scope): summary\` (scope optional).
- Imperative, lowercase summary, no trailing period, <= 72 chars.
- Capture the PRIMARY intent of the whole PR, not one commit. Use \`type!:\` if it's a breaking change.

BODY (GitHub-flavored Markdown):
- Use the template's section headers verbatim and in order. Never invent sections it lacks.
- Omit a section entirely if you have nothing meaningful for it. Do not write "N/A".
- Explain WHY the change was made and HOW it achieves the goal — not a flat list of WHAT changed.
- Be direct: 1-2 sentences per section. No emojis, no salesy or filler adjectives.
- Bullets are fine; do not bold the start of each bullet.
- Do not describe test changes unless the PR is entirely about the test suite.

NEVER: output anything outside the JSON; use code fences around the JSON; invent changes not in the history; pad with generic statements.

OUTPUT — reply with ONLY this JSON object: {"title": "...", "body": "..."}
- Valid JSON, double quotes, no trailing commas.
- "body" is a SINGLE JSON string: escape every line break as \\n and every double quote as \\". Put no literal newlines inside the string.

Example of the exact shape (content is illustrative only):
{"title": "feat(billing): prorate mid-cycle plan upgrades", "body": "## Summary\\nUpgrades before renewal charged the full new price, driving support tickets.\\n\\n## Changes\\nProration credits the unused portion of the current plan against the upgrade."}

Produce the JSON now. Output only the JSON object.`;

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
  const extracted = extractJsonObject(raw);
  if (extracted && (extracted.title || extracted.body)) {
    return {
      title: extracted.title ?? '',
      body: extracted.body ?? '',
    };
  }
  // Best-effort fallback: first line as title, rest as body.
  const lines = raw.trim().split('\n');
  return {
    title: lines[0].replace(/^#+\s*/, '').trim(),
    body: lines.slice(1).join('\n').trim(),
  };
}
