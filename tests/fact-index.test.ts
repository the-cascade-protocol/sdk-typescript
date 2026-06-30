/**
 * Tests for the shared code-keyed fact index (slice-4).
 *
 * Pins the contract both consumers build against: a fact is found by ANY code it
 * carries and by its normalized name; candidates() returns same-key records
 * (the reconciler's match pre-filter) excluding the fact itself; lookups are
 * deterministic (insertion order); startDate is NOT a key (retrieval must not be
 * fragmented by it).
 */

import { describe, it, expect } from 'vitest';
import { InMemoryFactIndex, type IndexableFact } from '../src/utils/fact-index.js';

const RX = 'http://www.nlm.nih.gov/research/umls/rxnorm/29046';
const NDC = 'http://hl7.org/fhir/sid/ndc/0071-0155';
const LOINC = 'http://loinc.org/rdf#4548-4';

const lisinoprilA: IndexableFact = {
  id: 'urn:med:a',
  type: 'clinical:Medication',
  codeUris: [RX, NDC],
  normalizedName: 'lisinopril',
};
const lisinoprilB: IndexableFact = {
  id: 'urn:med:b',
  type: 'clinical:Medication',
  codeUris: [RX],
  normalizedName: 'lisinopril',
};
const hba1c: IndexableFact = {
  id: 'urn:lab:1',
  type: 'health:LabResultRecord',
  codeUris: [LOINC],
  normalizedName: 'hemoglobin a1c',
};

describe('InMemoryFactIndex', () => {
  it('finds a fact by any code it carries', () => {
    const idx = new InMemoryFactIndex();
    idx.add(lisinoprilA);
    expect(idx.lookup({ system: 'rxnorm', value: '29046' })).toEqual(['urn:med:a']);
    expect(idx.lookup({ system: 'ndc', value: '0071-0155' })).toEqual(['urn:med:a']);
    expect(idx.lookup({ system: 'loinc', value: '4548-4' })).toEqual([]);
  });

  it('finds a fact by normalized name', () => {
    const idx = new InMemoryFactIndex();
    idx.addAll([lisinoprilA, hba1c]);
    expect(idx.lookup({ normalizedName: 'lisinopril' })).toEqual(['urn:med:a']);
    expect(idx.lookup({ normalizedName: 'hemoglobin a1c' })).toEqual(['urn:lab:1']);
  });

  it('returns ids in insertion order (deterministic)', () => {
    const idx = new InMemoryFactIndex();
    idx.addAll([lisinoprilA, lisinoprilB]);
    expect(idx.lookup({ system: 'rxnorm', value: '29046' })).toEqual(['urn:med:a', 'urn:med:b']);
    expect(idx.lookup({ normalizedName: 'lisinopril' })).toEqual(['urn:med:a', 'urn:med:b']);
  });

  it('candidates() returns same-key records, excluding the fact itself', () => {
    const idx = new InMemoryFactIndex();
    idx.addAll([lisinoprilA, lisinoprilB, hba1c]);
    // B shares the RxNorm code (and the name) with A; the lab shares nothing.
    expect(idx.candidates(lisinoprilA)).toEqual(['urn:med:b']);
    expect(idx.candidates(hba1c)).toEqual([]);
  });

  it('is idempotent per id and reports size', () => {
    const idx = new InMemoryFactIndex();
    idx.add(lisinoprilA);
    idx.add(lisinoprilA); // same id again
    expect(idx.size).toBe(1);
    expect(idx.lookup({ system: 'rxnorm', value: '29046' })).toEqual(['urn:med:a']);
  });

  it('ignores unrecognized code systems', () => {
    const idx = new InMemoryFactIndex();
    idx.add({ id: 'urn:x', codeUris: ['http://example.org/codes/1'], normalizedName: 'x' });
    expect(idx.lookup({ normalizedName: 'x' })).toEqual(['urn:x']);
    expect(idx.size).toBe(1);
  });
});
