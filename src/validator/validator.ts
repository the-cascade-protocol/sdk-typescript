import type { CascadeRecord, ProvenanceType } from '../models/common.js';

// ─── Public Types ───────────────────────────────────────────────────────────

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationError[];
}

// ─── Internal Constants ─────────────────────────────────────────────────────

const VALID_PROVENANCE_TYPES: ReadonlySet<string> = new Set<ProvenanceType>([
  'ClinicalGenerated',
  'DeviceGenerated',
  'SelfReported',
  'AIExtracted',
  'AIGenerated',
  'EHRVerified',
]);

const RECOGNIZED_DATA_TYPES: ReadonlySet<string> = new Set([
  'MedicationRecord',
  'ConditionRecord',
  'AllergyRecord',
  'LabResultRecord',
  'VitalSign',
  'ImmunizationRecord',
  'ProcedureRecord',
  'FamilyHistoryRecord',
  'CoverageRecord',
  'InsurancePlan',
  'PatientProfile',
  'ActivitySnapshot',
  'SleepSnapshot',
]);

const VALID_CONDITION_STATUSES: ReadonlySet<string> = new Set([
  'active', 'resolved', 'remission', 'inactive',
]);

const VALID_VITAL_TYPES: ReadonlySet<string> = new Set([
  'heartRate', 'bloodPressureSystolic', 'bloodPressureDiastolic',
  'respiratoryRate', 'temperature', 'oxygenSaturation',
  'weight', 'height', 'bmi',
]);

const VALID_IMMUNIZATION_STATUSES: ReadonlySet<string> = new Set([
  'completed', 'entered-in-error', 'not-done',
]);

// Types that should ideally have coding system references
const CLINICAL_TYPES_WANTING_CODES: ReadonlySet<string> = new Set([
  'MedicationRecord',
  'ConditionRecord',
  'LabResultRecord',
  'VitalSign',
  'ImmunizationRecord',
  'ProcedureRecord',
]);

// ─── Internal Helpers ───────────────────────────────────────────────────────

type RecordFields = Record<string, unknown>;

function hasField(rec: RecordFields, field: string): boolean {
  const val = rec[field];
  return val !== undefined && val !== null;
}

function hasNonEmptyString(rec: RecordFields, field: string): boolean {
  const val = rec[field];
  return typeof val === 'string' && val.trim().length > 0;
}

function hasNumber(rec: RecordFields, field: string): boolean {
  return typeof rec[field] === 'number';
}

// ─── Validation Logic ───────────────────────────────────────────────────────

function validateBase(record: CascadeRecord): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. id must be present and non-empty
  if (!record.id || record.id.trim().length === 0) {
    errors.push({ field: 'id', message: 'id must be present and non-empty', severity: 'error' });
  }

  // 2. type must be a recognized DataType
  if (!record.type || !RECOGNIZED_DATA_TYPES.has(record.type)) {
    errors.push({
      field: 'type',
      message: `type "${record.type ?? ''}" is not a recognized DataType`,
      severity: 'error',
    });
  }

  // 3. schemaVersion must be present
  if (!record.schemaVersion || record.schemaVersion.trim().length === 0) {
    errors.push({
      field: 'schemaVersion',
      message: 'schemaVersion must be present',
      severity: 'error',
    });
  }

  // 4. dataProvenance must be a valid ProvenanceType
  if (!record.dataProvenance || !VALID_PROVENANCE_TYPES.has(record.dataProvenance)) {
    errors.push({
      field: 'dataProvenance',
      message: `dataProvenance "${record.dataProvenance ?? ''}" is not a valid ProvenanceType`,
      severity: 'error',
    });
  }

  return errors;
}

function validateWarnings(record: CascadeRecord): ValidationError[] {
  const warnings: ValidationError[] = [];
  const rec = record as unknown as RecordFields;

  // Schema version warning
  if (record.schemaVersion && record.schemaVersion !== '1.3') {
    warnings.push({
      field: 'schemaVersion',
      message: `schemaVersion "${record.schemaVersion}" does not match current version "1.3"`,
      severity: 'warning',
    });
  }

  // Missing coding references on clinical types
  if (CLINICAL_TYPES_WANTING_CODES.has(record.type)) {
    const hasLoinc = hasField(rec, 'loincCode') || hasField(rec, 'testCode');
    const hasSnomed = hasField(rec, 'snomedCode');

    if (!hasLoinc && !hasSnomed) {
      warnings.push({
        field: 'loincCode',
        message: 'Missing loincCode or snomedCode on clinical record; standard coding improves interoperability',
        severity: 'warning',
      });
    }
  }

  return warnings;
}

