import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonObject } from '../src/ai/jsonExtract';

test('parses a clean JSON object', () => {
  const r = extractJsonObject('{"title":"a","body":"b"}');
  assert.deepEqual(r, { title: 'a', body: 'b' });
});

test('extracts the first balanced object amid surrounding prose', () => {
  const raw = 'Here you go:\n{"title":"a","body":"b"}\nThanks!';
  const r = extractJsonObject(raw);
  assert.deepEqual(r, { title: 'a', body: 'b' });
});

test('recovers when the body contains literal newlines', () => {
  const raw = '{"title":"a","body":"line1\nline2"}';
  const r = extractJsonObject(raw);
  assert.equal(r?.title, 'a');
  assert.equal(r?.body, 'line1\nline2');
});

test('returns null when no JSON object is present', () => {
  assert.equal(extractJsonObject('no json here'), null);
});
