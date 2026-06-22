/**
 * Consumer-reported social history data model for the Cascade Protocol.
 *
 * Represents a consumer-reported social history observation (smoking, alcohol,
 * exercise, occupation, and other lifestyle factors). This class is **distinct**
 * from `clinical:SocialHistoryRecord` (EHR-extracted, 42 CFR Part 2), which is
 * modeled by `ClinicalSocialHistoryRecord`.
 *
 * RDF type: `health:SocialHistoryRecord`
 * Vocabulary: `https://ns.cascadeprotocol.org/health/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord } from './common.js';

/**
 * A consumer-reported social history record in the Cascade Protocol.
 *
 * This class represents lifestyle data reported by the patient (Apple Health
 * import, user entry). It is **distinct** from `clinical:SocialHistoryRecord`,
 * which represents clinical-grade social history extracted from an EHR system
 * and is subject to 42 CFR Part 2 sensitivity handling.
 *
 * Serializes as `health:SocialHistoryRecord` in Turtle.
 */
export interface SocialHistoryRecord extends CascadeRecord {
  type: 'SocialHistoryRecord';

  /**
   * Patient's smoking status (e.g., `"current-smoker"`, `"former-smoker"`,
   * `"never-smoker"`).
   * Maps to `health:smokingStatus` in Turtle serialization.
   */
  smokingStatus?: string;

  /**
   * Patient's alcohol consumption description (e.g., `"2-3 drinks/week"`).
   * Maps to `health:alcoholUse` in Turtle serialization.
   */
  alcoholUse?: string;

  /**
   * Patient's reported exercise frequency (e.g., `"3x/week"`, `"daily"`).
   * Maps to `health:exerciseFrequency` in Turtle serialization.
   */
  exerciseFrequency?: string;

  /**
   * Occupational exposures relevant to patient health (e.g., `"asbestos"`).
   * Maps to `health:occupationalExposure` in Turtle serialization.
   */
  occupationalExposure?: string;
}
