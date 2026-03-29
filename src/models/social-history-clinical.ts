/**
 * Clinical social history data model for the Cascade Protocol.
 *
 * Represents an EHR-extracted social history observation sourced from a
 * C-CDA Social History section (LOINC 29762-2). Subject to 42 CFR Part 2
 * sensitivity handling — distinct from `health:SocialHistoryRecord`
 * (consumer-reported lifestyle data).
 *
 * RDF type: `clinical:SocialHistoryRecord`
 * Vocabulary: `https://ns.cascadeprotocol.org/clinical/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord } from './common.js';

/**
 * Social history observation category values.
 * Maps to FHIR Observation.category `social-history`.
 */
export type SocialHistoryCategory =
  | 'smokingStatus'
  | 'alcoholUse'
  | 'substanceUse'
  | 'occupation'
  | 'educationLevel'
  | 'sexualOrientation'
  | 'genderIdentity'
  | 'householdIncome'
  | 'housingStatus'
  | 'socialIsolation';

/**
 * An EHR-extracted social history record in the Cascade Protocol.
 *
 * This class represents clinical-grade social history imported from an EHR
 * system. It is **distinct** from `health:SocialHistoryRecord`, which
 * represents consumer-reported social history (Apple Health import, user
 * entry). Records with `socialHistoryCategory === 'substanceUse'` require a
 * linked `cascade:SocialHistoryConsent` record under 42 CFR Part 2.
 *
 * Serializes as `clinical:SocialHistoryRecord` in Turtle.
 */
export interface ClinicalSocialHistoryRecord extends CascadeRecord {
  type: 'ClinicalSocialHistoryRecord';

  /**
   * Category of the social history observation.
   * Maps to `clinical:socialHistoryCategory` in Turtle serialization.
   */
  socialHistoryCategory: SocialHistoryCategory;

  /**
   * Cumulative smoking exposure in pack-years (packs/day × years smoked).
   * Applicable when `socialHistoryCategory` is `smokingStatus`.
   * Maps to `clinical:packsPerYear` in Turtle serialization.
   */
  packsPerYear?: number;

  /**
   * Type of substance for substance-use records (e.g., `"alcohol"`, `"cannabis"`, `"opioid"`).
   * Applicable when `socialHistoryCategory` is `substanceUse`.
   * Maps to `clinical:substanceType` in Turtle serialization.
   */
  substanceType?: string;

  /**
   * Free-text or coded frequency description (e.g., `"2-3 drinks/week"`, `"daily"`).
   * Maps to `clinical:frequencyDescription` in Turtle serialization.
   */
  frequencyDescription?: string;

  /**
   * URI of the linked `cascade:SocialHistoryConsent` record governing
   * storage and processing of this sensitive record.
   * Required for `substanceUse` category records (42 CFR Part 2).
   * Maps to `clinical:socialHistoryConsent` in Turtle serialization.
   */
  socialHistoryConsentUri?: string;
}
