import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCommitMessages, buildPRMessages } from '../src/ai/promptBuilder';

test('buildCommitMessages interpolates the diff into the prompt', () => {
  const messages = buildCommitMessages('diff --git a/a.ts b/a.ts');
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'user');
  assert.ok(messages[0].content.includes('diff --git a/a.ts b/a.ts'));
});

test('the commit prompt forbids scopes', () => {
  const content = buildCommitMessages('some diff')[0].content;
  assert.ok(content.includes('NEVER write a scope'));
  assert.equal(content.includes('type(scope)'), false);
});

test('the commit prompt carries the shared writing style rules', () => {
  const content = buildCommitMessages('some diff')[0].content;
  assert.ok(content.includes('One idea per sentence'));
  assert.ok(content.includes('Active voice'));
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

test('the PR prompt forbids scopes and states the heading rule', () => {
  const content = buildPRMessages(HISTORY, '## My Template', 'd')[0].content;
  assert.ok(content.includes('NEVER write a scope'));
  assert.ok(content.includes('internal work gets NO heading'));
});

test('a custom PR prompt without a diff placeholder still works', () => {
  const content = buildPRMessages(HISTORY, '## T', 'some diff', 'Custom: {template}')[0].content;
  assert.equal(content, 'Custom: ## T');
});
