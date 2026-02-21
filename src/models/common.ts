/**
 * Common types shared across all Cascade Protocol data models.
 *
 * These types map directly to the Cascade Protocol vocabularies:
 * - cascade: https://ns.cascadeprotocol.org/core/v1#
 * - health:  https://ns.cascadeprotocol.org/health/v1#
 * - clinical: https://ns.cascadeprotocol.org/clinical/v1#
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

// ─── Provenance Types ────────────────────────────────────────────────────────

/**
 * Data provenance classification indicating the source of a health record.
 *
 * Maps to `cascade:dataProvenance` in Turtle serialization.
 *
 * - `ClinicalGenerated` -- Data originating from clinical/EHR sources
 * - `DeviceGenerated` -- Data from wearable or medical devices
 * - `SelfReported` -- Patient-entered data
 * - `AIExtracted` -- AI-extracted from existing clinical documents
 * - `AIGenerated` -- AI-generated observations, analyses, or recommendations
 * - `EHRVerified` -- Data verified against electronic health records
 */
export type ProvenanceType =
  | 'ClinicalGenerated'
  | 'DeviceGenerated'
  | 'SelfReported'
  | 'AIExtracted'
  | 'AIGenerated'
  | 'EHRVerified';

/**
 * Provenance class indicating the specific import mechanism or tracking method.
 *
 * Maps to `clinical:provenanceClass` in Turtle serialization.
 */
export type ProvenanceClass =
  | 'healthKitFHIR'
  | 'userTracked'
  | 'manualEntry'
  | 'deviceSync';

// ─── Condition Types ─────────────────────────────────────────────────────────

/**
 * Clinical status of a condition record.
 *
 * Maps to `health:status` in Turtle serialization.
 */
export type ConditionStatus =
  | 'active'
  | 'resolved'
  | 'remission'
  | 'inactive';

// ─── Allergy Types ───────────────────────────────────────────────────────────

/**
 * Severity of an allergic reaction.
 *
 * Maps to `health:allergySeverity` in Turtle serialization.
 */
export type AllergySeverity =
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'life-threatening';

/**
 * Category of allergen substance.
 *
 * Maps to `health:allergyCategory` in Turtle serialization.
 */
export type AllergyCategory =
  | 'medication'
  | 'food'
  | 'environmental'
  | 'biologic';

// ─── Lab Result Types ────────────────────────────────────────────────────────

/**
 * Interpretation of a lab result relative to reference ranges.
 *
 * Maps to `health:interpretation` in Turtle serialization.
 */
export type LabInterpretation =
  | 'normal'
  | 'abnormal'
  | 'critical'
  | 'elevated'
  | 'low';

// ─── Medication Types ────────────────────────────────────────────────────────

/**
 * Clinical intent for a medication record, indicating how the medication is used.
 *
 * Maps to `clinical:clinicalIntent` in Turtle serialization.
 */
export type MedicationClinicalIntent =
  | 'prescribed'
  | 'otc'
  | 'supplement'
  | 'prn'
  | 'reportedUse';

/**
 * Course of therapy type for a medication.
 *
 * Maps to `clinical:courseOfTherapyType` in Turtle serialization.
 */
export type CourseOfTherapyType =
  | 'continuous'
  | 'acute'
  | 'seasonal';

/**
 * Prescription category for a medication.
 *
 * Maps to `clinical:prescriptionCategory` in Turtle serialization.
 */
export type PrescriptionCategory =
  | 'community'
  | 'inpatient'
  | 'discharge';

/**
 * Source FHIR resource type for EHR-imported records.
 *
 * Maps to `clinical:sourceFhirResourceType` in Turtle serialization.
 */
export type SourceFhirResourceType =
  | 'MedicationRequest'
  | 'MedicationStatement'
  | 'MedicationDispense';

// ─── Vital Sign Types ────────────────────────────────────────────────────────

/**
 * Enumerated vital sign types supported by the Cascade Protocol.
 *
 * Maps to `clinical:vitalType` in Turtle serialization.
 */
export type VitalType =
  | 'heartRate'
  | 'bloodPressureSystolic'
  | 'bloodPressureDiastolic'
  | 'respiratoryRate'
  | 'temperature'
  | 'oxygenSaturation'
  | 'weight'
  | 'height'
  | 'bmi';

