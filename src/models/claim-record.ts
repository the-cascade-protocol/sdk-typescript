/**
 * ClaimRecord, BenefitStatement, DenialNotice, and AppealRecord models.
 *
 * Coverage workflow types for the Cascade Protocol.
 *
 * RDF types: `coverage:ClaimRecord`, `coverage:BenefitStatement`,
 *            `coverage:DenialNotice`, `coverage:AppealRecord`
 * Vocabulary: `https://ns.cascadeprotocol.org/coverage/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord } from './common.js';

/** A medical claim submitted to an insurer. Serializes as `coverage:ClaimRecord`. */
export interface ClaimRecord extends CascadeRecord {
  type: 'ClaimRecord';
  /** Values: professional, institutional, oral, pharmacy, vision. Maps to `coverage:claimType`. */
  claimType: string;
  /** ISO 8601. Maps to `coverage:claimDate`. */
  claimDate?: string;
  /** Total amount billed. Maps to `coverage:claimTotal`. */
  claimTotal?: number;
  /** Values: active, cancelled, draft, entered-in-error. Maps to `coverage:claimStatus`. */
  claimStatus?: string;
  /** Name of the billing provider. Maps to `coverage:billingProvider`. */
  billingProvider?: string;
}

/** An Explanation of Benefits document. Serializes as `coverage:BenefitStatement`. */
export interface BenefitStatement extends CascadeRecord {
  type: 'BenefitStatement';
  /** Values: completed, cancelled, entered-in-error. Maps to `coverage:adjudicationStatus`. */
  adjudicationStatus: string;
  /** ISO 8601. Maps to `coverage:adjudicationDate`. */
  adjudicationDate?: string;
  /** Values: queued, complete, error, partial. Maps to `coverage:outcomeCode`. */
  outcomeCode?: string;
  /** Total amount billed. Maps to `coverage:totalBilled`. */
  totalBilled?: number;
  /** Total amount allowed by insurer. Maps to `coverage:totalAllowed`. */
  totalAllowed?: number;
  /** Total amount paid by insurer. Maps to `coverage:totalPaid`. */
  totalPaid?: number;
  /** Amount owed by patient. Maps to `coverage:patientResponsibility`. */
  patientResponsibility?: number;
  /** Free-text denial reason if applicable. Maps to `coverage:denialReason`. */
  denialReason?: string;
}

/** A formal denial of coverage. Serializes as `coverage:DenialNotice`. */
export interface DenialNotice extends CascadeRecord {
  type: 'DenialNotice';
  /** CPT or HCPCS code of the denied service. Maps to `coverage:deniedProcedureCode`. */
  deniedProcedureCode: string;
  /** Structured denial reason code URI. Maps to `coverage:denialReasonCode`. */
  denialReasonCode?: string;
  /** Date the denial notice was issued (ISO 8601 date). Maps to `coverage:denialLetterDate`. */
  denialLetterDate?: string;
  /** Deadline for filing an appeal (ISO 8601 date). Maps to `coverage:appealDeadline`. */
  appealDeadline?: string;
  /** LCD, NCD, or policy cited as basis for denial. Maps to `coverage:coveragePolicyReference`. */
  coveragePolicyReference?: string;
}

/** A formal appeal contesting a denial notice. Serializes as `coverage:AppealRecord`. */
export interface AppealRecord extends CascadeRecord {
  type: 'AppealRecord';
  /** Appeal level (e.g., redetermination, alj_hearing). Maps to `coverage:appealLevel`. */
  appealLevel: string;
  /** Date appeal was filed (ISO 8601). Maps to `coverage:appealFiledDate`. */
  appealFiledDate?: string;
  /** Values: approved, denied, partial, withdrawn, pending. Maps to `coverage:appealOutcome`. */
  appealOutcome?: string;
  /** Date outcome was received (ISO 8601). Maps to `coverage:appealOutcomeDate`. */
  appealOutcomeDate?: string;
}
