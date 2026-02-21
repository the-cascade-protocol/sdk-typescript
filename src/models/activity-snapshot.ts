/**
 * Activity snapshot data model for the Cascade Protocol.
 *
 * Represents a daily activity summary typically sourced from wearable
 * devices or HealthKit data.
 *
 * RDF type: `health:ActivitySnapshot`
 * Vocabulary: `https://ns.cascadeprotocol.org/health/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord } from './common.js';

/**
 * A daily activity snapshot in the Cascade Protocol.
 *
 * Required fields: `date`, `dataProvenance`, `schemaVersion`.
 * The `date` field uses ISO 8601 date format (YYYY-MM-DD).
 *
 * Serializes as `health:ActivitySnapshot` in Turtle.
 */
export interface ActivitySnapshot extends CascadeRecord {
  type: 'ActivitySnapshot';

  /**
   * Date of the activity summary (ISO 8601 date: `YYYY-MM-DD`).
   * Maps to `health:date` in Turtle serialization.
   */
  date: string;

  /**
   * Total step count for the day.
   * Maps to `health:steps` in Turtle serialization.
   */
  steps?: number;

  /**
   * Total distance covered in kilometers.
   * Maps to `health:distance` in Turtle serialization.
   */
  distance?: number;

  /**
   * Total active minutes for the day.
   * Maps to `health:activeMinutes` in Turtle serialization.
   */
  activeMinutes?: number;

  /**
   * Total calories burned (active + basal).
   * Maps to `health:calories` in Turtle serialization.
   */
  calories?: number;
}
