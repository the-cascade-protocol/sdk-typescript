/**
 * SHA-1, implemented from FIPS PUB 180-4 §6.1.
 *
 * **Why this file exists.** The SDK's identity function hashes with SHA-1, and
 * that choice is published: the algorithm is part of the cross-SDK CDP-UUID rule
 * in {@link ../utils/deterministic-uri.ts}, so changing it would move every URI
 * every Cascade pod already holds. The identity function is also synchronous,
 * because it is called from ordinary record-construction code paths that are not
 * async. Those two facts together rule out both available platform options:
 * `node:crypto`'s `createHash` is Node-only, and `crypto.subtle.digest` is
 * async-only. What is left is a pure-JS implementation with no runtime
 * dependency, which is this file.
 *
 * **Original work, no third-party licence.** This is written directly from the
 * published standard rather than copied from an existing library, so the package
 * carries no additional licence obligation and no NOTICE entry.
 *
 * **Not for security.** SHA-1 is cryptographically broken for collision
 * resistance and nothing here should be used to authenticate anything. Its only
 * job is to derive a stable identifier from content that is not adversarial.
 *
 * @see https://doi.org/10.6028/NIST.FIPS.180-4
 * @internal
 */

/** FIPS 180-4 §4.2.1: the four round constants K(t). */
const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6] as const;

/** FIPS 180-4 §5.3.1: the initial hash value H(0). */
const H0 = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0] as const;

/** Circular left shift, ROTL^n(x), on a 32-bit word (§3.2). */
function rotl(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

/**
 * FIPS 180-4 §5.1.1 (padding), §5.2.1 (parsing) and §6.1.2 (the hash
 * computation), over a byte sequence.
 *
 * @param message - The bytes to hash.
 * @returns The 20-byte message digest.
 */
export function sha1(message: Uint8Array): Uint8Array {
  const byteLength = message.length;
  const bitLength = byteLength * 8;

  // §5.1.1: append 0x80, then the fewest zero bytes such that the total is 8
  // short of a multiple of 64, then the message length in bits as a 64-bit
  // big-endian integer.
  const blockCount = Math.ceil((byteLength + 1 + 8) / 64);
  const padded = new Uint8Array(blockCount * 64);
  padded.set(message);
  padded[byteLength] = 0x80;

  const view = new DataView(padded.buffer);
  // Split the bit length across two 32-bit words rather than using BigInt: a
  // JS number holds an exact integer to 2^53, far past any string this SDK
  // hashes, and the high word matters only above 2^29 bytes of input.
  view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(padded.length - 4, bitLength >>> 0, false);

  let [h0, h1, h2, h3, h4] = H0 as unknown as [number, number, number, number, number];

  // The message schedule W(t), reused across blocks (§6.1.2 step 1).
  const w = new Uint32Array(80);

  for (let block = 0; block < blockCount; block++) {
    const base = block * 64;

    for (let t = 0; t < 16; t++) w[t] = view.getUint32(base + t * 4, false);
    for (let t = 16; t < 80; t++) {
      w[t] = rotl((w[t - 3]! ^ w[t - 8]! ^ w[t - 14]! ^ w[t - 16]!) >>> 0, 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let t = 0; t < 80; t++) {
      // §4.1.1: the four functions f(t), selected by round.
      let f: number;
      let k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = K[0];
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = K[1];
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = K[2];
      } else {
        f = b ^ c ^ d;
        k = K[3];
      }

      // Addition is modulo 2^32. `| 0` after each accumulation keeps the value
      // in int32 range so no intermediate exceeds the 2^53 exact-integer limit.
      const temp = (((rotl(a, 5) + (f >>> 0)) | 0) + ((e + k) | 0) + w[t]!) | 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  const digest = new Uint8Array(20);
  const out = new DataView(digest.buffer);
  out.setUint32(0, h0 >>> 0, false);
  out.setUint32(4, h1 >>> 0, false);
  out.setUint32(8, h2 >>> 0, false);
  out.setUint32(12, h3 >>> 0, false);
  out.setUint32(16, h4 >>> 0, false);
  return digest;
}

/** Lowercase hexadecimal, the form `createHash(...).digest('hex')` returns. */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex;
}

/**
 * SHA-1 of a string's UTF-8 encoding, as lowercase hex.
 *
 * `TextEncoder` always encodes UTF-8 and is present in every supported runtime,
 * so this matches `createHash('sha1').update(str).digest('hex')` exactly —
 * including for astral-plane characters, which arrive as surrogate pairs in a
 * JS string and encode to four bytes each.
 */
export function sha1Hex(input: string): string {
  return bytesToHex(sha1(new TextEncoder().encode(input)));
}
