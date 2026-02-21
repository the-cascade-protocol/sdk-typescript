/**
 * JSON-LD conversion utilities for Cascade Protocol records.
 *
 * Converts between Cascade Protocol typed model objects and JSON-LD documents.
 * Uses the bundled context from `context.ts` for property mapping.
 *
 * @module jsonld
 */

import { NAMESPACES, PROPERTY_PREDICATES, TYPE_MAPPING } from '../vocabularies/namespaces.js';
import { CONTEXT_URI } from './context.js';
import type { CascadeRecord } from '../models/common.js';

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Mapping from record type string to TYPE_MAPPING key.
 */
const TYPE_TO_MAPPING_KEY: Record<string, string> = {
  MedicationRecord: 'medications',
  ConditionRecord: 'conditions',
  AllergyRecord: 'allergies',
  LabResultRecord: 'lab-results',
  ImmunizationRecord: 'immunizations',
  VitalSign: 'vital-signs',
  Supplement: 'supplements',
  ProcedureRecord: 'procedures',
  FamilyHistoryRecord: 'family-history',
  CoverageRecord: 'insurance',
  InsurancePlan: 'insurance',
  PatientProfile: 'patient-profile',
  ActivitySnapshot: 'activity',
  SleepSnapshot: 'sleep',
};

/**
 * Build a reverse mapping from full predicate URI to JSON property name.
 */
function buildReversePredicateMap(): Map<string, string> {
  const reverseMap = new Map<string, string>();
  for (const [jsonKey, predShorthand] of Object.entries(PROPERTY_PREDICATES)) {
    const colonIdx = predShorthand.indexOf(':');
    if (colonIdx >= 0) {
      const nsPrefix = predShorthand.slice(0, colonIdx);
      const localName = predShorthand.slice(colonIdx + 1);
      const nsUri = NAMESPACES[nsPrefix as keyof typeof NAMESPACES];
      if (nsUri) {
        reverseMap.set(`${nsUri}${localName}`, jsonKey);
      }
    }
  }
  return reverseMap;
}

const REVERSE_PREDICATE_MAP = buildReversePredicateMap();

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Convert a Cascade Protocol record to a JSON-LD document.
 *
 * The resulting document includes:
 * - `@context` referencing the published Cascade Protocol context URI
 * - `@id` set to the record's `id`
 * - `@type` set to the full RDF type URI
 * - All record properties mapped to their predicate IRIs
 *
 * @param record - A typed Cascade Protocol record
 * @returns A JSON-LD document object
 *
 * @example
 * ```typescript
 * import { toJsonLd } from '@cascade-protocol/sdk';
 *
 * const jsonld = toJsonLd(myMedication);
 * // { "@context": "https://...", "@id": "urn:uuid:...", "@type": "health:MedicationRecord", ... }
 * ```
 */
export function toJsonLd(record: CascadeRecord): object {
  const mappingKey = TYPE_TO_MAPPING_KEY[record.type];
  const mapping = mappingKey ? TYPE_MAPPING[mappingKey] : undefined;
  if (!mapping) {
    throw new Error(`Unknown record type: ${record.type}. No TYPE_MAPPING found.`);
  }

  const doc: Record<string, unknown> = {
    '@context': CONTEXT_URI,
    '@id': record.id,
    '@type': mapping.rdfType,
  };

  // Map all record properties to the JSON-LD doc
  for (const [key, value] of Object.entries(record)) {
    if (key === 'id' || key === 'type' || value === undefined || value === null) continue;

    const pred = PROPERTY_PREDICATES[key];
    if (!pred) continue;

    // dataProvenance gets expanded to a prefixed type reference
    if (key === 'dataProvenance') {
      doc[key] = `cascade:${String(value)}`;
      continue;
    }

    // All other values are passed through as-is; the JSON-LD context
    // will handle type coercion for dates, booleans, integers, etc.
    doc[key] = value;
  }

  return doc;
}

/**
 * Parse a JSON-LD document back to a typed Cascade Protocol record.
 *
 * Supports documents using the Cascade Protocol context (either inline
 * or by reference). Maps `@id` to `id`, `@type` to `type`, and all
 * known property IRIs back to their TypeScript model field names.
 *
 * @param doc - A JSON-LD document object
 * @returns A typed CascadeRecord
 *
 * @example
 * ```typescript
 * import { fromJsonLd } from '@cascade-protocol/sdk';
 * import type { Medication } from '@cascade-protocol/sdk';
 *
 * const med = fromJsonLd<Medication>(jsonldDoc);
 * ```
 */
export function fromJsonLd<T extends CascadeRecord>(doc: object): T {
  const raw = doc as Record<string, unknown>;
  const record: Record<string, unknown> = {};

  // Extract @id
  record['id'] = raw['@id'] ?? '';

  // Extract @type and resolve to local type name
  const rdfType = String(raw['@type'] ?? '');
  let typeName = rdfType;

  // Try to extract local name from prefixed or full URI type
  const colonIdx = rdfType.indexOf(':');
  if (colonIdx >= 0) {
    const prefix = rdfType.slice(0, colonIdx);
    const local = rdfType.slice(colonIdx + 1);
    // Check if it's a prefixed name
    if (prefix in NAMESPACES) {
      typeName = local;
    } else {
      typeName = local;
    }
  }

  // If full URI, extract local name
  for (const ns of Object.values(NAMESPACES)) {
    if (rdfType.startsWith(ns)) {
      typeName = rdfType.slice(ns.length);
      break;
    }
  }

  record['type'] = typeName;

  // Map all other properties
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('@') || value === undefined || value === null) continue;

    // Check if key is a known property name (short form from context)
    if (key in PROPERTY_PREDICATES) {
      // Handle dataProvenance: strip the "cascade:" prefix
      if (key === 'dataProvenance' && typeof value === 'string') {
        const cascadePrefix = 'cascade:';
        if (value.startsWith(cascadePrefix)) {
          record[key] = value.slice(cascadePrefix.length);
        } else {
          record[key] = value;
        }
        continue;
      }
      record[key] = value;
      continue;
    }

    // Check if key is a full IRI
    const jsonKey = REVERSE_PREDICATE_MAP.get(key);
    if (jsonKey) {
      record[jsonKey] = value;
      continue;
    }
  }

  return record as T;
}
