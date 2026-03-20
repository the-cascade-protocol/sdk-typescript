/**
 * ImagingStudy data model for the Cascade Protocol.
 *
 * Metadata record for a diagnostic imaging study (CT, MRI, X-ray,
 * ultrasound). Records that imaging exists and its key characteristics
 * without requiring access to DICOM images. Useful for clinical timeline,
 * pre-procedure review, and agent reasoning about imaging history.
 *
 * RDF type: `clinical:ImagingStudy`
 * Vocabulary: `https://ns.cascadeprotocol.org/clinical/v1#`
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CascadeRecord } from './common.js';

/**
 * An imaging study record in the Cascade Protocol.
 *
 * Required fields: `studyDescription`, `dataProvenance`, `schemaVersion`.
 *
 * Serializes as `clinical:ImagingStudy` in Turtle.
 */
export interface ImagingStudy extends CascadeRecord {
  type: 'ImagingStudy';

  /** Human-readable study description. Maps to `clinical:studyDescription`. */
  studyDescription: string;

  /** Imaging modality: CT, MR, DX, US, NM. Maps to `clinical:imagingModality`. */
  imagingModality?: string;

  /** Date of the study (ISO 8601). Maps to `clinical:studyDate`. */
  studyDate?: string;

  /** Number of series in the study. Maps to `clinical:numberOfSeries`. */
  numberOfSeries?: number;

  /** DICOM Study Instance UID. Maps to `clinical:dicomStudyUid`. */
  dicomStudyUid?: string;

  /** URL to the DICOM server for retrieval, if available. Maps to `clinical:retrieveUrl`. */
  retrieveUrl?: string;
}
