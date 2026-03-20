/**
 * Cascade Protocol namespace URIs and vocabulary constants.
 *
 * These constants map directly to the RDF namespace prefixes used
 * in Turtle serialization throughout the Cascade Protocol ecosystem.
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

// ─── Namespace URIs ──────────────────────────────────────────────────────────

/**
 * Cascade Protocol namespace URIs.
 *
 * Used as RDF prefixes in Turtle serialization. Each entry maps a
 * short prefix name to its full IRI.
 *
 * @example
 * ```typescript
 * import { NAMESPACES } from '@the-cascade-protocol/sdk';
 *
 * // Use in Turtle prefix declarations
 * const prefix = `@prefix cascade: <${NAMESPACES.cascade}> .`;
 * ```
 */
export const NAMESPACES = {
  /** Cascade Protocol core vocabulary (v1). */
  cascade: 'https://ns.cascadeprotocol.org/core/v1#',

  /** Cascade Protocol clinical vocabulary (v1). */
  clinical: 'https://ns.cascadeprotocol.org/clinical/v1#',

  /** Cascade Protocol health/wellness vocabulary (v1). */
  health: 'https://ns.cascadeprotocol.org/health/v1#',

  /** Cascade Protocol checkup vocabulary (v1). */
  checkup: 'https://ns.cascadeprotocol.org/checkup/v1#',

  /** Cascade Protocol POTS vocabulary (v1). */
  pots: 'https://ns.cascadeprotocol.org/pots/v1#',

  /** Cascade Protocol coverage/insurance vocabulary (v1). */
  coverage: 'https://ns.cascadeprotocol.org/coverage/v1#',

  /** HL7 FHIR namespace. */
  fhir: 'http://hl7.org/fhir/',

  /** SNOMED CT namespace. */
  sct: 'http://snomed.info/sct/',

  /** ICD-10-CM namespace. */
  icd10: 'http://hl7.org/fhir/sid/icd-10-cm/',

  /** LOINC namespace. */
  loinc: 'http://loinc.org/rdf#',

  /** RxNorm namespace. */
  rxnorm: 'http://www.nlm.nih.gov/research/umls/rxnorm/',

  /** W3C PROV-O namespace. */
  prov: 'http://www.w3.org/ns/prov#',

  /** XML Schema datatypes namespace. */
  xsd: 'http://www.w3.org/2001/XMLSchema#',

  /** Unified Code for Units of Measure namespace. */
  ucum: 'http://unitsofmeasure.org/',

  /** FOAF (Friend of a Friend) namespace for personal info. */
  foaf: 'http://xmlns.com/foaf/0.1/',

  /** Linked Data Platform namespace. */
  ldp: 'http://www.w3.org/ns/ldp#',

  /** Dublin Core Terms namespace. */
  dcterms: 'http://purl.org/dc/terms/',
} as const;

/**
 * Type representing all known namespace prefix keys.
 */
export type NamespacePrefix = keyof typeof NAMESPACES;

// ─── Type Mapping ────────────────────────────────────────────────────────────

/**
 * Mapping from data type key (as used in Pod file paths and CLI queries)
 * to the corresponding RDF type, name field key, and name predicate.
 *
 * Used during serialization and deserialization to determine:
 * - `rdfType`: The `rdf:type` value for the record
 * - `nameKey`: The JSON property holding the record's display name
 * - `namePred`: The Turtle predicate for the name field
 *
 * @example
 * ```typescript
 * import { TYPE_MAPPING } from '@the-cascade-protocol/sdk';
 *
 * const medType = TYPE_MAPPING.medications;
 * // { rdfType: 'health:MedicationRecord', nameKey: 'medicationName', namePred: 'health:medicationName' }
 * ```
 */
