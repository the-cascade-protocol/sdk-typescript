/**
 * ImplantedDevice data model for the Cascade Protocol.
 *
 * Represents a medical device implanted in or attached to the patient
 * as a permanent part of their health profile (e.g., pacemaker, cardiac
 * stent, cochlear implant, insulin pump). Presence affects medication
 * safety, imaging eligibility (MRI contraindications), and surgical risk.
 *
 * RDF type: `clinical:ImplantedDevice`
 * Vocabulary: `https://ns.cascadeprotocol.org/clinical/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord } from './common.js';

/**
 * An implanted device record in the Cascade Protocol.
 *
 * Required fields: `deviceType`, `dataProvenance`, `schemaVersion`.
 *
 * Serializes as `clinical:ImplantedDevice` in Turtle.
 */
export interface ImplantedDevice extends CascadeRecord {
  type: 'ImplantedDevice';

  /** Device category (e.g., "pacemaker", "stent", "cochlear-implant"). Maps to `clinical:deviceType`. */
  deviceType: string;

  /** Date the device was implanted (ISO 8601). Maps to `clinical:implantDate`. */
  implantDate?: string;

  /** Device manufacturer name. Maps to `clinical:deviceManufacturer`. */
  deviceManufacturer?: string;

  /** Unique Device Identifier (UDI) carrier string. Maps to `clinical:udiCarrier`. */
  udiCarrier?: string;

  /** Device status: active, inactive, entered-in-error. Maps to `clinical:deviceStatus`. */
  deviceStatus?: string;
}
