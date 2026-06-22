/**
 * Provenance and caregiver-proxy models for the Cascade Protocol core
 * vocabulary (core v3.1–v3.3).
 *
 * Covers PROV-O activities for advisory application and AI generation, plus the
 * caregiver-proxy agent that operates a patient's Pod on their behalf.
 *
 * RDF types: `cascade:AdvisoryApplicationActivity`,
 *            `cascade:AIGenerationActivity`,
 *            `cascade:ProxyAgent`
 * Vocabulary: `https://ns.cascadeprotocol.org/core/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord } from './common.js';

/**
 * Reason an `AIGenerationActivity` ran.
 *
 * Maps to the `cascade:GenerationTrigger` named individuals:
 * - `InitialGeneration` -- first-time generation; no prior version existed.
 * - `RegenerationAfterReclassification` -- an upstream classification changed.
 * - `AudienceRetargeting` -- retargeting existing content for a new audience.
 *
 * Maps to `cascade:trigger` in Turtle serialization
 * (raw values prefix as `cascade:InitialGeneration`, etc.).
 */
export type GenerationTrigger =
  | 'InitialGeneration'
  | 'RegenerationAfterReclassification'
  | 'AudienceRetargeting';

/**
 * A PROV-O Activity recording the application of a Cascade Advisory Patch to a
 * pod. Join to advisory provenance via `prov:used`; link records produced or
 * modified by the patch via `prov:wasGeneratedBy`.
 *
 * Serializes as `cascade:AdvisoryApplicationActivity` in Turtle.
 */
export interface AdvisoryApplicationActivity extends CascadeRecord {
  type: 'AdvisoryApplicationActivity';

  /**
   * Total number of triples the advisory's CAP body inserted into the pod for
   * this single match. Lets a downstream auditor verify CAP profile constraint
   * C5 (≤ 64 inserted triples per match) without re-parsing the patch body.
   * Maps to `cascade:appliedTriplesCount` (`xsd:nonNegativeInteger`).
   */
  appliedTriplesCount?: number;
}

/**
 * An LLM-powered PROV-O Activity that produced narrative or summary content.
 * Sibling of `cascade:AIExtractionActivity`: extraction pulls structured
 * records out of unstructured text, generation produces new prose. Link from
 * generated content to the activity via `prov:wasGeneratedBy`.
 *
 * Reuses `extractionModel`, `extractionConfidence`, `sourceNarrativeSection`,
 * and `requiresUserReview` from `AIExtractionActivity`, and adds
 * `promptVersion`, `generationTemperature`, and `trigger`.
 *
 * Serializes as `cascade:AIGenerationActivity` in Turtle.
 */
export interface AIGenerationActivity extends CascadeRecord {
  type: 'AIGenerationActivity';

  /**
   * Identifier of the AI/LLM model used for generation
   * (e.g., `"qwen3.5-4b-q4_k_m"`).
   * Maps to `cascade:extractionModel` in Turtle serialization.
   */
  extractionModel?: string;

  /**
   * Model confidence score for the generated content, in the range [0.0, 1.0].
   * Maps to `cascade:extractionConfidence` in Turtle serialization.
   */
  extractionConfidence?: number;

  /**
   * The document or data section the generation drew from
   * (e.g., `"variant-narrative"`).
   * Maps to `cascade:sourceNarrativeSection` in Turtle serialization.
   */
  sourceNarrativeSection?: string;

  /**
   * True when the generated content must be reviewed by the patient before
   * persisting.
   * Maps to `cascade:requiresUserReview` in Turtle serialization.
   */
  requiresUserReview?: boolean;

  /**
   * Identifier of the prompt template version used for this generation
   * (e.g., `"variant-narrative-v2.1"`).
   * Maps to `cascade:promptVersion` in Turtle serialization.
   */
  promptVersion?: string;

  /**
   * Sampling temperature used during generation (typically 0.0–1.0).
   * Maps to `cascade:generationTemperature` (`xsd:decimal`).
   */
  generationTemperature?: number;

  /**
   * The reason this generation activity ran.
   * Maps to `cascade:trigger` in Turtle serialization.
   */
  trigger?: GenerationTrigger;
}

/**
 * A person operating a patient's Pod on the patient's behalf (e.g., a parent
 * for a minor child, a caregiver for a dependent adult). A PROV-O Agent,
 * distinct from the patient (`cascade:PatientProfile`). Records who is acting
 * and under what authority and scope.
 *
 * Serializes as `cascade:ProxyAgent` in Turtle.
 */
export interface ProxyAgent extends CascadeRecord {
  type: 'ProxyAgent';

  /**
   * The patient (WebID) on whose behalf the proxy acts.
   * Maps to `cascade:actsForPatient` in Turtle serialization.
   */
  actsForPatient?: string;

  /**
   * WebID of the proxy agent.
   * Maps to `cascade:proxyWebID` in Turtle serialization.
   */
  proxyWebID?: string;

  /**
   * Relationship of the proxy to the patient (e.g., `"parent"`, `"guardian"`,
   * `"caregiver"`, `"spouse"`, `"child"`, `"other"`).
   * Maps to `cascade:proxyRelationship` in Turtle serialization.
   */
  proxyRelationship?: string;

  /**
   * Authority scope (e.g., `"full"`, `"read-only"`, `"investigation-only"`).
   * Composable with `cascade:consentScope`, which it does not replace.
   * Maps to `cascade:proxyScope` in Turtle serialization.
   */
  proxyScope?: string;

  /**
   * Timestamp when the proxy authority was granted (ISO 8601).
   * Maps to `cascade:proxyGrantedAt` (`xsd:dateTime`).
   */
  proxyGrantedAt?: string;

  /**
   * Timestamp when the proxy authority was revoked (ISO 8601), if applicable.
   * Maps to `cascade:proxyRevokedAt` (`xsd:dateTime`).
   */
  proxyRevokedAt?: string;
}
