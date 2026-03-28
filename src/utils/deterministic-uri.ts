/**
 * Deterministic URI generation for Cascade Protocol records.
 *
 * Generates stable `urn:uuid:` identifiers from record content so that
 * equivalent records produced by different SDKs or import runs yield the
 * same URI.  The algorithm is shared across all Cascade SDKs (Swift, Python,
 * TypeScript, cascade-cli) and MUST NOT be changed without a cross-SDK
 * coordination step.
 *
 * Algorithm: CDP-UUID (Cascade Protocol Deterministic UUID)
 * Input format: "{resourceType}::{sortedKeyValuePairs}"
 * Cross-SDK test vector: deterministicUuid("hello") === "aaf4c61d-dcc5-5e8a-adab-ede0f3b482cd"
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import { createHash, randomUUID } from 'node:crypto';

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Derives a version-5-style UUID from an arbitrary string using SHA-1.
 *
 * Note: This is NOT RFC 4122 name-based UUID v5 (which uses a namespace
 * prefix in the hash input).  It is a Cascade-specific deterministic UUID
 * whose only guarantee is cross-SDK stability for the same input string.
 *
 * @internal
 */
function deterministicUuid(input: string): string {
  const hash = createHash('sha1').update(input).digest('hex');
  const v = ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');
  return (
    `${hash.slice(0, 8)}-` +
    `${hash.slice(8, 12)}-` +
    `5${hash.slice(13, 16)}-` +
    `${v}${hash.slice(18, 20)}-` +
    `${hash.slice(20, 32)}`
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generates a deterministic `urn:uuid:` URI from structured content fields.
 *
 * The URI is stable: identical `resourceType` + `contentFields` values will
 * always produce the same URI, across SDK languages and import runs.
 *
 * **Fallback behaviour:**
 * 1. If at least one non-empty content field is present the URI is derived
 *    from `{resourceType}::{sortedKeyValuePairs}`.
 * 2. If all content fields are absent/empty but a `fallbackId` is supplied
 *    the URI is derived from `{resourceType}:{fallbackId}`.
 * 3. Otherwise a random UUID is used (non-deterministic).
 *
 * @param resourceType - FHIR/Cascade resource name, e.g. `"Immunization"`.
 * @param contentFields - Key/value pairs that uniquely identify the record.
 *   `undefined` and blank values are ignored.
 * @param fallbackId - Optional source record ID used when content fields are
 *   all absent.
 *
 * @example
 * ```typescript
 * const uri = contentHashedUri('Immunization', {
 *   cvxCode: '140',
 *   date: '2023-10-01',
 *   patient: 'urn:uuid:abc123',
 * });
 * // => "urn:uuid:<deterministic-uuid>"
 * ```
 */
export function contentHashedUri(
  resourceType: string,
  contentFields: Record<string, string | undefined>,
  fallbackId?: string,
): string {
  const content = Object.entries(contentFields)
    .filter(([, v]) => v != null && v.trim().length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('|');

  if (content.length > 0) {
    return `urn:uuid:${deterministicUuid(`${resourceType}::${content}`)}`;
  }
  if (fallbackId) {
    return `urn:uuid:${deterministicUuid(`${resourceType}:${fallbackId}`)}`;
  }
  return `urn:uuid:${randomUUID()}`;
}

// ─── Typed Convenience Helpers ───────────────────────────────────────────────

/**
 * Deterministic URI for a `Patient` record.
 *
 * @param fields - Identifying fields: date of birth, sex, family name, given name.
 */
export function patientUri(fields: {
  dob?: string;
  sex?: string;
  family?: string;
  given?: string;
}): string {
  return contentHashedUri('Patient', fields);
}

/**
 * Deterministic URI for an `Immunization` record.
 *
 * @param fields - CVX vaccine code, administration date, patient URI.
 */
export function immunizationUri(fields: {
  cvxCode?: string;
  date?: string;
  patient?: string;
}): string {
  return contentHashedUri('Immunization', fields);
}

/**
 * Deterministic URI for an `Observation` record.
 *
 * @param fields - LOINC code, observation date, patient URI.
 */
export function observationUri(fields: {
  loincCode?: string;
  date?: string;
  patient?: string;
}): string {
  return contentHashedUri('Observation', fields);
}

/**
 * Deterministic URI for a `Condition` record.
 *
 * @param fields - SNOMED CT code, ICD-10 code, onset date, patient URI.
 */
export function conditionUri(fields: {
  snomedCode?: string;
  icd10Code?: string;
  onsetDate?: string;
  patient?: string;
}): string {
  return contentHashedUri('Condition', fields);
}

/**
 * Deterministic URI for an `AllergyIntolerance` record.
 *
 * @param fields - Allergen code, allergen name, patient URI.
 */
export function allergyUri(fields: {
  allergenCode?: string;
  allergenName?: string;
  patient?: string;
}): string {
  return contentHashedUri('AllergyIntolerance', fields);
}

/**
 * Deterministic URI for a `MedicationRequest` record.
 *
 * @param fields - RxNorm code, start date, patient URI.
 */
export function medicationUri(fields: {
  rxNormCode?: string;
  startDate?: string;
  patient?: string;
}): string {
  return contentHashedUri('MedicationRequest', fields);
}
