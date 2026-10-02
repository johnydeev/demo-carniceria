import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esCelular } from './dispositivo.ts';

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

test('Android y iPhone son celulares', () => {
  assert.equal(esCelular(ANDROID), true);
  assert.equal(esCelular(IPHONE), true);
});

test('escritorio no', () => {
  assert.equal(esCelular(WINDOWS), false);
  assert.equal(esCelular(MAC, 0), false);
});

test('un iPad con iPadOS se presenta como Mac, pero es tactil', () => {
  assert.equal(esCelular(MAC, 5), true);
});
