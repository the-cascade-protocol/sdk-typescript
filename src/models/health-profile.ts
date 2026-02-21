/**
 * Health profile aggregate data model for the Cascade Protocol.
 *
 * Represents a complete health profile containing arrays of all
 * clinical and wellness record types. This is the top-level container
 * corresponding to a Cascade Pod's data inventory.
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { Medication } from './medication.js';
import type { Condition } from './condition.js';
import type { Allergy } from './allergy.js';
import type { LabResult } from './lab-result.js';
import type { VitalSign } from './vital-sign.js';
import type { Immunization } from './immunization.js';
import type { Procedure } from './procedure.js';
import type { FamilyHistory } from './family-history.js';
import type { Coverage } from './coverage.js';
import type { PatientProfile } from './patient-profile.js';
import type { ActivitySnapshot } from './activity-snapshot.js';
import type { SleepSnapshot } from './sleep-snapshot.js';

/**
 * A complete health profile aggregating all Cascade Protocol record types.
 *
 * This interface mirrors the structure of a Cascade Pod, providing
 * typed access to all clinical and wellness data categories.
 */
export interface HealthProfile {
  /** Patient demographic and identification data. */
  patientProfile?: PatientProfile;

  /** Active and historical medication records. */
  medications: Medication[];

  /** Active and resolved medical conditions. */
  conditions: Condition[];

  /** Known allergies and intolerances. */
  allergies: Allergy[];

  /** Laboratory test results. */
  labResults: LabResult[];

  /** Clinical and device-generated vital sign measurements. */
  vitalSigns: VitalSign[];

  /** Vaccine administration records. */
  immunizations: Immunization[];

  /** Clinical procedure records. */
  procedures: Procedure[];

  /** Family health history entries. */
  familyHistory: FamilyHistory[];

  /** Insurance coverage and plan records. */
  coverage: Coverage[];

  /** Daily activity summaries from wearable devices. */
  activitySnapshots: ActivitySnapshot[];

  /** Nightly sleep summaries from wearable devices. */
  sleepSnapshots: SleepSnapshot[];
}