export const TYPE_MAPPING: Record<string, { rdfType: string; nameKey: string; namePred: string }> = {
  medications: {
    rdfType: 'health:MedicationRecord',
    nameKey: 'medicationName',
    namePred: 'health:medicationName',
  },
  conditions: {
    rdfType: 'health:ConditionRecord',
    nameKey: 'conditionName',
    namePred: 'health:conditionName',
  },
  allergies: {
    rdfType: 'health:AllergyRecord',
    nameKey: 'allergen',
    namePred: 'health:allergen',
  },
  'lab-results': {
    rdfType: 'health:LabResultRecord',
    nameKey: 'testName',
    namePred: 'health:testName',
  },
  immunizations: {
    rdfType: 'health:ImmunizationRecord',
    nameKey: 'vaccineName',
    namePred: 'health:vaccineName',
  },
  'vital-signs': {
    rdfType: 'clinical:VitalSign',
    nameKey: 'vitalType',
    namePred: 'clinical:vitalType',
  },
  supplements: {
    rdfType: 'clinical:Supplement',
    nameKey: 'supplementName',
    namePred: 'clinical:supplementName',
  },
  procedures: {
    rdfType: 'clinical:Procedure',
    nameKey: 'procedureName',
    namePred: 'clinical:procedureName',
  },
  encounters: {
    rdfType: 'clinical:Encounter',
    nameKey: 'encounterType',
    namePred: 'clinical:encounterType',
  },
  'medication-administrations': {
    rdfType: 'clinical:MedicationAdministration',
    nameKey: 'medicationName',
    namePred: 'health:medicationName',
  },
  'implanted-devices': {
    rdfType: 'clinical:ImplantedDevice',
    nameKey: 'deviceType',
    namePred: 'clinical:deviceType',
  },
  'imaging-studies': {
    rdfType: 'clinical:ImagingStudy',
    nameKey: 'studyDescription',
    namePred: 'clinical:studyDescription',
  },
  claims: {
    rdfType: 'coverage:ClaimRecord',
    nameKey: 'claimType',
    namePred: 'coverage:claimType',
  },
  'benefit-statements': {
    rdfType: 'coverage:BenefitStatement',
    nameKey: 'adjudicationStatus',
    namePred: 'coverage:adjudicationStatus',
  },
  'denial-notices': {
    rdfType: 'coverage:DenialNotice',
    nameKey: 'deniedProcedureCode',
    namePred: 'coverage:deniedProcedureCode',
  },
  appeals: {
    rdfType: 'coverage:AppealRecord',
    nameKey: 'appealLevel',
    namePred: 'coverage:appealLevel',
  },
  'family-history': {
    rdfType: 'health:FamilyHistoryRecord',
    nameKey: 'conditionName',
    namePred: 'health:conditionName',
  },
  insurance: {
    rdfType: 'clinical:CoverageRecord',
    nameKey: 'providerName',
    namePred: 'clinical:providerName',
  },
  'patient-profile': {
    rdfType: 'cascade:PatientProfile',
    nameKey: 'name',
    namePred: 'foaf:name',
  },
  activity: {
    rdfType: 'health:ActivitySnapshot',
    nameKey: 'date',
    namePred: 'health:date',
  },
  sleep: {
    rdfType: 'health:SleepSnapshot',
    nameKey: 'date',
    namePred: 'health:date',
  },
  'heart-rate': {
    rdfType: 'clinical:VitalSign',
    nameKey: 'vitalType',
    namePred: 'clinical:vitalType',
  },
  'blood-pressure': {
    rdfType: 'clinical:VitalSign',
    nameKey: 'vitalType',
    namePred: 'clinical:vitalType',
  },
} as const;

// ─── Record Type to Mapping Key ─────────────────────────────────────────────

/**
 * Mapping from record type string (e.g. 'MedicationRecord') to the
 * TYPE_MAPPING key (e.g. 'medications') used for looking up rdfType,
 * nameKey, and namePred.
 *
 * Used by the serializer, deserializer, and JSON-LD converter to
 * dispatch on record type.
 */
