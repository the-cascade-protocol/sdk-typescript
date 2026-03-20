/**
 * MedicationAdministration data model for the Cascade Protocol.
 *
 * Represents a single administration event of a medication given at a
 * specific time by a provider (e.g., IV antibiotics pre-surgery, vaccine
 * injection at visit). Semantically distinct from Medication (ongoing
 * regimens): represents a one-time event, not an ongoing regimen.
 *
 * RDF type: `clinical:MedicationAdministration`
 * Vocabulary: `https://ns.cascadeprotocol.org/clinical/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord } from './common.js';

/**
 * A medication administration event in the Cascade Protocol.
 *
 * Required fields: `medicationName`, `dataProvenance`, `schemaVersion`.
 *
 * Serializes as `clinical:MedicationAdministration` in Turtle.
 */
export interface MedicationAdministration extends CascadeRecord {
  type: 'MedicationAdministration';

  /** Name of the medication administered. Maps to `health:medicationName`. */
  medicationName: string;

  /** Date and time of administration (ISO 8601). Maps to `clinical:administeredDate`. */
  administeredDate?: string;

  /** Dose administered (e.g., "1g", "500mg"). Maps to `clinical:administeredDose`. */
  administeredDose?: string;

  /** Route of administration: oral, IV, IM, subcutaneous, topical. Maps to `clinical:administeredRoute`. */
  administeredRoute?: string;

  /** Administration status: completed, not-done, in-progress. Maps to `clinical:administrationStatus`. */
  administrationStatus?: string;

  /** SNOMED CT code URI for the medication concept. Maps to `health:snomedCode`. */
  snomedCode?: string;
}
