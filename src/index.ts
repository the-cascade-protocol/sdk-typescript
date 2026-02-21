/**
 * @cascade-protocol/sdk - TypeScript library for structured health data.
 *
 * Provides typed interfaces for all Cascade Protocol data types,
 * vocabulary constants, namespace URIs, and serialization/deserialization
 * utilities for RDF Turtle and JSON-LD formats.
 *
 * @example
 * ```typescript
 * import type { Medication, Condition, HealthProfile } from '@cascade-protocol/sdk';
 * import { NAMESPACES, serialize, deserialize, toJsonLd } from '@cascade-protocol/sdk';
 * ```
 *
 * @see https://cascadeprotocol.org
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 *
 * @packageDocumentation
 */

// ─── Data Model Types ────────────────────────────────────────────────────────

// Base record and common types
export type {
  CascadeRecord,
  ProvenanceType,
  ProvenanceClass,
  ConditionStatus,
  AllergySeverity,
  AllergyCategory,
  LabInterpretation,
  MedicationClinicalIntent,
  CourseOfTherapyType,
  PrescriptionCategory,
  SourceFhirResourceType,
  VitalType,
  VitalInterpretation,
  ImmunizationStatus,
  PlanType,
  CoverageType,
  SubscriberRelationship,
  BiologicalSex,
  AgeGroup,
  BloodType,
  ProcedureStatus,
} from './models/index.js';

// Clinical record types
export type { Medication } from './models/medication.js';
export type { Condition } from './models/condition.js';
export type { Allergy } from './models/allergy.js';
export type { LabResult } from './models/lab-result.js';
export type { VitalSign } from './models/vital-sign.js';
export type { Immunization } from './models/immunization.js';
export type { Procedure } from './models/procedure.js';
export type { FamilyHistory } from './models/family-history.js';
export type { Coverage } from './models/coverage.js';

// Patient profile and nested types
export type {
  PatientProfile,
  EmergencyContact,
  Address,
  PharmacyInfo,
} from './models/patient-profile.js';

// Wellness snapshot types
export type { ActivitySnapshot } from './models/activity-snapshot.js';
export type { SleepSnapshot } from './models/sleep-snapshot.js';

// Aggregate health profile
export type { HealthProfile } from './models/health-profile.js';

// ─── Vocabulary Constants ────────────────────────────────────────────────────

export {
  NAMESPACES,
  TYPE_MAPPING,
  PROPERTY_PREDICATES,
} from './vocabularies/index.js';

export type { NamespacePrefix } from './vocabularies/index.js';

// ─── Turtle Serializer ─────────────────────────────────────────────────────

export {
  serialize,
  serializeMedication,
  serializeCondition,
  serializeAllergy,
  serializeLabResult,
  serializeVitalSign,
  serializeImmunization,
  serializeProcedure,
  serializeFamilyHistory,
  serializeCoverage,
  serializePatientProfile,
  serializeActivitySnapshot,
  serializeSleepSnapshot,
} from './serializer/index.js';

export { TurtleBuilder, SubjectBuilder, escapeTurtleString } from './serializer/index.js';

// ─── Turtle Deserializer ────────────────────────────────────────────────────

export { deserialize, deserializeOne } from './deserializer/index.js';

// ─── JSON-LD ────────────────────────────────────────────────────────────────

export { toJsonLd, fromJsonLd, getContext, CONTEXT_URI } from './jsonld/index.js';

// ─── Pod Builder ─────────────────────────────────────────────────────────────

export { PodBuilder, type PodFile, type PodManifest, type PodOptions } from './pod/index.js';

// ─── Consent Filter ──────────────────────────────────────────────────────────

export { applyConsent, clinicalOnlyPolicy, fullAccessPolicy, noAccessPolicy, type ConsentCategory, type ConsentRule, type ConsentPolicy } from './consent/index.js';

// ─── Validator ───────────────────────────────────────────────────────────────

export { validate, validateAll, type ValidationError, type ValidationResult } from './validator/index.js';