export const TYPE_TO_MAPPING_KEY: Record<string, string> = {
  MedicationRecord: 'medications',
  ConditionRecord: 'conditions',
  AllergyRecord: 'allergies',
  LabResultRecord: 'lab-results',
  ImmunizationRecord: 'immunizations',
  VitalSign: 'vital-signs',
  Supplement: 'supplements',
  ProcedureRecord: 'procedures',
  Procedure: 'procedures',
  Encounter: 'encounters',
  FamilyHistoryRecord: 'family-history',
  CoverageRecord: 'insurance',
  InsurancePlan: 'insurance',
  MedicationAdministration: 'medication-administrations',
  ImplantedDevice: 'implanted-devices',
  ImagingStudy: 'imaging-studies',
  ClaimRecord: 'claims',
  BenefitStatement: 'benefit-statements',
  DenialNotice: 'denial-notices',
  AppealRecord: 'appeals',
  PatientProfile: 'patient-profile',
  ActivitySnapshot: 'activity',
  SleepSnapshot: 'sleep',
};

// ─── Schema Version ──────────────────────────────────────────────────────────

/**
 * Current Cascade Protocol schema version.
 *
 * Used by the validator to check records against the expected version.
 * Update this constant when the protocol schema version is bumped.
 */
export const CURRENT_SCHEMA_VERSION = '1.3';

// ─── Property Predicates ─────────────────────────────────────────────────────

/**
 * Mapping from JSON property names to their corresponding Turtle predicates.
 *
 * Used during serialization to convert JSON key-value pairs into
 * RDF triples with the correct predicate URIs.
 *
 * @example
 * ```typescript
 * import { PROPERTY_PREDICATES } from '@the-cascade-protocol/sdk';
 *
 * const pred = PROPERTY_PREDICATES.dose; // 'health:dose'
 * ```
 */
