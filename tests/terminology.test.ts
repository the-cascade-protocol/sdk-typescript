/**
 * Tests for the Cascade clinical terminology resolver (S2).
 *
 * Acceptance (substrate plan S2): "Zyrtec" <-> "cetirizine" resolve; "sugar"
 * resolves to glucose; the absent-asset path is a no-op. Also pins that the
 * resolver maps onto ratified systems via CodeRef and is case-insensitive.
 */

import { describe, it, expect } from 'vitest';
import {
  createTerminologyResolver,
  cascadeTerminologyResolver,
  identityTerminologyResolver,
  CASCADE_TERMINOLOGY_VERSION,
  type TerminologyAsset,
} from '../src/utils/terminology.js';

describe('cascadeTerminologyResolver (bundled asset)', () => {
  const r = cascadeTerminologyResolver();

  it('resolves brand to generic, case-insensitively', () => {
    expect(r.toGeneric('Zyrtec')).toBe('cetirizine');
    expect(r.toGeneric('zyrtec')).toBe('cetirizine');
    expect(r.toGeneric('  LIPITOR  ')).toBe('atorvastatin');
  });

  it('returns undefined for an already-generic / unknown name', () => {
    expect(r.toGeneric('cetirizine')).toBeUndefined();
    expect(r.toGeneric('not-a-drug')).toBeUndefined();
  });

  it('resolves a lay synonym to a ratified code', () => {
    expect(r.toCodes('sugar')).toEqual([{ system: 'loinc', value: '2339-0' }]);
    expect(r.toCodes('A1C')).toEqual([{ system: 'loinc', value: '4548-4' }]);
    expect(r.toCodes('heart attack')).toEqual([{ system: 'snomed', value: '22298006' }]);
  });

  it('returns [] for an unknown concept', () => {
    expect(r.toCodes('weekend hiking')).toEqual([]);
  });

  it('exposes the asset version', () => {
    expect(r.version).toBe(CASCADE_TERMINOLOGY_VERSION);
    expect(typeof CASCADE_TERMINOLOGY_VERSION).toBe('string');
  });
});

describe('identityTerminologyResolver (degrades to no-op)', () => {
  it('every lookup misses, identical to injecting nothing', () => {
    expect(identityTerminologyResolver.toGeneric('Zyrtec')).toBeUndefined();
    expect(identityTerminologyResolver.toCodes('sugar')).toEqual([]);
    expect(identityTerminologyResolver.version).toBe('identity');
  });
});

describe('createTerminologyResolver (custom asset)', () => {
  it('builds a resolver over a hand-supplied asset', () => {
    const asset: TerminologyAsset = {
      version: 'test-1',
      brandToGeneric: { tylenol: 'acetaminophen' },
      concepts: { fever: [{ system: 'snomed', code: '386661006', display: 'Fever' }] },
    };
    const r = createTerminologyResolver(asset);
    expect(r.toGeneric('Tylenol')).toBe('acetaminophen');
    expect(r.toCodes('fever')).toEqual([{ system: 'snomed', value: '386661006' }]);
    expect(r.version).toBe('test-1');
  });
});
