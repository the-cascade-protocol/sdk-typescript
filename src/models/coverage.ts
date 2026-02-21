/**
 * Coverage / Insurance data model for the Cascade Protocol.
 *
 * Represents an insurance coverage or plan record. Supports both the
 * clinical vocabulary (`clinical:CoverageRecord`) and the dedicated
 * coverage vocabulary (`coverage:InsurancePlan`).
 *
 * RDF types: `clinical:CoverageRecord` or `coverage:InsurancePlan`
 * Vocabularies:
 * - `https://ns.cascadeprotocol.org/clinical/v1#`
 * - `https://ns.cascadeprotocol.org/coverage/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type {
  CascadeRecord,
  PlanType,
  CoverageType,
  SubscriberRelationship,
} from './common.js';

/**
 * A coverage / insurance record in the Cascade Protocol.
 *
 * Required fields: `providerName`, `dataProvenance`, `schemaVersion`.
 * All date fields use ISO 8601 string format.
 *
 * Serializes as `clinical:CoverageRecord` or `coverage:InsurancePlan` in Turtle.
 */
export interface Coverage extends CascadeRecord {
  type: 'CoverageRecord' | 'InsurancePlan';

  /**
   * Name of the insurance provider.
   * Maps to `clinical:providerName` or `coverage:providerName` in Turtle serialization.
   */
  providerName: string;

  /**
   * Member identifier for the insured individual.
   * Maps to `clinical:memberId` or `coverage:memberId` in Turtle serialization.
   */
  memberId?: string;

  /**
   * Group number for the insurance plan.
   * Maps to `clinical:groupNumber` or `coverage:groupNumber` in Turtle serialization.
   */
  groupNumber?: string;

  /**
   * Name of the insurance plan.
   * Maps to `clinical:planName` or `coverage:planName` in Turtle serialization.
   */
  planName?: string;

  /**
   * Type of insurance plan.
   * Maps to `clinical:planType` or `coverage:planType` in Turtle serialization.
   */
  planType?: PlanType | string;

  /**
   * Coverage designation (primary, secondary, supplemental).
   * Maps to `clinical:coverageType` or `coverage:coverageType` in Turtle serialization.
   */
  coverageType?: CoverageType | string;

  /**
   * Subscriber relationship to plan holder.
   * Maps to `clinical:relationship` or `coverage:subscriberRelationship` in Turtle serialization.
   */
  relationship?: SubscriberRelationship | string;

  /**
   * Alias for `relationship` used in the coverage vocabulary.
   * Maps to `coverage:subscriberRelationship` in Turtle serialization.
   */
  subscriberRelationship?: SubscriberRelationship | string;

  /**
   * Start date of the coverage period (ISO 8601).
   * Maps to `clinical:effectivePeriodStart` in Turtle serialization.
   */
  effectivePeriodStart?: string;

  /**
   * End date of the coverage period (ISO 8601).
   * Maps to `clinical:effectivePeriodEnd` in Turtle serialization.
   */
  effectivePeriodEnd?: string;

  /**
   * Start date of effectiveness (ISO 8601, coverage vocabulary).
   * Maps to `coverage:effectiveStart` in Turtle serialization.
   */
  effectiveStart?: string;

  /**
   * End date of effectiveness (ISO 8601, coverage vocabulary).
   * Maps to `coverage:effectiveEnd` in Turtle serialization.
   */
  effectiveEnd?: string;

  /**
   * Name of the payor organization.
   * Maps to `clinical:payorName` in Turtle serialization.
   */
  payorName?: string;

  /**
   * Subscriber identifier for the plan holder.
   * Maps to `clinical:subscriberId` or `coverage:subscriberId` in Turtle serialization.
   */
  subscriberId?: string;

  /**
   * Name of the primary subscriber on the plan.
   * Maps to `coverage:subscriberName` in Turtle serialization.
   */
  subscriberName?: string;

  /**
   * Pharmacy BIN (Bank Identification Number) for prescription benefits.
   * Maps to `coverage:rxBin` in Turtle serialization.
   */
  rxBin?: string;

  /**
   * Pharmacy PCN (Processor Control Number) for prescription benefits.
   * Maps to `coverage:rxPcn` in Turtle serialization.
   */
  rxPcn?: string;

  /**
   * Pharmacy group number for prescription benefits.
   * Maps to `coverage:rxGroup` in Turtle serialization.
   */
  rxGroup?: string;
}