export const PROPERTY_PREDICATES: Record<string, string> = {
  // ── Medication predicates (health: vocabulary) ──
  medicationName: 'health:medicationName',
  dose: 'health:dose',
  frequency: 'health:frequency',
  route: 'health:route',
  prescriber: 'health:prescriber',
  startDate: 'health:startDate',
  endDate: 'health:endDate',
  isActive: 'health:isActive',
  rxNormCode: 'health:rxNormCode',
  medicationClass: 'health:medicationClass',
  affectsVitalSigns: 'health:affectsVitalSigns',

  // ── Condition predicates (health: vocabulary) ──
  conditionName: 'health:conditionName',
  status: 'health:status',
  onsetDate: 'health:onsetDate',
  icd10Code: 'health:icd10Code',
  snomedCode: 'health:snomedCode',
  conditionClass: 'health:conditionClass',
  monitoredVitalSigns: 'health:monitoredVitalSigns',

  // ── Allergy predicates (health: vocabulary) ──
  allergen: 'health:allergen',
  allergyCategory: 'health:allergyCategory',
  reaction: 'health:reaction',
  allergySeverity: 'health:allergySeverity',

  // ── Lab result predicates (health: vocabulary) ──
  testName: 'health:testName',
  resultValue: 'health:resultValue',
  resultUnit: 'health:resultUnit',
  referenceRange: 'health:referenceRange',
  interpretation: 'health:interpretation',
  performedDate: 'health:performedDate',
  testCode: 'health:testCode',
  labCategory: 'health:labCategory',
  specimenType: 'health:specimenType',
  reportedDate: 'health:reportedDate',
  orderingProvider: 'health:orderingProvider',
  performingLab: 'health:performingLab',

  // ── Immunization predicates (health: vocabulary) ──
  vaccineName: 'health:vaccineName',
  administrationDate: 'health:administrationDate',
  vaccineCode: 'health:vaccineCode',
  manufacturer: 'health:manufacturer',
  lotNumber: 'health:lotNumber',
  doseQuantity: 'health:doseQuantity',
  site: 'health:site',
  administeringProvider: 'health:administeringProvider',
  administeringLocation: 'health:administeringLocation',

  // ── Vital sign predicates (clinical: vocabulary) ──
  vitalType: 'clinical:vitalType',
  vitalTypeName: 'clinical:vitalTypeName',
  value: 'clinical:value',
  unit: 'clinical:unit',
  effectiveDate: 'clinical:effectiveDate',
  loincCode: 'clinical:loincCode',
  referenceRangeLow: 'clinical:referenceRangeLow',
  referenceRangeHigh: 'clinical:referenceRangeHigh',

  // ── Clinical enrichment predicates ──
  provenanceClass: 'clinical:provenanceClass',
  sourceFhirResourceType: 'clinical:sourceFhirResourceType',
  clinicalIntent: 'clinical:clinicalIntent',
  indication: 'clinical:indication',
  courseOfTherapyType: 'clinical:courseOfTherapyType',
  asNeeded: 'clinical:asNeeded',
  medicationForm: 'clinical:medicationForm',
  activeIngredient: 'clinical:activeIngredient',
  ingredientStrength: 'clinical:ingredientStrength',
  refillsAllowed: 'clinical:refillsAllowed',
  supplyDurationDays: 'clinical:supplyDurationDays',
  prescriptionCategory: 'clinical:prescriptionCategory',
  drugCode: 'clinical:drugCode',
  drugCodes: 'clinical:drugCode',

  // ── Coverage predicates (clinical: and coverage: vocabularies) ──
  providerName: 'clinical:providerName',
  memberId: 'clinical:memberId',
  groupNumber: 'clinical:groupNumber',
  planName: 'clinical:planName',
  planType: 'clinical:planType',
  coverageType: 'clinical:coverageType',
  relationship: 'clinical:relationship',
  effectivePeriodStart: 'clinical:effectivePeriodStart',
  effectivePeriodEnd: 'clinical:effectivePeriodEnd',
  payorName: 'clinical:payorName',
  subscriberId: 'clinical:subscriberId',
  subscriberRelationship: 'coverage:subscriberRelationship',
  subscriberName: 'coverage:subscriberName',
  effectiveStart: 'coverage:effectiveStart',
  effectiveEnd: 'coverage:effectiveEnd',
  rxBin: 'coverage:rxBin',
  rxPcn: 'coverage:rxPcn',
  rxGroup: 'coverage:rxGroup',

  // ── Patient profile predicates (cascade: and foaf: vocabularies) ──
  dateOfBirth: 'cascade:dateOfBirth',
  biologicalSex: 'cascade:biologicalSex',
  computedAge: 'cascade:computedAge',
  ageGroup: 'cascade:ageGroup',
  genderIdentity: 'cascade:genderIdentity',
  profileId: 'cascade:profileId',
  name: 'foaf:name',
  givenName: 'foaf:givenName',
  familyName: 'foaf:familyName',
  bloodType: 'health:bloodType',

  // ── Procedure predicates (clinical: vocabulary — EHR-sourced) ──
  procedureName: 'clinical:procedureName',
  cptCode: 'clinical:cptCode',
  procedureStatus: 'clinical:procedureStatus',
  performer: 'health:performer',
  location: 'health:location',

  // ── Encounter predicates (clinical: vocabulary — EHR-sourced) ──
  encounterType: 'clinical:encounterType',
  encounterClass: 'clinical:encounterClass',
  encounterStatus: 'clinical:encounterStatus',
  encounterStart: 'clinical:encounterStart',
  encounterEnd: 'clinical:encounterEnd',

  // ── Family history predicates ──
  // Note: `relationship` is shared with Coverage predicates above (clinical:relationship)
  onsetAge: 'health:onsetAge',

  // ── Shared predicates ──
  notes: 'health:notes',
  sourceRecordId: 'health:sourceRecordId',

  // ── Activity snapshot predicates ──
  date: 'health:date',
  steps: 'health:steps',
  distance: 'health:distance',
  activeMinutes: 'health:activeMinutes',
  calories: 'health:calories',

  // ── Sleep snapshot predicates ──
  totalSleepMinutes: 'health:totalSleepMinutes',
  deepSleepMinutes: 'health:deepSleepMinutes',
  remSleepMinutes: 'health:remSleepMinutes',
  lightSleepMinutes: 'health:lightSleepMinutes',
  awakenings: 'health:awakenings',

  // ── MedicationAdministration predicates (clinical: vocabulary) ──
  administeredDate: 'clinical:administeredDate',
  administeredDose: 'clinical:administeredDose',
  administeredRoute: 'clinical:administeredRoute',
  administrationStatus: 'clinical:administrationStatus',

  // ── ImplantedDevice predicates (clinical: vocabulary) ──
  deviceType: 'clinical:deviceType',
  implantDate: 'clinical:implantDate',
  deviceManufacturer: 'clinical:deviceManufacturer',
  udiCarrier: 'clinical:udiCarrier',
  deviceStatus: 'clinical:deviceStatus',

  // ── ImagingStudy predicates (clinical: vocabulary) ──
  imagingModality: 'clinical:imagingModality',
  studyDescription: 'clinical:studyDescription',
  numberOfSeries: 'clinical:numberOfSeries',
  studyDate: 'clinical:studyDate',
  dicomStudyUid: 'clinical:dicomStudyUid',
  retrieveUrl: 'clinical:retrieveUrl',

  // ── Coverage v1.3 — ClaimRecord predicates ──
  claimDate: 'coverage:claimDate',
  claimTotal: 'coverage:claimTotal',
  claimStatus: 'coverage:claimStatus',
  claimType: 'coverage:claimType',
  billingProvider: 'coverage:billingProvider',

  // ── Coverage v1.3 — BenefitStatement predicates ──
  adjudicationDate: 'coverage:adjudicationDate',
  adjudicationStatus: 'coverage:adjudicationStatus',
  outcomeCode: 'coverage:outcomeCode',
  denialReason: 'coverage:denialReason',
  totalBilled: 'coverage:totalBilled',
  totalAllowed: 'coverage:totalAllowed',
  totalPaid: 'coverage:totalPaid',
  patientResponsibility: 'coverage:patientResponsibility',
  relatedClaim: 'coverage:relatedClaim',

  // ── Coverage v1.3 — DenialNotice predicates ──
  deniedProcedureCode: 'coverage:deniedProcedureCode',
  denialReasonCode: 'coverage:denialReasonCode',
  denialLetterDate: 'coverage:denialLetterDate',
  appealDeadline: 'coverage:appealDeadline',
  coveragePolicyReference: 'coverage:coveragePolicyReference',

  // ── Coverage v1.3 — AppealRecord predicates ──
  appealLevel: 'coverage:appealLevel',
  appealFiledDate: 'coverage:appealFiledDate',
  appealOutcome: 'coverage:appealOutcome',
  appealOutcomeDate: 'coverage:appealOutcomeDate',

  // ── Core v2.8 — FHIR passthrough predicates ──
  layerPromotionStatus: 'cascade:layerPromotionStatus',
  fhirJson: 'cascade:fhirJson',
  sourceRecordDate: 'cascade:sourceRecordDate',

  // ── Core predicates (cascade: vocabulary) ──
  dataProvenance: 'cascade:dataProvenance',
  schemaVersion: 'cascade:schemaVersion',
} as const;