/**
 * Interpretation of a vital sign value relative to reference ranges.
 *
 * Maps to `clinical:interpretation` in Turtle serialization.
 */
export type VitalInterpretation =
  | 'normal'
  | 'elevated'
  | 'low'
  | 'critical';

// ─── Immunization Types ──────────────────────────────────────────────────────

/**
 * Status of an immunization administration.
 *
 * Maps to `health:status` in Turtle serialization.
 */
export type ImmunizationStatus =
  | 'completed'
  | 'entered-in-error'
  | 'not-done';

// ─── Coverage Types ──────────────────────────────────────────────────────────

/**
 * Type of insurance plan.
 *
 * Maps to `clinical:planType` or `coverage:planType` in Turtle serialization.
 */
export type PlanType =
  | 'ppo'
  | 'hmo'
  | 'pos'
  | 'epo'
  | 'hdhp'
  | 'medicare'
  | 'medicaid';

/**
 * Coverage designation (primary or secondary).
 *
 * Maps to `clinical:coverageType` or `coverage:coverageType` in Turtle serialization.
 */
export type CoverageType =
  | 'primary'
  | 'secondary'
  | 'supplemental';

/**
 * Subscriber relationship to the plan holder.
 *
 * Maps to `clinical:relationship` or `coverage:subscriberRelationship` in Turtle serialization.
 */
export type SubscriberRelationship =
  | 'self'
  | 'spouse'
  | 'child'
  | 'other';

// ─── Patient Profile Types ───────────────────────────────────────────────────

/**
 * Biological sex as used for clinical calculations.
 *
 * Maps to `cascade:biologicalSex` in Turtle serialization.
 */
export type BiologicalSex =
  | 'male'
  | 'female'
  | 'intersex';

/**
 * Age group classification.
 *
 * Maps to `cascade:ageGroup` in Turtle serialization.
 */
export type AgeGroup =
  | 'infant'
  | 'child'
  | 'adolescent'
  | 'young_adult'
  | 'adult'
  | 'senior';

/**
 * Blood type classification.
 *
 * Maps to `health:bloodType` in Turtle serialization.
 */
export type BloodType =
  | 'aPositive'
  | 'aNegative'
  | 'bPositive'
  | 'bNegative'
  | 'abPositive'
  | 'abNegative'
  | 'oPositive'
  | 'oNegative';

// ─── Procedure Types ─────────────────────────────────────────────────────────

/**
 * Status of a clinical procedure.
 */
export type ProcedureStatus =
  | 'completed'
  | 'in-progress'
  | 'not-done'
  | 'preparation'
  | 'stopped';

// ─── Base Record Interface ───────────────────────────────────────────────────

/**
 * Base fields shared by all Cascade Protocol health records.
 *
 * Every record in the Cascade Protocol must include an `id`, `type`,
 * `dataProvenance`, and `schemaVersion`. Additional optional metadata
 * fields are available for traceability.
 *
 * - `id` maps to the RDF subject URI (e.g., `urn:uuid:...`)
 * - `type` maps to `rdf:type` (e.g., `health:MedicationRecord`)
 * - `dataProvenance` maps to `cascade:dataProvenance`
 * - `schemaVersion` maps to `cascade:schemaVersion`
 */
export interface CascadeRecord {
  /** Unique identifier for this record (URN UUID format: `urn:uuid:...`). */
  id: string;

  /** RDF type of this record (e.g., `MedicationRecord`, `ConditionRecord`). */
  type: string;

  /**
   * Data provenance classification indicating the source of this record.
   * Maps to `cascade:dataProvenance` in Turtle serialization.
   */
  dataProvenance: ProvenanceType;

  /**
   * Schema version in major.minor format (e.g., `"1.3"`).
   * Maps to `cascade:schemaVersion` in Turtle serialization.
   */
  schemaVersion: string;

  /**
   * Identifier linking back to the source record in the originating system.
   * Maps to `health:sourceRecordId` in Turtle serialization.
   */
  sourceRecordId?: string;

  /**
   * Free-text notes associated with this record.
   * Maps to `health:notes` in Turtle serialization.
   */
  notes?: string;
}
