/**
 * High-level serialization functions for converting Cascade Protocol
 * data model objects to Turtle (RDF) format.
 *
 * Uses the {@link TurtleBuilder} internally and produces output conforming
 * to the Cascade Protocol conformance fixtures.
 *
 * @example
 * ```typescript
 * import { serialize, serializeMedication } from '@cascade-protocol/sdk';
 *
 * const turtle = serializeMedication(myMed);
 * // or generically:
 * const turtle2 = serialize(myRecord);
 * ```
 *
 * @module serializer
 */

import { TurtleBuilder, SubjectBuilder } from './turtle-builder.js';
import { NAMESPACES, PROPERTY_PREDICATES, TYPE_MAPPING, TYPE_TO_MAPPING_KEY } from '../vocabularies/namespaces.js';
import type { CascadeRecord } from '../models/common.js';
import type { Medication } from '../models/medication.js';
import type { Condition } from '../models/condition.js';
import type { Allergy } from '../models/allergy.js';
import type { LabResult } from '../models/lab-result.js';
import type { VitalSign } from '../models/vital-sign.js';
import type { Immunization } from '../models/immunization.js';
import type { Procedure } from '../models/procedure.js';
import type { FamilyHistory } from '../models/family-history.js';
import type { Coverage } from '../models/coverage.js';
import type { PatientProfile } from '../models/patient-profile.js';
import type { ActivitySnapshot } from '../models/activity-snapshot.js';
import type { SleepSnapshot } from '../models/sleep-snapshot.js';

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Type-specific predicate overrides.
 *
 * When a JSON field name maps to different RDF predicates depending on the
 * record type, these overrides take precedence over PROPERTY_PREDICATES.
 *
 * For example, `snomedCode` maps to `health:snomedCode` for Conditions
 * but `clinical:snomedCode` for VitalSigns.
 */
const TYPE_PREDICATE_OVERRIDES: Record<string, Record<string, string>> = {
  VitalSign: {
    snomedCode: 'clinical:snomedCode',
    interpretation: 'clinical:interpretation',
  },
};

/**
 * Get the predicate for a given field and record type, respecting overrides.
 */
function getPredicateForField(key: string, recordType: string): string | undefined {
  const overrides = TYPE_PREDICATE_OVERRIDES[recordType];
  if (overrides && key in overrides) {
    return overrides[key];
  }
  return PROPERTY_PREDICATES[key];
}

/**
 * Fields whose values should be serialized as URI references (angle-bracket enclosed)
 * rather than string literals, when the value looks like a full URI.
 */
const URI_FIELDS = new Set([
  'rxNormCode',
  'icd10Code',
  'snomedCode',
  'loincCode',
  'testCode',
]);

/**
 * Fields whose values are arrays of URIs or strings and should be serialized
 * as repeated predicate triples (one per value).
 */
const ARRAY_FIELDS = new Set([
  'drugCodes',
  'affectsVitalSigns',
  'monitoredVitalSigns',
]);

/**
 * Explicit set of fields that are dateTime-typed even though their names
 * don't contain "date" or "time" as a substring.
 */
const EXPLICIT_DATETIME_FIELDS = new Set([
  'effectivePeriodStart',
  'effectivePeriodEnd',
  'effectiveStart',
  'effectiveEnd',
]);

/**
 * Fields whose values contain date/time and get ^^xsd:dateTime typing.
 * We check the key name and a set of explicit fields.
 */
function isDateTimeField(key: string): boolean {
  if (EXPLICIT_DATETIME_FIELDS.has(key)) return true;
  const lower = key.toLowerCase();
  // Specific date-only field
  if (key === 'dateOfBirth' || key === 'date') return false;
  return lower.includes('date') || lower.includes('time');
}

/**
 * Fields whose values are date-only (no time component) and get ^^xsd:date typing.
 */
function isDateOnlyField(key: string): boolean {
  return key === 'dateOfBirth';
}

/**
 * Fields that represent integers with ^^xsd:integer typing in the expected output.
 */
const INTEGER_FIELDS = new Set([
  'computedAge',
  'refillsAllowed',
  'supplyDurationDays',
  'onsetAge',
]);

/**
 * Fields that are boolean and should be serialized unquoted.
 */
function isBooleanField(_key: string, value: unknown): boolean {
  return typeof value === 'boolean';
}

/**
 * Determine which prefixes are needed for a given record.
 */
