/**
 * Procedure data model for the Cascade Protocol.
 *
 * Represents a clinical procedure record.
 *
 * RDF type: `health:ProcedureRecord`
 * Vocabulary: `https://ns.cascadeprotocol.org/health/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord, ProcedureStatus } from './common.js';

/**
 * A procedure record in the Cascade Protocol.
 *
 * Required fields: `procedureName`, `dataProvenance`, `schemaVersion`.
 * All date fields use ISO 8601 string format.
 *
 * Serializes as `health:ProcedureRecord` in Turtle.
 */
export interface Procedure extends CascadeRecord {
  type: 'ProcedureRecord';

  /**
   * Name of the procedure.
   * Maps to `health:procedureName` in Turtle serialization.
   */
  procedureName: string;

  /**
   * Date and time the procedure was performed (ISO 8601).
   * Maps to `health:performedDate` in Turtle serialization.
   */
  performedDate?: string;

  /**
   * Current status of the procedure.
   * Maps to `health:status` in Turtle serialization.
   */
  status?: ProcedureStatus;

  /**
   * SNOMED CT code URI for this procedure.
   * Maps to `health:snomedCode` in Turtle serialization as a URI reference.
   */
  snomedCode?: string;

  /**
   * Name of the clinician who performed the procedure.
   * Maps to `health:performer` in Turtle serialization.
   */
  performer?: string;

  /**
   * Location where the procedure was performed.
   * Maps to `health:location` in Turtle serialization.
   */
  location?: string;
}
