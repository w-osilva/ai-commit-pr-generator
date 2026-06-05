import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flattenMessages, classifyError } from '../src/ai/claudeCliClient';

test('flattenMessages joins system then user with blank lines', () => {
  const out = flattenMessages([
    { role: 'system', content: 'SYS' },
    { role: 'user', content: 'USER' },
  ]);
  assert.equal(out, 'SYS\n\nUSER');
});

test('flattenMessages handles a single user message', () => {
  assert.equal(flattenMessages([{ role: 'user', content: 'hi' }]), 'hi');
});

test('classifyError reports missing binary for ENOENT', () => {
  const err = classifyError(null, 'spawn claude ENOENT');
  assert.match(err.message, /not found/i);
});

test('classifyError reports login needed on auth failure', () => {
  const err = classifyError(1, 'Error: not authenticated, please run /login');
  assert.match(err.message, /log/i);
});

test('classifyError surfaces stderr snippet otherwise', () => {
  const err = classifyError(2, 'some other failure happened');
  assert.match(err.message, /some other failure/);
});
