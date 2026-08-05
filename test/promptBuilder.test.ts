import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCommitMessages } from '../src/ai/promptBuilder';

test('buildCommitMessages interpolates the diff into the prompt', () => {
  const messages = buildCommitMessages('diff --git a/a.ts b/a.ts');
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'user');
  assert.ok(messages[0].content.includes('diff --git a/a.ts b/a.ts'));
});
