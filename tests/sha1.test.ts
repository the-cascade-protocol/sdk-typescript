/**
 * The vendored SHA-1 must be indistinguishable from the platform's.
 *
 * It replaced `node:crypto`'s `createHash('sha1')` under the SDK's identity
 * function, and identity is published: a single differing digest moves a URI
 * that pods already store. So this suite checks it two ways — against the
 * published FIPS 180-4 vectors, which anchor it to the standard rather than to
 * whatever Node happens to do, and against Node's own implementation over a
 * large random corpus including multi-byte and astral-plane text.
 *
 * `node:crypto` is imported HERE and nowhere in `src/`: this is a test, which
 * runs only under Node, and comparing against the platform is the whole point.
 * The browser-bundle gate (`npm run check:browser`) covers the shipped code.
 */

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { sha1, sha1Hex, bytesToHex } from '../src/vendor/sha1.js';

describe('sha1 — FIPS 180-4 published test vectors', () => {
  // NIST FIPS 180-4 Appendix A.1 and the SHA-1 sample vectors.
  const vectors: [label: string, input: string, expected: string][] = [
    ['"abc"', 'abc', 'a9993e364706816aba3e25717850c26c9cd0d89d'],
    ['the empty string', '', 'da39a3ee5e6b4b0d3255bfef95601890afd80709'],
    [
      'the 448-bit two-block message',
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '84983e441c3bd26ebaae4aa1f95129e5e54670f1',
    ],
  ];

  for (const [label, input, expected] of vectors) {
    it(`hashes ${label}`, () => {
      expect(sha1Hex(input)).toBe(expected);
    });
  }

  it('hashes one million "a" characters', () => {
    // Exercises the multi-block path and a bit length that no longer fits in a
    // 16-bit count, which is where a naive length encoding goes wrong.
    expect(sha1Hex('a'.repeat(1_000_000))).toBe('34aa973cd4c4daa4f61eeb2bdbad27316534016f');
  });
});

describe('sha1 — block-boundary lengths', () => {
  // 55/56/57 and 63/64/65 bracket the two places padding changes shape: the
  // point where the 64-bit length no longer fits in the current block, and the
  // block boundary itself.
  for (const length of [0, 1, 54, 55, 56, 57, 63, 64, 65, 119, 120, 127, 128, 129]) {
    it(`matches node:crypto at ${length} bytes`, () => {
      const input = 'x'.repeat(length);
      expect(sha1Hex(input)).toBe(createHash('sha1').update(input, 'utf8').digest('hex'));
    });
  }
});

describe('sha1 — agreement with node:crypto over random input', () => {
  /** Deterministic PRNG so a failure is reproducible from the seed alone. */
  function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Draws from four code-point ranges so the UTF-8 encoding under test spans
   * every width: ASCII (1 byte), Latin-1 supplement (2), CJK (3), and the
   * astral planes (4, a surrogate pair in the JS string).
   */
  function randomString(rand: () => number, length: number): string {
    let out = '';
    for (let i = 0; i < length; i++) {
      const bucket = Math.floor(rand() * 4);
      if (bucket === 0) out += String.fromCodePoint(0x20 + Math.floor(rand() * 0x5f));
      else if (bucket === 1) out += String.fromCodePoint(0xa0 + Math.floor(rand() * 0x300));
      else if (bucket === 2) out += String.fromCodePoint(0x4e00 + Math.floor(rand() * 0x1000));
      else out += String.fromCodePoint(0x10000 + Math.floor(rand() * 0x10000));
    }
    return out;
  }

  it('agrees on 1,000 random strings spanning all four UTF-8 widths', () => {
    const rand = mulberry32(0x9e3779b9);
    const mismatches: string[] = [];
    let astralSeen = 0;
    let multiByteSeen = 0;

    for (let i = 0; i < 1000; i++) {
      const input = randomString(rand, Math.floor(rand() * 200));
      if (/[\u{10000}-\u{10FFFF}]/u.test(input)) astralSeen++;
      if (new TextEncoder().encode(input).length > input.length) multiByteSeen++;

      const ours = sha1Hex(input);
      const theirs = createHash('sha1').update(input, 'utf8').digest('hex');
      if (ours !== theirs) mismatches.push(`${JSON.stringify(input)}: ${ours} !== ${theirs}`);
    }

    expect(mismatches).toEqual([]);
    // Guards the corpus itself: a generator that silently produced only ASCII
    // would make the assertion above pass while testing nothing interesting.
    expect(astralSeen, 'corpus must contain astral-plane input').toBeGreaterThan(500);
    expect(multiByteSeen, 'corpus must contain multi-byte input').toBeGreaterThan(500);
  });

  it('agrees on random raw byte sequences', () => {
    const rand = mulberry32(0x85ebca6b);
    for (let i = 0; i < 200; i++) {
      const bytes = new Uint8Array(Math.floor(rand() * 300));
      for (let j = 0; j < bytes.length; j++) bytes[j] = Math.floor(rand() * 256);
      expect(bytesToHex(sha1(bytes))).toBe(createHash('sha1').update(bytes).digest('hex'));
    }
  });
});
