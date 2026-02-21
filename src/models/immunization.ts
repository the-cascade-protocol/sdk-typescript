/**
 * Immunization data model for the Cascade Protocol.
 *
 * Represents a vaccine administration record, typically from EHR imports.
 *
 * RDF type: `health:ImmunizationRecord`
 * Vocabulary: `https://ns.cascadeprotocol.org/health/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord, ImmunizationStatus } from './common.js';

/**
 * An immunization record in the Cascade Protocol.
 *
 * Required fields: `vaccineName`, `dataProvenance`, `schemaVersion`.
 * All date fields use ISO 8601 string format.
 *
 * Serializes as `health:ImmunizationRecord` in Turtle.
 */
export interface Immunization extends CascadeRecord {
  type: 'ImmunizationRecord';

  /**
   * Name of the vaccine administered.
   * Maps to `health:vaccineName` in Turtle serialization.
   */
  vaccineName: string;

  /**
   * Date and time of vaccine administration (ISO 8601).
   * Maps to `health:administrationDate` in Turtle serialization.
   */
  administrationDate?: string;

  /**
   * Status of the immunization.
   * Maps to `health:status` in Turtle serialization.
   */
  status?: ImmunizationStatus;

  /**
   * Vaccine code identifier (e.g., `"CVX-308"`).
   * Maps to `health:vaccineCode` in Turtle serialization.
   */
  vaccineCode?: string;

  /**
   * Vaccine manufacturer name.
   * Maps to `health:manufacturer` in Turtle serialization.
   */
  manufacturer?: string;

  /**
   * Lot number of the vaccine.
   * Maps to `health:lotNumber` in Turtle serialization.
   */
  lotNumber?: string;

  /**
   * Dose quantity administered (e.g., `"0.3 mL"`).
   * Maps to `health:doseQuantity` in Turtle serialization.
   */
  doseQuantity?: string;

  /**
   * Route of administration (e.g., `"intramuscular"`).
   * Maps to `health:route` in Turtle serialization.
   */
  route?: string;

  /**
   * Anatomical site of administration (e.g., `"Left deltoid"`).
   * Maps to `health:site` in Turtle serialization.
   */
  site?: string;

  /**
   * Name of the healthcare provider who administered the vaccine.
   * Maps to `health:administeringProvider` in Turtle serialization.
   */
  administeringProvider?: string;

  /**
   * Location where the vaccine was administered.
   * Maps to `health:administeringLocation` in Turtle serialization.
   */
  administeringLocation?: string;
}
