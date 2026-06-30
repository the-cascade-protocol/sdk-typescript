/**
 * Deterministic code-system identification and the medication code-key ladder.
 *
 * Cascade records carry codes as system-prefixed URIs (e.g. RxNorm
 * `http://www.nlm.nih.gov/research/umls/rxnorm/29046`, SNOMED
 * `http://snomed.info/sct/271649006`). This module identifies which ratified
 * code system a URI belongs to and, for medications, ranks a record's codes by
 * the same weighted ladder Cascade Checkup uses
 * (`MedicationReconciler.ReconciliationKeyType`):
 *
 *     RxNorm (100) > SNOMED (80) > NDC (60) > ATC (40) > normalized name (20)
 *
 * Two consumers share this primitive:
 *   - the reconciler matcher (record-vs-record): an NDC-only or SNOMED-only pair
 *     still matches via {@link sharedMedicationCodeKey}, no longer over-relying
 *     on the fragile name match;
 *   - structured retrieval (claim-vs-record): a record can be indexed by every
 *     code it carries ({@link codeRefsFromUris}) so facts are fetched BY CODE
 *     rather than by loading the whole Pod.
 *
 * Determinism-first: string prefix matching only. Codes are mapped onto ratified
 * systems (RxNorm/SNOMED/NDC/ATC/LOINC/ICD-10/CVX); no codes are invented here.
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

/** Ratified code systems Cascade recognizes on records. */
export type CodeSystem =
  | 'rxnorm'
  | 'snomed'
  | 'ndc'
  | 'atc'
  | 'loinc'
  | 'icd10'
  | 'cvx';

/**
 * URI roots for each system: the standard namespace URL (with and without
 * trailing slash variants handled by `startsWith`) plus the HL7 OID. Defer to
 * ratified standards: these are the published identifiers, not Cascade-coined.
 */
const SYSTEM_ROOTS: Record<CodeSystem, readonly string[]> = {
  rxnorm: ['http://www.nlm.nih.gov/research/umls/rxnorm', 'urn:oid:2.16.840.1.113883.6.88'],
  snomed: ['http://snomed.info/sct', 'urn:oid:2.16.840.1.113883.6.96'],
  ndc: ['http://hl7.org/fhir/sid/ndc', 'urn:oid:2.16.840.1.113883.6.69'],
  atc: ['http://www.whocc.no/atc', 'urn:oid:2.16.840.1.113883.6.73'],
  loinc: ['http://loinc.org', 'urn:oid:2.16.840.1.113883.6.1'],
  icd10: ['http://hl7.org/fhir/sid/icd-10', 'urn:oid:2.16.840.1.113883.6.90', 'urn:oid:2.16.840.1.113883.6.3'],
  cvx: ['http://hl7.org/fhir/sid/cvx', 'urn:oid:2.16.840.1.113883.12.292'],
};

/** Identify the ratified code system a code URI belongs to, if recognized. */
export function classifyCodeSystem(uri: string): CodeSystem | undefined {
  for (const system of Object.keys(SYSTEM_ROOTS) as CodeSystem[]) {
    if (SYSTEM_ROOTS[system].some((root) => uri.startsWith(root))) return system;
  }
  return undefined;
}

/**
 * Extract the bare code value from a code URI: the final path segment, then the
 * final fragment. `.../rxnorm/29046` -> `29046`; `http://loinc.org/rdf#4548-4`
 * -> `4548-4`. A bare value (no `/` or `#`) is returned unchanged.
 */
export function extractCodeValue(uri: string): string {
  const lastPath = uri.includes('/') ? uri.slice(uri.lastIndexOf('/') + 1) : uri;
  return lastPath.includes('#') ? lastPath.slice(lastPath.lastIndexOf('#') + 1) : lastPath;
}

/** A recognized code on a record. */
export interface CodeRef {
  system: CodeSystem;
  value: string;
}

/**
 * All recognized, de-duplicated code refs from a set of code URIs, regardless of
 * system. The general index key extractor: a record is findable by any code it
 * carries. Unrecognized URIs are skipped.
 */
export function codeRefsFromUris(uris: Iterable<string>): CodeRef[] {
  const out: CodeRef[] = [];
  const seen = new Set<string>();
  for (const uri of uris) {
    const system = classifyCodeSystem(uri);
    if (!system) continue;
    const value = extractCodeValue(uri);
    const k = `${system}:${value}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ system, value });
    }
  }
  return out;
}

// ─── Medication identity ladder ────────────────────────────────────────────--

/** Drug-code systems and their identity strength (Checkup ReconciliationKeyType). */
export const MEDICATION_CODE_TIER: Record<'rxnorm' | 'snomed' | 'ndc' | 'atc', number> = {
  rxnorm: 100,
  snomed: 80,
  ndc: 60,
  atc: 40,
};

/** Tier for the normalized-name fallback key (weakest identity). */
export const MEDICATION_NAME_TIER = 20;

/** A medication identity key: a coded key, or the normalized-name fallback. */
export interface CodeKey {
  /** Code system, or `'name'` for the normalized-name fallback. */
  system: CodeSystem | 'name';
  /** Bare code value, or the normalized name when `system === 'name'`. */
  value: string;
  /** Identity strength; higher binds more tightly. */
  tier: number;
}

function isDrugSystem(system: CodeSystem): system is 'rxnorm' | 'snomed' | 'ndc' | 'atc' {
  return system in MEDICATION_CODE_TIER;
}

/**
 * The medication identity keys a record carries, strongest first, with an
 * optional normalized-name fallback appended last. Only drug-code systems
 * (RxNorm/SNOMED/NDC/ATC) contribute coded keys; LOINC/ICD-10/CVX are ignored.
 *
 * @param codeUris - The record's code URIs (`clinical:rxNormCode` plus the
 *   repeated `clinical:drugCode[]`).
 * @param normalizedName - The match-normalized drug name (see
 *   {@link normalizeMedName}); contributes the weakest fallback key.
 */
export function medicationCodeKeys(codeUris: Iterable<string>, normalizedName?: string): CodeKey[] {
  const keys: CodeKey[] = [];
  for (const { system, value } of codeRefsFromUris(codeUris)) {
    if (isDrugSystem(system)) {
      keys.push({ system, value, tier: MEDICATION_CODE_TIER[system] });
    }
  }
  keys.sort((a, b) => b.tier - a.tier);
  if (normalizedName && normalizedName.length > 0) {
    keys.push({ system: 'name', value: normalizedName, tier: MEDICATION_NAME_TIER });
  }
  return keys;
}

/** The single strongest medication identity key, or undefined if none. */
export function strongestMedicationCodeKey(
  codeUris: Iterable<string>,
  normalizedName?: string,
): CodeKey | undefined {
  return medicationCodeKeys(codeUris, normalizedName)[0];
}

/**
 * The strongest identity key shared by two medications, walking the ladder
 * (RxNorm > SNOMED > NDC > ATC, then a normalized-name match), or undefined when
 * they share none. This is what lets an NDC-only or SNOMED-only pair match
 * without an RxNorm code. `a` should be tier-sorted (as {@link medicationCodeKeys}
 * returns it); the first shared key found is therefore the strongest.
 */
export function sharedMedicationCodeKey(a: CodeKey[], b: CodeKey[]): CodeKey | undefined {
  const bKeys = new Set(b.map((k) => `${k.system}:${k.value}`));
  for (const k of a) {
    if (bKeys.has(`${k.system}:${k.value}`)) return k;
  }
  return undefined;
}
