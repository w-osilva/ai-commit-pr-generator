import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCommitMessages, buildPRMessages, WRITING_STYLE } from '../src/ai/promptBuilder';

// Matches a Conventional Commits scope, e.g. "feat(auth):" — must never appear
// as a live constraint in either built prompt (illustrative examples aside).
const SCOPE = /[a-z]+\([a-z0-9_-]+\)!?:/;

test('buildCommitMessages interpolates the diff into the prompt', () => {
  const messages = buildCommitMessages('diff --git a/a.ts b/a.ts');
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'user');
  assert.ok(messages[0].content.includes('diff --git a/a.ts b/a.ts'));
});

test('the commit prompt forbids scopes', () => {
  const content = buildCommitMessages('some diff')[0].content;
  assert.equal(SCOPE.test(content), false);
});

test('the commit prompt carries the shared writing style rules', () => {
  const content = buildCommitMessages('some diff')[0].content;
  assert.ok(content.includes(WRITING_STYLE));
});

test('a custom commit prompt overrides the built-in one', () => {
  const content = buildCommitMessages('some diff', 'Custom: {diff}')[0].content;
  assert.equal(content, 'Custom: some diff');
});

const HISTORY = [
  {
    sha: 'abc1234',
    date: '2026-08-05T00:00:00Z',
    body: 'feat: add a thing',
    files: ['src/a.ts'],
    file_stats: [
      { path: 'src/a.ts', type: 'M' as const, lines_added: 3, lines_deleted: 1, lines_changed: 4 },
    ],
  },
];

test('buildPRMessages interpolates history, template and diff', () => {
  const content = buildPRMessages(HISTORY, '## My Template', 'diff --git a/a.ts b/a.ts')[0].content;
  assert.ok(content.includes('feat: add a thing'));
  assert.ok(content.includes('## My Template'));
  assert.ok(content.includes('diff --git a/a.ts b/a.ts'));
});

test('buildPRMessages falls back to the default template', () => {
  const content = buildPRMessages(HISTORY, null, 'some diff')[0].content;
  assert.ok(content.includes('## Test plan'));
});

test('buildPRMessages drops the diff block when there is no diff', () => {
  const content = buildPRMessages(HISTORY, '## My Template', '')[0].content;
  assert.equal(content.includes('<diff>'), false);
  assert.equal(content.includes('{diff}'), false);
});

test('the PR prompt forbids scopes and carries the shared writing style rules', () => {
  const content = buildPRMessages(HISTORY, '## My Template', 'd')[0].content;
  assert.equal(SCOPE.test(content), false);
  assert.ok(content.includes(WRITING_STYLE));
});

test('a custom PR prompt without a diff placeholder still works', () => {
  const content = buildPRMessages(HISTORY, '## T', 'some diff', 'Custom: {template}')[0].content;
  assert.equal(content, 'Custom: ## T');
});

test('a diff containing $-substitution directives is interpolated byte-for-byte', () => {
  const diff = 'echo "pid=$$"\nconst tpl = `$`legacy$``;\nsed -i "s/x/$\'/" file.sh';
  const commitContent = buildCommitMessages(diff)[0].content;
  assert.ok(commitContent.includes(diff));

  const prContent = buildPRMessages(HISTORY, '## My Template', diff)[0].content;
  assert.ok(prContent.includes(diff));
});

test('a commit body containing a literal {diff} placeholder does not steal the real diff', () => {
  const historyWithLiteralPlaceholder = [
    {
      sha: 'abc1234',
      date: '2026-08-05T00:00:00Z',
      body: 'docs: document the {diff} placeholder',
      files: ['README.md'],
      file_stats: [
        { path: 'README.md', type: 'M' as const, lines_added: 3, lines_deleted: 1, lines_changed: 4 },
      ],
    },
  ];
  const realDiff = 'diff --git a/README.md b/README.md\n+the real diff';
  const content = buildPRMessages(historyWithLiteralPlaceholder, '## My Template', realDiff)[0]
    .content;

  const diffBlockMatch = content.match(/<diff>\n([\s\S]*?)\n<\/diff>/);
  assert.ok(diffBlockMatch, 'expected a <diff> block in the built prompt');
  assert.equal(diffBlockMatch![1], realDiff);
});
