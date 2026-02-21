/**
 * Allergy data model for the Cascade Protocol.
 *
 * Represents an allergy or intolerance record, sourced from EHR imports
 * or self-reported by the patient.
 *
 * RDF type: `health:AllergyRecord`
 * Vocabulary: `https://ns.cascadeprotocol.org/health/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord, AllergyCategory, AllergySeverity } from './common.js';

/**
 * An allergy record in the Cascade Protocol.
 *
 * Required fields: `allergen`, `dataProvenance`, `schemaVersion`.
 * All date fields use ISO 8601 string format.
 *
 * Serializes as `health:AllergyRecord` in Turtle.
 */
export interface Allergy extends CascadeRecord {
  type: 'AllergyRecord';

  /**
   * Name of the allergen substance.
   * Maps to `health:allergen` in Turtle serialization.
   */
  allergen: string;

  /**
   * Category of the allergen (e.g., `"medication"`, `"food"`, `"environmental"`).
   * Maps to `health:allergyCategory` in Turtle serialization.
   */
  allergyCategory?: AllergyCategory | string;

  /**
   * Description of the allergic reaction (e.g., `"Hives (urticaria)"`).
   * Maps to `health:reaction` in Turtle serialization.
   */
  reaction?: string;

  /**
   * Severity of the allergic reaction.
   * Maps to `health:allergySeverity` in Turtle serialization.
   */
  allergySeverity?: AllergySeverity;

  /**
   * Date of allergy onset (ISO 8601).
   * Maps to `health:onsetDate` in Turtle serialization.
   */
  onsetDate?: string;
}
