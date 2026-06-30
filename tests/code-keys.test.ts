/**
 * Tests for code-system identification and the medication code-key ladder.
 *
 * These vectors are shared with cascade-cli (`tests/code-keys.test.ts`); the CLI
 * holds a byte-identical copy of the module (the deterministicUuid / normalizer
 * arrangement), so the reconciler and the grounder classify codes identically.
 */

import { describe, it, expect } from 'vitest';
import {
  classifyCodeSystem,
  extractCodeValue,
  codeRefsFromUris,
  medicationCodeKeys,
  strongestMedicationCodeKey,
  sharedMedicationCodeKey,
} from '../src/utils/code-keys.js';

const RX = 'http://www.nlm.nih.gov/research/umls/rxnorm/29046';
const SCT = 'http://snomed.info/sct/271649006';
const NDC = 'http://hl7.org/fhir/sid/ndc/0071-0155';
const ATC = 'http://www.whocc.no/atc/C09AA03';
const LOINC = 'http://loinc.org/rdf#4548-4';

describe('classifyCodeSystem', () => {
  it('identifies the ratified drug + lab systems by URI root', () => {
    expect(classifyCodeSystem(RX)).toBe('rxnorm');
    expect(classifyCodeSystem(SCT)).toBe('snomed');
    expect(classifyCodeSystem(NDC)).toBe('ndc');
    expect(classifyCodeSystem(ATC)).toBe('atc');
    expect(classifyCodeSystem(LOINC)).toBe('loinc');
    expect(classifyCodeSystem('http://hl7.org/fhir/sid/icd-10-cm/I10')).toBe('icd10');
    expect(classifyCodeSystem('http://hl7.org/fhir/sid/cvx/140')).toBe('cvx');
  });

  it('handles HL7 OID system forms', () => {
    expect(classifyCodeSystem('urn:oid:2.16.840.1.113883.6.88')).toBe('rxnorm');
    expect(classifyCodeSystem('urn:oid:2.16.840.1.113883.6.69')).toBe('ndc');
  });

  it('returns undefined for an unrecognized system', () => {
    expect(classifyCodeSystem('http://example.org/codes/123')).toBeUndefined();
  });
});

describe('extractCodeValue', () => {
  it('returns the final path segment', () => {
    expect(extractCodeValue(RX)).toBe('29046');
    expect(extractCodeValue(NDC)).toBe('0071-0155');
  });

  it('returns the final fragment for rdf# URIs', () => {
    expect(extractCodeValue(LOINC)).toBe('4548-4');
  });

  it('returns a bare value unchanged', () => {
    expect(extractCodeValue('29046')).toBe('29046');
  });
});

describe('codeRefsFromUris', () => {
  it('collects recognized refs across systems and de-dupes', () => {
    const refs = codeRefsFromUris([RX, SCT, RX, 'http://example.org/x/1']);
    expect(refs).toEqual([
      { system: 'rxnorm', value: '29046' },
      { system: 'snomed', value: '271649006' },
    ]);
  });
});

describe('medicationCodeKeys', () => {
  it('ranks drug codes by the ladder and ignores non-drug systems', () => {
    const keys = medicationCodeKeys([ATC, LOINC, SCT, RX, NDC], 'lisinopril');
    expect(keys.map((k) => k.system)).toEqual(['rxnorm', 'snomed', 'ndc', 'atc', 'name']);
    expect(keys.map((k) => k.tier)).toEqual([100, 80, 60, 40, 20]);
  });

  it('appends the normalized-name fallback only when provided', () => {
    expect(medicationCodeKeys([], 'metformin')).toEqual([
      { system: 'name', value: 'metformin', tier: 20 },
    ]);
    expect(medicationCodeKeys([])).toEqual([]);
  });

  it('strongest key prefers RxNorm', () => {
    expect(strongestMedicationCodeKey([NDC, RX])?.system).toBe('rxnorm');
  });
});

describe('sharedMedicationCodeKey', () => {
  it('matches an NDC-only pair (no RxNorm)', () => {
    const a = medicationCodeKeys([NDC], 'lisinopril');
    const b = medicationCodeKeys([NDC], 'zestril');
    expect(sharedMedicationCodeKey(a, b)?.system).toBe('ndc');
  });

  it('matches a SNOMED-only pair', () => {
    const a = medicationCodeKeys([SCT]);
    const b = medicationCodeKeys([SCT]);
    expect(sharedMedicationCodeKey(a, b)?.system).toBe('snomed');
  });

  it('prefers the strongest shared tier when several overlap', () => {
    const a = medicationCodeKeys([RX, SCT]);
    const b = medicationCodeKeys([RX, SCT]);
    expect(sharedMedicationCodeKey(a, b)?.system).toBe('rxnorm');
  });

  it('falls back to a shared normalized name', () => {
    const a = medicationCodeKeys([], 'lisinopril');
    const b = medicationCodeKeys([], 'lisinopril');
    expect(sharedMedicationCodeKey(a, b)).toEqual({ system: 'name', value: 'lisinopril', tier: 20 });
  });

  it('returns undefined when nothing is shared', () => {
    const a = medicationCodeKeys([RX], 'lisinopril');
    const b = medicationCodeKeys([SCT], 'metformin');
    expect(sharedMedicationCodeKey(a, b)).toBeUndefined();
  });
});
