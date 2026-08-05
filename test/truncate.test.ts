import { test } from 'node:test';
import assert from 'node:assert/strict';
import { truncateDiff, DIFF_CHAR_LIMIT } from '../src/git/truncate';

test('returns the diff unchanged when it is under the limit', () => {
  const diff = 'a'.repeat(100);
  assert.equal(truncateDiff(diff, 200), diff);
});

test('returns the diff unchanged when it exactly hits the limit', () => {
  const diff = 'a'.repeat(200);
  assert.equal(truncateDiff(diff, 200), diff);
});

test('truncates and appends the marker when over the limit', () => {
  const result = truncateDiff('a'.repeat(300), 200);
  assert.ok(result.startsWith('a'.repeat(200)));
  assert.ok(result.endsWith('[diff truncated]'));
  assert.equal(result.match(/\[diff truncated\]/g)?.length, 1);
});

test('keeps only the first limit characters of content', () => {
  const result = truncateDiff('a'.repeat(200) + 'b'.repeat(100), 200);
  assert.equal(result.includes('b'), false);
});

test('defaults to the 80000 character limit', () => {
  assert.equal(DIFF_CHAR_LIMIT, 80000);
  assert.equal(truncateDiff('a'.repeat(100)), 'a'.repeat(100));
});

test('handles an empty diff', () => {
  assert.equal(truncateDiff(''), '');
});