function collectPrefixes(record: CascadeRecord): Map<string, string> {
  const prefixes = new Map<string, string>();

  // Always include cascade and xsd
  prefixes.set('cascade', NAMESPACES.cascade);
  prefixes.set('xsd', NAMESPACES.xsd);

  // Get the rdfType to determine base vocabulary
  const mappingKey = TYPE_TO_MAPPING_KEY[record.type];
  if (mappingKey) {
    const mapping = TYPE_MAPPING[mappingKey];
    if (mapping) {
      const rdfType = mapping.rdfType;
      const nsPrefix = rdfType.split(':')[0];
      if (nsPrefix && nsPrefix in NAMESPACES) {
        prefixes.set(nsPrefix, NAMESPACES[nsPrefix as keyof typeof NAMESPACES]);
      }
    }
  }

  // Scan all fields and add namespaces for predicates and URI values
  for (const [key, value] of Object.entries(record)) {
    if (key === 'id' || key === 'type' || value === undefined || value === null) continue;

    const pred = getPredicateForField(key, record.type);
    if (pred) {
      const nsPrefix = pred.split(':')[0];
      if (nsPrefix && nsPrefix in NAMESPACES) {
        prefixes.set(nsPrefix, NAMESPACES[nsPrefix as keyof typeof NAMESPACES]);
      }
    }

    // Check URI values for namespace references
    if (typeof value === 'string' && URI_FIELDS.has(key)) {
      addPrefixForUri(value, prefixes);
    }
    if (Array.isArray(value) && ARRAY_FIELDS.has(key)) {
      for (const item of value) {
        if (typeof item === 'string' && item.startsWith('http')) {
          addPrefixForUri(item, prefixes);
        }
      }
    }
  }

  return prefixes;
}

function addPrefixForUri(uri: string, prefixes: Map<string, string>): void {
  for (const [prefix, ns] of Object.entries(NAMESPACES)) {
    if (uri.startsWith(ns) || uri.startsWith(ns.replace(/#$/, '/'))) {
      prefixes.set(prefix, ns);
      break;
    }
  }
}

/**
 * Determine the stable order for prefix declarations.
 * The order follows: cascade, health, clinical, coverage, then
 * external namespaces (rxnorm, sct, loinc, icd10, foaf), then xsd.
 */
function sortedPrefixes(prefixes: Map<string, string>): [string, string][] {
  const order = [
    'cascade', 'health', 'clinical', 'coverage', 'checkup', 'pots',
    'fhir', 'rxnorm', 'sct', 'loinc', 'icd10', 'ucum',
    'prov', 'foaf', 'ldp', 'dcterms', 'xsd',
  ];
  const entries = Array.from(prefixes.entries());
  entries.sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    const aIdx = ai >= 0 ? ai : order.length;
    const bIdx = bi >= 0 ? bi : order.length;
    return aIdx - bIdx;
  });
  return entries;
}

// ─── Generic Serializer ─────────────────────────────────────────────────────

/**
 * Serialize any Cascade Protocol record to Turtle format.
 *
 * Dispatches based on the `type` field of the record. The output matches
 * the conformance fixture expected Turtle format.
 *
 * @param record - Any CascadeRecord (Medication, Condition, VitalSign, etc.)
 * @returns A complete Turtle document string
 */
export function serialize(record: CascadeRecord): string {
  return serializeRecord(record);
}

/**
 * Internal workhorse that serializes any record.
 */
