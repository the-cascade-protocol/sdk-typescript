/**
 * AI extraction provenance models for the Cascade Protocol.
 *
 * Represents PROV-O activities and audit records for AI/NLP extraction
 * passes over clinical documents.
 *
 * RDF types: `cascade:AIExtractionActivity`, `cascade:AIDiscardedExtraction`,
 *            `cascade:SocialHistoryConsent`
 * Vocabulary: `https://ns.cascadeprotocol.org/core/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord } from './common.js';

/**
 * A PROV-O Activity representing an AI/NLP extraction pass over a clinical
 * document section. Linked to extracted records via `prov:wasGeneratedBy`.
 *
 * Serializes as `cascade:AIExtractionActivity` in Turtle.
 */
export interface AIExtractionActivity extends CascadeRecord {
  type: 'AIExtractionActivity';

  /**
   * Model confidence score for the extracted value, in the range [0.0, 1.0].
   * Maps to `cascade:extractionConfidence` in Turtle serialization.
   */
  extractionConfidence?: number;

  /**
   * Identifier of the AI/NLP model used for extraction
   * (e.g., `"qwen3.5-4b-q4_k_m"`).
   * Maps to `cascade:extractionModel` in Turtle serialization.
   */
  extractionModel?: string;

  /**
   * The C-CDA or document section the AI extracted data from
   * (e.g., `"medications"`, `"social-history"`).
   * Maps to `cascade:sourceNarrativeSection` in Turtle serialization.
   */
  sourceNarrativeSection?: string;

  /**
   * True when the extraction confidence is below the auto-accept threshold
   * and the record must be reviewed by the patient before persisting.
   * Maps to `cascade:requiresUserReview` in Turtle serialization.
   */
  requiresUserReview?: boolean;
}

/**
 * An extraction candidate that the AI model identified but discarded
 * (low confidence, duplicate, or out-of-scope). Stored for audit and
 * re-review purposes.
 *
 * Serializes as `cascade:AIDiscardedExtraction` in Turtle.
 */
export interface AIDiscardedExtraction extends CascadeRecord {
  type: 'AIDiscardedExtraction';

  /**
   * Human-readable reason the extraction candidate was discarded.
   * Maps to `cascade:discardReason` in Turtle serialization.
   */
  discardReason?: string;
}

/**
 * Consent record governing the storage and processing of sensitive social
 * history data under 42 CFR Part 2 and equivalent regulations.
 *
 * Serializes as `cascade:SocialHistoryConsent` in Turtle.
 */
export interface SocialHistoryConsent extends CascadeRecord {
  type: 'SocialHistoryConsent';

  /**
   * Scope of the consent grant.
   * Values: `social-history`, `substance-use`, `mental-health`.
   * Maps to `cascade:consentScope` in Turtle serialization.
   */
  consentScope?: string;

  /**
   * Timestamp when the patient granted consent (ISO 8601).
   * Maps to `cascade:consentGrantedAt` in Turtle serialization.
   */
  consentGrantedAt?: string;

  /**
   * Timestamp when the patient revoked consent (ISO 8601), if applicable.
   * Maps to `cascade:consentRevokedAt` in Turtle serialization.
   */
  consentRevokedAt?: string;
}