// ─── Reverse Predicate Mapping ──────────────────────────────────────────────

/**
 * Build a reverse mapping from full predicate URI to JSON property name.
 *
 * Expands each PROPERTY_PREDICATES shorthand (e.g. 'health:medicationName')
 * to a full URI and maps it back to the JSON key.
 *
 * @param additionalMappings - Optional extra full-URI-to-JSON-key entries
 *   (e.g. type-specific overrides for VitalSign clinical predicates).
 */
export function buildReversePredicateMap(
  additionalMappings?: Record<string, string>,
): Map<string, string> {
  const reverseMap = new Map<string, string>();
  for (const [jsonKey, predShorthand] of Object.entries(PROPERTY_PREDICATES)) {
    const colonIdx = predShorthand.indexOf(':');
    if (colonIdx >= 0) {
      const nsPrefix = predShorthand.slice(0, colonIdx);
      const localName = predShorthand.slice(colonIdx + 1);
      const nsUri = NAMESPACES[nsPrefix as keyof typeof NAMESPACES];
      if (nsUri) {
        reverseMap.set(`${nsUri}${localName}`, jsonKey);
      }
    }
  }
  if (additionalMappings) {
    for (const [fullUri, jsonKey] of Object.entries(additionalMappings)) {
      reverseMap.set(fullUri, jsonKey);
    }
  }
  return reverseMap;
}