function validateTypeSpecific(record: CascadeRecord): ValidationError[] {
  const errors: ValidationError[] = [];
  const rec = record as unknown as RecordFields;

  switch (record.type) {
    case 'MedicationRecord': {
      if (!hasNonEmptyString(rec, 'medicationName')) {
        errors.push({
          field: 'medicationName',
          message: 'medicationName is required for MedicationRecord',
          severity: 'error',
        });
      }
      if (!hasField(rec, 'isActive')) {
        errors.push({
          field: 'isActive',
          message: 'isActive is required for MedicationRecord',
          severity: 'error',
        });
      }
      break;
    }

    case 'ConditionRecord': {
      if (!hasNonEmptyString(rec, 'conditionName')) {
        errors.push({
          field: 'conditionName',
          message: 'conditionName is required for ConditionRecord',
          severity: 'error',
        });
      }
      const status = rec['status'];
      if (typeof status !== 'string' || !VALID_CONDITION_STATUSES.has(status)) {
        errors.push({
          field: 'clinicalStatus',
          message: `clinicalStatus "${String(status ?? '')}" must be a valid ConditionStatus (active, resolved, remission, inactive)`,
          severity: 'error',
        });
      }
      break;
    }

    case 'AllergyRecord': {
      if (!hasNonEmptyString(rec, 'allergen')) {
        errors.push({
          field: 'allergen',
          message: 'allergen is required for AllergyRecord',
          severity: 'error',
        });
      }
      break;
    }

    case 'LabResultRecord': {
      if (!hasNonEmptyString(rec, 'testName')) {
        errors.push({
          field: 'testName',
          message: 'testName is required for LabResultRecord',
          severity: 'error',
        });
      }
      if (!hasField(rec, 'resultValue')) {
        errors.push({
          field: 'resultValue',
          message: 'resultValue is required for LabResultRecord',
          severity: 'error',
        });
      }
      if (!hasNonEmptyString(rec, 'resultUnit')) {
        errors.push({
          field: 'resultUnit',
          message: 'resultUnit is required for LabResultRecord',
          severity: 'error',
        });
      }
      break;
    }

    case 'VitalSign': {
      const vitalType = rec['vitalType'];
      if (typeof vitalType !== 'string' || !VALID_VITAL_TYPES.has(vitalType)) {
        errors.push({
          field: 'vitalType',
          message: `vitalType "${String(vitalType ?? '')}" must be a valid VitalType`,
          severity: 'error',
        });
      }
      if (!hasNumber(rec, 'value')) {
        errors.push({
          field: 'value',
          message: 'value is required for VitalSign and must be a number',
          severity: 'error',
        });
      }
      if (!hasNonEmptyString(rec, 'unit')) {
        errors.push({
          field: 'unit',
          message: 'unit is required for VitalSign',
          severity: 'error',
        });
      }
      break;
    }

    case 'ImmunizationRecord': {
      if (!hasNonEmptyString(rec, 'vaccineName')) {
        errors.push({
          field: 'vaccineName',
          message: 'vaccineName is required for ImmunizationRecord',
          severity: 'error',
        });
      }
      const status = rec['status'];
      if (status !== undefined && typeof status === 'string' && !VALID_IMMUNIZATION_STATUSES.has(status)) {
        errors.push({
          field: 'status',
          message: `status "${status}" must be a valid ImmunizationStatus`,
          severity: 'error',
        });
      }
      break;
    }

    case 'CoverageRecord':
    case 'InsurancePlan': {
      if (!hasNonEmptyString(rec, 'providerName')) {
        errors.push({
          field: 'providerName',
          message: 'providerName is required for Coverage records',
          severity: 'error',
        });
      }
      break;
    }

    case 'PatientProfile': {
      if (!hasNonEmptyString(rec, 'givenName')) {
        errors.push({
          field: 'givenName',
          message: 'givenName is required for PatientProfile',
          severity: 'error',
        });
      }
      if (!hasNonEmptyString(rec, 'familyName')) {
        errors.push({
          field: 'familyName',
          message: 'familyName is required for PatientProfile',
          severity: 'error',
        });
      }
      break;
    }

    // ActivitySnapshot, SleepSnapshot, ProcedureRecord, FamilyHistoryRecord
    // have no additional type-specific required field validations beyond base
    default:
      break;
  }

  return errors;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Validate a single CascadeRecord for structural correctness. */
export function validate(record: CascadeRecord): ValidationResult {
  const baseErrors = validateBase(record);
  const typeErrors = validateTypeSpecific(record);
  const warningErrors = validateWarnings(record);

  const allErrors = [...baseErrors, ...typeErrors];
  const allWarnings = warningErrors;

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/** Validate an array of CascadeRecords, returning a combined result. */
export function validateAll(records: CascadeRecord[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  for (const record of records) {
    const result = validate(record);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
