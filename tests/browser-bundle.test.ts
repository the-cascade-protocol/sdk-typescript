/**
 * The published entry point must load and work in a browser.
 *
 * Two claims, checked separately because they fail in different ways:
 *
 * 1. **It bundles.** esbuild resolves every import for a browser target. A
 *    `node:` builtin on any path reachable from `src/index.ts` fails the build
 *    outright — that is what caught the `node:crypto` import this suite was
 *    written alongside — and a Node-only construct that survives resolution
 *    (an externalized builtin, an interop `require`) is caught by scanning the
 *    output text.
 *
 * 2. **It runs.** `serialize`, `deserialize`, `validate` and `toJsonLd` are
 *    exercised on a real record THROUGH THE BUNDLE, not through `src/`. A
 *    bundle that builds but throws on first call is not a passing gate, and
 *    only executing the artefact distinguishes the two.
 *
 * On the runtime used here: this imports the ESM bundle under plain Node, which
 * is adequate proof of the browser property precisely because of claim 1 — the
 * bundle contains no Node builtin, so nothing it executes could be reaching for
 * one. jsdom would add a heavyweight dependency to re-prove a property the
 * bundler already decided. What the bundle does use — `TextEncoder`, `DataView`,
 * `globalThis.crypto` — is present in both runtimes.
 */

import { describe, it, expect, beforeAll } from 'vitest';
// @ts-expect-error -- .mjs build helper, shared with the check:browser gate; it
// has no type declarations and needs none.
import { buildBrowserBundle, scanForNodeOnlyConstructs } from '../scripts/browser-bundle.mjs';

interface BundledSdk {
  serialize: (record: unknown) => string;
  deserialize: (turtle: string, type: string) => unknown[];
  deserializeOne: (turtle: string, type: string) => unknown;
  validate: (record: unknown) => { valid: boolean; errors: unknown[] };
  toJsonLd: (record: unknown) => Record<string, unknown>;
  fromJsonLd: (jsonld: Record<string, unknown>) => unknown;
  contentHashedUri: (type: string, fields: Record<string, string | undefined>) => string;
  deterministicUuid: (input: string) => string;
}

let bundle: { outfile: string; code: string };
let sdk: BundledSdk;

// esbuild plus a dynamic import of a ~120 kB module; comfortably inside the
// default timeout on CI, but stated so a slow runner fails loudly rather than
// flaking.
beforeAll(async () => {
  bundle = await buildBrowserBundle();
  sdk = (await import(/* @vite-ignore */ bundle.outfile)) as BundledSdk;
}, 60_000);

describe('browser bundle — the artefact', () => {
  it('bundles src/index.ts for a browser target', () => {
    expect(bundle.code.length).toBeGreaterThan(0);
  });

  it('contains no node: specifier and no CommonJS require(', () => {
    expect(scanForNodeOnlyConstructs(bundle.code)).toEqual([]);
  });

  it('the scan that clears the bundle actually detects what it claims to', () => {
    // Without this, the assertion above passes for a scanner that always
    // returns []. esbuild fails the build on an UNRESOLVED builtin, so the
    // scanner's job is the cases that still resolve: a builtin marked external,
    // and a `require` synthesized by an interop shim.
    expect(scanForNodeOnlyConstructs("import { createHash } from 'node:crypto';")).toHaveLength(1);
    expect(scanForNodeOnlyConstructs("const fs = require('node:fs');")).toHaveLength(2);
    expect(scanForNodeOnlyConstructs('const x = require("some-cjs-package");')).toHaveLength(1);
    // Must not fire on ordinary code that merely mentions the words.
    expect(scanForNodeOnlyConstructs('// a blank node: never an IRI\nconst required = 1;')).toEqual(
      [],
    );
  });

  it('exports the API the browser-safety requirement names', () => {
    for (const name of ['serialize', 'deserialize', 'validate', 'toJsonLd', 'fromJsonLd']) {
      expect(typeof sdk[name as keyof BundledSdk], `${name} must be exported`).toBe('function');
    }
  });
});

describe('browser bundle — the API runs', () => {
  // Shaped like a conformance fixture input: `type` is the Cascade class name
  // TYPE_MAPPING keys on, and provenance plus schema version are what the
  // validator requires.
  const record = {
    id: 'urn:uuid:9f3e1b7a-2c44-5f8d-b0e6-1a2b3c4d5e6f',
    type: 'ConditionRecord',
    conditionName: 'Postural Orthostatic Tachycardia Syndrome',
    status: 'active',
    dataProvenance: 'ClinicalGenerated',
    schemaVersion: '1.3',
    onsetDate: '2024-03-11T00:00:00Z',
    snomedCode: 'http://snomed.info/sct/371073003',
  };

  it('serializes to Turtle', () => {
    const turtle = sdk.serialize(record);
    expect(turtle).toContain('371073003');
    expect(turtle).toContain('urn:uuid:9f3e1b7a-2c44-5f8d-b0e6-1a2b3c4d5e6f');
  });

  it('round-trips through deserialize', () => {
    const turtle = sdk.serialize(record);
    const back = sdk.deserialize(turtle, 'ConditionRecord') as Record<string, unknown>[];
    expect(back.length).toBeGreaterThan(0);
    expect(back[0]?.snomedCode).toBe('http://snomed.info/sct/371073003');
  });

  it('round-trips through deserializeOne', () => {
    const one = sdk.deserializeOne(sdk.serialize(record), 'ConditionRecord') as Record<string, unknown>;
    expect(one.conditionName).toBe('Postural Orthostatic Tachycardia Syndrome');
  });

  it('validates', () => {
    expect(sdk.validate(record).valid).toBe(true);
  });

  it('round-trips through JSON-LD', () => {
    const jsonld = sdk.toJsonLd(record);
    expect(jsonld['@context']).toBeDefined();
    const back = sdk.fromJsonLd(jsonld) as Record<string, unknown>;
    expect(back.snomedCode).toBe('http://snomed.info/sct/371073003');
  });

  it('mints identity URIs without node:crypto', () => {
    // The published cross-SDK vector. Checked through the BUNDLE as well as in
    // the identity suite, because the whole point of the vendored SHA-1 is that
    // it produces this value in a runtime where `node:crypto` does not exist.
    expect(sdk.deterministicUuid('hello')).toBe('aaf4c61d-dcc5-58a2-9abe-de0f3b482cd9');
    expect(sdk.contentHashedUri('Condition', { snomedCode: '371073003' })).toBe(
      sdk.contentHashedUri('Condition', { snomedCode: '371073003' }),
    );
  });
});
