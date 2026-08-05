import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCommitMessages } from '../src/ai/promptBuilder';

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
