/**
 * Medication data model for the Cascade Protocol.
 *
 * Represents a medication record with fields sourced from EHR imports,
 * FHIR MedicationRequest/MedicationStatement resources, or self-reported data.
 *
 * RDF type: `health:MedicationRecord`
 * Vocabulary: `https://ns.cascadeprotocol.org/health/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type {
  CascadeRecord,
  MedicationClinicalIntent,
  CourseOfTherapyType,
  PrescriptionCategory,
  ProvenanceClass,
  SourceFhirResourceType,
} from './common.js';

/**
 * A medication record in the Cascade Protocol.
 *
 * Required fields: `medicationName`, `isActive`, `dataProvenance`, `schemaVersion`.
 * All date fields use ISO 8601 string format.
 *
 * Serializes as `health:MedicationRecord` in Turtle.
 */
export interface Medication extends CascadeRecord {
  type: 'MedicationRecord';

  /**
   * Name of the medication.
   * Maps to `health:medicationName` in Turtle serialization.
   */
  medicationName: string;

  /**
   * Whether the medication is currently active.
   * Maps to `health:isActive` in Turtle serialization.
   */
  isActive: boolean;

  /**
   * Prescribed dose (e.g., `"20 mg"`, `"90 mcg/actuation"`).
   * Maps to `health:dose` in Turtle serialization.
   */
  dose?: string;

  /**
   * Dosing frequency (e.g., `"once daily"`, `"twice daily"`, `"as needed"`).
   * Maps to `health:frequency` in Turtle serialization.
   */
  frequency?: string;

  /**
   * Route of administration (e.g., `"oral"`, `"inhalation"`).
   * Maps to `health:route` in Turtle serialization.
   */
  route?: string;

  /**
   * Name of the prescribing clinician.
   * Maps to `health:prescriber` in Turtle serialization.
   */
  prescriber?: string;

  /**
   * Date when the medication was started (ISO 8601).
   * Maps to `health:startDate` in Turtle serialization.
   */
  startDate?: string;

  /**
   * Date when the medication was discontinued (ISO 8601).
   * Maps to `health:endDate` in Turtle serialization.
   */
  endDate?: string;

  /**
   * RxNorm concept URI for this medication.
   * Maps to `health:rxNormCode` in Turtle serialization as a URI reference.
   */
  rxNormCode?: string;

  /**
   * Array of drug code URIs from multiple coding systems (RxNorm, SNOMED CT, etc.).
   * Maps to `clinical:drugCode` in Turtle serialization (repeated predicate).
   */
  drugCodes?: string[];

  /**
   * Provenance class indicating the import mechanism.
   * Maps to `clinical:provenanceClass` in Turtle serialization.
   */
  provenanceClass?: ProvenanceClass | string;

  /**
   * The FHIR resource type from which this record was sourced.
   * Maps to `clinical:sourceFhirResourceType` in Turtle serialization.
   */
  sourceFhirResourceType?: SourceFhirResourceType | string;

  /**
   * Clinical intent for this medication.
   * Maps to `clinical:clinicalIntent` in Turtle serialization.
   */
  clinicalIntent?: MedicationClinicalIntent | string;

  /**
   * Clinical indication for prescribing this medication.
   * Maps to `clinical:indication` in Turtle serialization.
   */
  indication?: string;

  /**
   * Course of therapy type.
   * Maps to `clinical:courseOfTherapyType` in Turtle serialization.
   */
  courseOfTherapyType?: CourseOfTherapyType | string;

  /**
   * Whether this medication is taken on an as-needed (PRN) basis.
   * Maps to `clinical:asNeeded` in Turtle serialization.
   */
  asNeeded?: boolean;

  /**
   * Physical form of the medication (e.g., `"tablet"`, `"inhaler"`).
   * Maps to `clinical:medicationForm` in Turtle serialization.
   */
  medicationForm?: string;

  /**
   * Active pharmaceutical ingredient.
   * Maps to `clinical:activeIngredient` in Turtle serialization.
   */
  activeIngredient?: string;

  /**
   * Strength of the active ingredient (e.g., `"1000 mg"`).
   * Maps to `clinical:ingredientStrength` in Turtle serialization.
   */
  ingredientStrength?: string;

  /**
   * Number of refills allowed on the prescription.
   * Maps to `clinical:refillsAllowed` in Turtle serialization.
   */
  refillsAllowed?: number;

  /**
   * Number of days of medication supply per fill.
   * Maps to `clinical:supplyDurationDays` in Turtle serialization.
   */
  supplyDurationDays?: number;

  /**
   * Prescription category (e.g., `"community"`, `"inpatient"`).
   * Maps to `clinical:prescriptionCategory` in Turtle serialization.
   */
  prescriptionCategory?: PrescriptionCategory | string;

  /**
   * Therapeutic class of the medication (e.g., `"bronchodilator"`, `"antihypertensive"`).
   * Maps to `health:medicationClass` in Turtle serialization.
   */
  medicationClass?: string;

  /**
   * List of vital sign types that this medication may affect.
   * Maps to `health:affectsVitalSigns` as an RDF list in Turtle serialization.
   */
  affectsVitalSigns?: string[];
}
