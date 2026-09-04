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
 * Cross-SDK test vector: deterministicUuid("hello") === "aaf4c61d-dcc5-58a2-9abe-de0f3b482cd9"
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

// SHA-1 comes from a vendored pure-JS implementation, not `node:crypto`. This
// module sits on the package barrel, so a `node:` import here made the whole SDK
// unloadable in a browser — and a browser is where most of the places a patient
// meets a pod actually run. The three candidates and why only one works:
//
//   - `node:crypto` `createHash`  — synchronous, but Node-only.
//   - `crypto.subtle.digest`      — universal, but ASYNC-ONLY, and this function
//                                   is called from synchronous record
//                                   construction throughout the SDK and its
//                                   consumers. Making it async is a breaking
//                                   change to every caller.
//   - a vendored pure-JS SHA-1    — synchronous AND universal.
//
// Changing the ALGORITHM was never an option: SHA-1 is named in the cross-SDK
// CDP-UUID rule above, so a different digest would move every URI every pod
// already holds. See `../vendor/sha1.ts`.
import { sha1Hex } from '../vendor/sha1.js';
import type { MultiValue } from '../models/common.js';

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
export function deterministicUuid(input: string): string {
  const hash = sha1Hex(input);
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

// ─── Why neither sort site here calls `localeCompare` ────────────────────────
//
// This note governs BOTH string sorts in this file: the members of a set-valued
// field in `canonicalFieldValue`, and the identity keys in `contentHashedUri`.
/*
 * core v3.6 states it normatively on `cascade:cascadeUri`: "Sort ascending by
 * Unicode code point. (Code point, not locale collation: a locale-dependent
 * order would make identity depend on the machine.)" A collator orders `alpha`
 * before `Zeta` and `_under` before `Alpha`; code point orders both the other
 * way, and a collator's answer additionally varies with locale and ICU build.
 * An identifier is not an identifier if the machine that minted it is an input.
 *
 * The honest statement of what `<` and the default `Array.prototype.sort`
 * comparator actually do: they compare by UTF-16 **code unit**, not by code
 * point. The two orders are identical for every character in the Basic
 * Multilingual Plane, and they diverge only when an astral-plane character
 * (>= U+10000, encoded as a surrogate pair in the range U+D800..U+DFFF) is
 * compared against a BMP character at or above U+E000: by code point the
 * astral character sorts last, by code unit it sorts before the U+E000 one.
 *
 * That divergence cannot be reached by the identity KEYS, which are ASCII field
 * names. It is reachable in principle by a set-valued field's MEMBERS, which are
 * caller-supplied strings; in practice those are terminology codes. Correcting
 * it would mean comparing by code point explicitly, which would itself re-mint
 * any identifier that had ever hashed such a member — so it is documented here
 * rather than silently changed.
 */

/**
 * Reduce one content-field value to the string that enters the hash.
 *
 * This is the canonical form core v3.6 states normatively on
 * `cascade:cascadeUri`, and it exists because an identifier hashed over an
 * unordered field is not an identifier. `CodeableConcept.coding` is a SET: two
 * exports of one record that list the same codings in a different order are the
 * same record, and an identity that depended on the order would split it in two.
 *
 * The rule:
 *
 * 1. A **scalar passes through untouched** — no trim, no change. This is not an
 *    oversight and must not be "tidied": it is what makes every URI minted
 *    before the code fields became repeatable mint identically now.
 * 2. An **array** has its null and blank-after-trim members discarded, each
 *    survivor trimmed, the survivors deduplicated, sorted ascending by code
 *    point, and joined with `,`.
 * 3. A **one-element array canonicalizes to exactly the bare scalar form**, so a
 *    field that held one code and now holds a list of one code keeps its
 *    identity.
 * 4. An array with no surviving member is **absent**, exactly as `undefined` is.
 *
 * Sorting uses the default comparator, i.e. UTF-16 code-unit order, NOT
 * `localeCompare`. See the note at the top of this section for why that is the
 * whole point, and for the one case where code units and code points diverge.
 *
 * **Scope, and the one place this must not be used.** It is for inputs whose
 * source element is a set. It must NOT be applied to an input whose source order
 * carries meaning — FHIR `name[0]` is the primary name, and a component or note
 * list is a sequence — because sorting there merges records the source
 * deliberately kept apart.
 *
 * Exported so the rule is testable directly rather than only through the URIs it
 * feeds, and so a caller assembling its own identity string uses the same one.
 */
export function canonicalFieldValue(value: MultiValue<string> | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return value;
  const seen = new Set<string>();
  for (const item of value) {
    if (item === undefined || item === null) continue;
    const trimmed = item.trim();
    if (trimmed.length > 0) seen.add(trimmed);
  }
  return seen.size > 0 ? [...seen].sort().join(',') : undefined;
}

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
 * **Multi-valued fields (core v3.6).** A value may be an array, because
 * health v2.6 and clinical v1.14 made `icd10Code`, `snomedCode`, `testCode` and
 * `labCategory` 0..\* to match FHIR `CodeableConcept.coding`, and a caller
 * holding a record's field passes whatever that field holds. Arrays are
 * canonicalized before hashing — see {@link canonicalFieldValue}.
 *
 * @param resourceType - FHIR/Cascade resource name, e.g. `"Immunization"`.
 * @param contentFields - Key/value pairs that uniquely identify the record. A
 *   value is a string or an array of strings. `undefined` and blank values are
 *   ignored.
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
  contentFields: Record<string, MultiValue<string> | undefined>,
  fallbackId?: string,
): string {
  const content = Object.entries(contentFields)
    .map(([k, v]) => [k, canonicalFieldValue(v)] as const)
    .filter(([, v]) => v != null && v.trim().length > 0)
    // Key order is part of the identity, so it is compared directly rather than
    // with `localeCompare`. core v3.6 on `cascade:cascadeUri`: "Sort ascending
    // by Unicode code point. (Code point, not locale collation: a
    // locale-dependent order would make identity depend on the machine.)" See
    // the note above `canonicalFieldValue`.
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('|');

  if (content.length > 0) {
    return `urn:uuid:${deterministicUuid(`${resourceType}::${content}`)}`;
  }
  if (fallbackId) {
    return `urn:uuid:${deterministicUuid(`${resourceType}:${fallbackId}`)}`;
  }
  // `globalThis.crypto`, not `node:crypto`: the Web Crypto global is standard in
  // browsers and, since Node 19, in Node too — which is why `engines.node` is
  // `>=20`. Deliberately NOT wrapped in a dynamic-import fallback: a conditional
  // `import()` of a builtin is opaque to a bundler's static analysis, so it would
  // defeat the very gate that keeps this file browser-safe.
  return `urn:uuid:${globalThis.crypto.randomUUID()}`;
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
  /** 0..* since health v2.6; a set, canonicalized before hashing. */
  loincCode?: MultiValue<string>;
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
  /** 0..* since health v2.6 / clinical v1.14; a set, canonicalized before hashing. */
  snomedCode?: MultiValue<string>;
  /** 0..* since health v2.6 / clinical v1.14; a set, canonicalized before hashing. */
  icd10Code?: MultiValue<string>;
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
 * Identity fields (Cascade Checkup episode-scoping parity, matched to the
 * reconciler): RxNorm code, normalized drug name, start date, patient. Whichever
 * are present contribute; absent fields are ignored.
 *
 * **Dose is intentionally NOT part of the identity.** A dose change is an update
 * to the same medication, surfaced as a conflict by the reconciler, not a new
 * record. Pass `normalizedName` already normalized via {@link normalizeMedName}
 * so the identity is stable across display-name variants.
 *
 * Note: `startDate` is part of the identity (distinct courses get distinct
 * URIs), but the matcher and the retrieval index deliberately key on code/name
 * only (they answer "same drug?" and "find this drug's records", where startDate
 * would fragment). See the shared substrate plan's resolved decisions.
 *
 * @param fields - RxNorm code, normalized drug name, start date, patient URI.
 */
export function medicationUri(fields: {
  rxNormCode?: string;
  normalizedName?: string;
  startDate?: string;
  patient?: string;
}): string {
  return contentHashedUri('MedicationRequest', fields);
}
