/**
 * Re-exports all Cascade Protocol data model types.
 *
 * @module models
 */

// Common types and base interface
export type {
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
  CascadeRecord,
} from './common.js';

// Clinical record types
export type { Medication } from './medication.js';
export type { Condition } from './condition.js';
export type { Allergy } from './allergy.js';
export type { LabResult } from './lab-result.js';
export type { VitalSign } from './vital-sign.js';
export type { Immunization } from './immunization.js';
export type { Procedure } from './procedure.js';
export type { Encounter } from './encounter.js';
export type { FamilyHistory } from './family-history.js';
export type { Coverage } from './coverage.js';
export type { MedicationAdministration } from './medication-administration.js';
export type { ImplantedDevice } from './implanted-device.js';
export type { ImagingStudy } from './imaging-study.js';

// Patient profile and nested types
export type {
  PatientProfile,
  EmergencyContact,
  Address,
  PharmacyInfo,
} from './patient-profile.js';

// Wellness snapshot types
export type { ActivitySnapshot } from './activity-snapshot.js';
export type { SleepSnapshot } from './sleep-snapshot.js';

// Aggregate health profile
export type { HealthProfile } from './health-profile.js';
