/**
 * Tests for the vocabulary namespace + predicate registries and the generated
 * JSON-LD context.
 *
 * Covers the v1-draft batched sync additions (spec PENDING_DOWNSTREAM_SYNC rows
 * 1-3): the evidence facet predicates, workbench:userSourceLabel, and the
 * external namespaces the notes substrate reuses (oa / ical / skos). Draft
 * vocabularies are registered so terms round-trip, but are deliberately excluded
 * from the generated JSON-LD context until v1.0 graduation.
 */

import { describe, it, expect } from 'vitest';
import { NAMESPACES, PROPERTY_PREDICATES } from '../src/vocabularies/index.js';
import { getContext } from '../src/jsonld/index.js';

describe('draft vocabulary namespaces', () => {
  it('registers the draft and external namespaces', () => {
    expect(NAMESPACES.evidence).toBe('https://ns.cascadeprotocol.org/evidence/v1#');
    expect(NAMESPACES.workbench).toBe('https://ns.cascadeprotocol.org/workbench/v1#');
    expect(NAMESPACES.oa).toBe('http://www.w3.org/ns/oa#');
    expect(NAMESPACES.ical).toBe('http://www.w3.org/2002/12/cal/ical#');
    expect(NAMESPACES.skos).toBe('http://www.w3.org/2004/02/skos/core#');
  });
});

describe('draft vocabulary predicates', () => {
  it('registers the evidence facet predicates', () => {
    for (const name of ['direction', 'basis', 'strength', 'settled', 'reason', 'confidence']) {
      expect(PROPERTY_PREDICATES[name]).toBe(`evidence:${name}`);
    }
  });

  it('registers workbench:userSourceLabel', () => {
    expect(PROPERTY_PREDICATES.userSourceLabel).toBe('workbench:userSourceLabel');
  });
});

describe('JSON-LD context excludes draft vocabularies (until v1.0 graduation)', () => {
  it('omits draft namespaces and draft predicates', () => {
    const ctx = (getContext() as { '@context': Record<string, unknown> })['@context'];
    // Draft namespaces are not present.
    for (const prefix of ['evidence', 'workbench', 'oa', 'ical', 'skos']) {
      expect(ctx[prefix]).toBeUndefined();
    }
    // Draft predicates are not present.
    for (const key of ['direction', 'basis', 'strength', 'settled', 'reason', 'confidence', 'userSourceLabel']) {
      expect(ctx[key]).toBeUndefined();
    }
    // A released namespace and predicate are still present (regression guard).
    expect(ctx.clinical).toBe('https://ns.cascadeprotocol.org/clinical/v1#');
    expect(ctx.dataProvenance).toBeDefined();
  });
});
