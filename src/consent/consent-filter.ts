import type { ProvenanceType } from '../models/common.js';
import type { HealthProfile } from '../models/health-profile.js';

// ─── Public Types ───────────────────────────────────────────────────────────

export type ConsentCategory =
  | 'medications'
  | 'conditions'
  | 'allergies'
  | 'labResults'
  | 'vitalSigns'
  | 'immunizations'
  | 'coverage'
  | 'patientProfile'
  | 'activitySnapshots'
  | 'sleepSnapshots';

export interface ConsentRule {
  readonly category: ConsentCategory;
  readonly allowed: boolean;
  readonly provenanceFilter?: readonly ProvenanceType[];
}

export interface ConsentPolicy {
  readonly rules: readonly ConsentRule[];
  readonly defaultAllow: boolean;
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function findRule(policy: ConsentPolicy, category: ConsentCategory): ConsentRule | undefined {
  return policy.rules.find((r) => r.category === category);
}

function isAllowed(policy: ConsentPolicy, category: ConsentCategory): boolean {
  const rule = findRule(policy, category);
  if (!rule) return policy.defaultAllow;
  return rule.allowed;
}

function getProvenanceFilter(policy: ConsentPolicy, category: ConsentCategory): readonly ProvenanceType[] | undefined {
  const rule = findRule(policy, category);
  if (!rule) return undefined;
  return rule.provenanceFilter;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Apply a consent policy to a HealthProfile, returning a new profile with only allowed records. */
export function applyConsent(profile: HealthProfile, policy: ConsentPolicy): HealthProfile {
  const provenanceFilterFor = (category: ConsentCategory) => getProvenanceFilter(policy, category);

  const filterByProvenance = <T extends { dataProvenance: ProvenanceType }>(
    items: T[],
    category: ConsentCategory,
  ): T[] => {
    if (!isAllowed(policy, category)) return [];
    const pFilter = provenanceFilterFor(category);
    if (!pFilter) return [...items];
    return items.filter((item) => pFilter.includes(item.dataProvenance));
  };

  return {
    patientProfile: isAllowed(policy, 'patientProfile')
      ? profile.patientProfile
      : undefined,
    medications: filterByProvenance(profile.medications, 'medications'),
    conditions: filterByProvenance(profile.conditions, 'conditions'),
    allergies: filterByProvenance(profile.allergies, 'allergies'),
    labResults: filterByProvenance(profile.labResults, 'labResults'),
    vitalSigns: filterByProvenance(profile.vitalSigns, 'vitalSigns'),
    immunizations: filterByProvenance(profile.immunizations, 'immunizations'),
    procedures: filterByProvenance(profile.procedures, 'procedures' as ConsentCategory),
    familyHistory: filterByProvenance(profile.familyHistory, 'familyHistory' as ConsentCategory),
    coverage: filterByProvenance(profile.coverage, 'coverage'),
    activitySnapshots: filterByProvenance(profile.activitySnapshots, 'activitySnapshots'),
    sleepSnapshots: filterByProvenance(profile.sleepSnapshots, 'sleepSnapshots'),
  };
}

/** Create a consent policy that shares only clinical data (no device/wellness). */
export function clinicalOnlyPolicy(): ConsentPolicy {
  return {
    defaultAllow: true,
    rules: [
      { category: 'activitySnapshots', allowed: false },
      { category: 'sleepSnapshots', allowed: false },
      { category: 'vitalSigns', allowed: true, provenanceFilter: ['ClinicalGenerated', 'EHRVerified'] },
    ],
  };
}

/** Create a consent policy that shares everything. */
export function fullAccessPolicy(): ConsentPolicy {
  return {
    defaultAllow: true,
    rules: [],
  };
}

/** Create a consent policy that shares nothing. */
export function noAccessPolicy(): ConsentPolicy {
  return {
    defaultAllow: false,
    rules: [],
  };
}
