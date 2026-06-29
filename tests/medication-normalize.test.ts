/**
 * Tests for deterministic medication-field normalization.
 *
 * `normalizeMedName` is a behaviour-preserving port of the cascade-cli
 * reconciler's normalizer, so these cases double as the regression contract the
 * CLI must keep matching after it swaps to this import. `normalizeDose` /
 * `normalizeFrequency` mirror Cascade Checkup's `MedicationReconciler` rules.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeMedName,
  normalizeDose,
  normalizeFrequency,
  normalizeRoute,
} from '../src/utils/medication-normalize.js';

// ─── normalizeMedName (CLI parity) ────────────────────────────────────────────

describe('normalizeMedName', () => {
  it('lowercases and trims', () => {
    expect(normalizeMedName('  Lisinopril  ')).toBe('lisinopril');
  });

  it('strips dose/unit tokens so different doses share an identity', () => {
    expect(normalizeMedName('Lisinopril 10 mg')).toBe('lisinopril');
    expect(normalizeMedName('Lisinopril 20 mg')).toBe('lisinopril');
    expect(normalizeMedName('Lisinopril 10 mg')).toBe(normalizeMedName('Lisinopril 20 mg'));
  });

  it('strips a variety of unit tokens', () => {
    expect(normalizeMedName('Albuterol 90 mcg')).toBe('albuterol');
    expect(normalizeMedName('Insulin 100 units')).toBe('insulin');
    expect(normalizeMedName('Potassium 40 meq')).toBe('potassium');
    expect(normalizeMedName('Vitamin D 1000 iu')).toBe('vitamin d');
  });

  it('preserves a trailing "%" token (documents the verbatim CLI quirk)', () => {
    // The ported regex ends each unit alternative with `\b`; after a non-word
    // "%" at end-of-token there is no word boundary, so "5 %" is NOT stripped.
    // This is the cascade-cli behaviour at the time of the port; preserved here
    // intentionally so the CLI swap is provably behaviour-identical.
    expect(normalizeMedName('Lidocaine 5 %')).toBe('lidocaine 5 %');
  });

  it('strips form/route tokens', () => {
    expect(normalizeMedName('Lisinopril 10 mg Oral Tablet')).toBe('lisinopril');
    expect(normalizeMedName('Metformin Extended Release')).toBe('metformin');
    expect(normalizeMedName('Diltiazem ER')).toBe('diltiazem');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeMedName('Amoxicillin    Clavulanate')).toBe('amoxicillin clavulanate');
  });

  it('is idempotent', () => {
    const once = normalizeMedName('Lisinopril 10 mg Oral Tablet');
    expect(normalizeMedName(once)).toBe(once);
  });

  it('handles empty input', () => {
    expect(normalizeMedName('')).toBe('');
  });
});

// ─── normalizeDose ─────────────────────────────────────────────────────────--

describe('normalizeDose', () => {
  it('removes whitespace so spacing differences compare equal', () => {
    expect(normalizeDose('10 mg')).toBe('10mg');
    expect(normalizeDose('10mg')).toBe('10mg');
    expect(normalizeDose('10 mg')).toBe(normalizeDose('10mg'));
  });

  it('folds spelled-out units to abbreviations', () => {
    expect(normalizeDose('10 milligrams')).toBe('10mg');
    expect(normalizeDose('90 micrograms')).toBe('90mcg');
    expect(normalizeDose('1 gram')).toBe('1g');
  });

  it('folds plural abbreviations', () => {
    expect(normalizeDose('10 mgs')).toBe('10mg');
    expect(normalizeDose('90 mcgs')).toBe('90mcg');
  });

  it('treats milligram and mg variants as equal', () => {
    expect(normalizeDose('10 milligram')).toBe(normalizeDose('10 mg'));
  });

  it('does NOT collapse genuinely different doses', () => {
    expect(normalizeDose('10 mg')).not.toBe(normalizeDose('20 mg'));
  });
});

// ─── normalizeFrequency ────────────────────────────────────────────────────--

describe('normalizeFrequency', () => {
  it('folds once-daily phrasings to qd', () => {
    expect(normalizeFrequency('once daily')).toBe('qd');
    expect(normalizeFrequency('once a day')).toBe('qd');
    expect(normalizeFrequency('every day')).toBe('qd');
    expect(normalizeFrequency('Daily')).toBe('qd');
  });

  it('folds higher frequencies', () => {
    expect(normalizeFrequency('twice daily')).toBe('bid');
    expect(normalizeFrequency('twice a day')).toBe('bid');
    expect(normalizeFrequency('three times daily')).toBe('tid');
    expect(normalizeFrequency('four times a day')).toBe('qid');
  });

  it('folds the specific phrase before the bare "daily" (order matters)', () => {
    // "once daily" must become "qd", never "once qd".
    expect(normalizeFrequency('once daily')).toBe('qd');
  });

  it('treats equivalent phrasings as equal', () => {
    expect(normalizeFrequency('once daily')).toBe(normalizeFrequency('every day'));
  });
});

// ─── normalizeRoute ──────────────────────────────────────────────────────────

describe('normalizeRoute', () => {
  it('canonicalizes known oral synonyms', () => {
    expect(normalizeRoute('PO')).toBe('oral');
    expect(normalizeRoute('By Mouth')).toBe('oral');
    expect(normalizeRoute('orally')).toBe('oral');
  });

  it('canonicalizes inhalation synonyms', () => {
    expect(normalizeRoute('Inhaled')).toBe('inhalation');
    expect(normalizeRoute('nebulized')).toBe('inhalation');
  });

  it('degrades to lowercased/trimmed identity for unknown routes', () => {
    expect(normalizeRoute('  Buccal ')).toBe('buccal');
  });
});