function serializeRecord(record: CascadeRecord): string {
  const mappingKey = TYPE_TO_MAPPING_KEY[record.type];
  const mapping = mappingKey ? TYPE_MAPPING[mappingKey] : undefined;
  if (!mapping) {
    throw new Error(`Unknown record type: ${record.type}. No TYPE_MAPPING found.`);
  }

  const prefixes = collectPrefixes(record);
  const builder = new TurtleBuilder();

  // Add prefixes in stable order
  for (const [name, uri] of sortedPrefixes(prefixes)) {
    builder.prefix(name, uri);
  }

  // Build the subject
  const subjectUri = record.id.startsWith('urn:') || record.id.startsWith('http')
    ? `<${record.id}>`
    : `<${record.id}>`;

  const sub = builder.subject(subjectUri);
  sub.type(mapping.rdfType);

  // Serialize fields in a deterministic order:
  // 1. The "name" field (primary identifier)
  // 2. Required CascadeRecord fields (dataProvenance, schemaVersion)
  //    are placed after the type-specific required fields
  // 3. All other fields in their natural object order

  const rec: Record<string, unknown> = { ...record };

  // Collect field entries, preserving the order they appear in the record,
  // but ensuring a deterministic output that matches the conformance fixtures.
  const fieldOrder = Object.keys(rec);

  // Track fields we've already emitted
  const emitted = new Set<string>();

  // Helper to emit a single field
  const emitField = (key: string): void => {
    if (emitted.has(key)) return;
    emitted.add(key);

    const value = rec[key];
    if (value === undefined || value === null) return;
    if (key === 'id' || key === 'type') return;

    const pred = getPredicateForField(key, record.type);
    if (!pred) return;

    // dataProvenance is special: value is a prefixed name
    if (key === 'dataProvenance') {
      sub.uri(pred, `cascade:${String(value)}`);
      return;
    }

    // Boolean fields
    if (isBooleanField(key, value)) {
      sub.boolean(pred, value as boolean);
      return;
    }

    // Integer fields
    if (INTEGER_FIELDS.has(key) && typeof value === 'number') {
      sub.integer(pred, value);
      return;
    }

    // Number fields (plain, untyped integers like clinical:value, referenceRangeLow, etc.)
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        sub.number(pred, value);
      } else {
        sub.double(pred, value);
      }
      return;
    }

    // URI fields
    if (URI_FIELDS.has(key) && typeof value === 'string') {
      sub.uri(pred, value);
      return;
    }

    // Array fields (repeated predicates for URI lists, RDF list for string lists)
    if (Array.isArray(value) && ARRAY_FIELDS.has(key)) {
      if (value.length === 0) return;
      // Check if items look like URIs
      const isUriList = value.every((item) => typeof item === 'string' && item.startsWith('http'));
      if (isUriList) {
        for (const item of value) {
          sub.uri(pred, item as string);
        }
      } else {
        sub.list(pred, value.map(String));
      }
      return;
    }

    // Date-only fields
    if (isDateOnlyField(key) && typeof value === 'string') {
      sub.date(pred, value);
      return;
    }

    // DateTime fields
    if (isDateTimeField(key) && typeof value === 'string') {
      sub.dateTime(pred, value);
      return;
    }

    // Nested objects (blank nodes) for PatientProfile
    if (typeof value === 'object' && !Array.isArray(value)) {
      serializeBlankNode(sub, pred, key, value as Record<string, unknown>);
      return;
    }

    // Default: string literal
    if (typeof value === 'string') {
      sub.literal(pred, value);
      return;
    }
  };

  // Emit all fields in the order they appear in the object
  for (const key of fieldOrder) {
    emitField(key);
  }

  sub.done();
  return builder.build();
}

/**
 * Serialize a nested object as a Turtle blank node.
 */
function serializeBlankNode(
  sub: SubjectBuilder,
  predicate: string,
  key: string,
  obj: Record<string, unknown>,
): void {
  // Determine the blank node type based on the key
  let bnodeType: string | undefined;
  if (key === 'emergencyContact') bnodeType = 'cascade:EmergencyContact';
  else if (key === 'address') bnodeType = 'cascade:Address';
  else if (key === 'preferredPharmacy') bnodeType = 'cascade:PharmacyInfo';

  sub.blankNode(predicate, (b) => {
    if (bnodeType) {
      b.type(bnodeType);
    }
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      // Look up predicate for nested field - try with 'cascade:' prefix for profile nested types
      const nestedPred = `cascade:${k}`;
      if (typeof v === 'string') {
        b.literal(nestedPred, v);
      } else if (typeof v === 'boolean') {
        b.boolean(nestedPred, v);
      } else if (typeof v === 'number') {
        if (Number.isInteger(v)) {
          b.number(nestedPred, v);
        } else {
          b.double(nestedPred, v);
        }
      }
    }
  });
}

// ─── Type-Specific Serializers ──────────────────────────────────────────────

/** Serialize a Medication record to Turtle. */
export function serializeMedication(med: Medication): string {
  return serialize(med);
}

/** Serialize a Condition record to Turtle. */
export function serializeCondition(cond: Condition): string {
  return serialize(cond);
}

/** Serialize an Allergy record to Turtle. */
export function serializeAllergy(allergy: Allergy): string {
  return serialize(allergy);
}

/** Serialize a LabResult record to Turtle. */
export function serializeLabResult(lab: LabResult): string {
  return serialize(lab);
}

/** Serialize a VitalSign record to Turtle. */
export function serializeVitalSign(vital: VitalSign): string {
  return serialize(vital);
}

/** Serialize an Immunization record to Turtle. */
export function serializeImmunization(imm: Immunization): string {
  return serialize(imm);
}

/** Serialize a Procedure record to Turtle. */
export function serializeProcedure(proc: Procedure): string {
  return serialize(proc);
}

/** Serialize a FamilyHistory record to Turtle. */
export function serializeFamilyHistory(fam: FamilyHistory): string {
  return serialize(fam);
}

/** Serialize a Coverage record to Turtle. */
export function serializeCoverage(cov: Coverage): string {
  return serialize(cov);
}

/** Serialize a PatientProfile record to Turtle. */
export function serializePatientProfile(profile: PatientProfile): string {
  return serialize(profile);
}

/** Serialize an ActivitySnapshot record to Turtle. */
export function serializeActivitySnapshot(activity: ActivitySnapshot): string {
  return serialize(activity);
}

/** Serialize a SleepSnapshot record to Turtle. */
export function serializeSleepSnapshot(sleep: SleepSnapshot): string {
  return serialize(sleep);
}
