/**
 * Cascade clinical terminology resolver.
 *
 * One versioned surface-form map serving both consumers of the shared substrate:
 *   - reconciliation: brand to generic (Zyrtec -> cetirizine) so a brand and its
 *     generic dedupe even without a shared code;
 *   - grounding/retrieval: lay synonym / common name to code ("sugar" -> glucose
 *     LOINC, "heart attack" -> MI SNOMED) so a claim resolves to the codes the
 *     KG is keyed on.
 *
 * Determinism-first: O(1) lowercased-string lookup, no model, no I/O. The asset
 * maps onto ratified systems (RxNorm/SNOMED/LOINC/NDC/ATC) via {@link CodeRef};
 * it never coins codes. It is INJECTABLE and DEGRADES TO IDENTITY when absent
 * (`identityTerminologyResolver`), so the matcher and grounder stay deterministic
 * and unit-testable without the data asset — exactly Checkup's DrugNameNormalizer
 * contract (`lowercased()` when no normalizer is injected).
 *
 * The asset itself (`../data/cascade-terminology.json`) is a real Cascade
 * deliverable: LLM-drafted, human-reviewed, refreshed on a schedule. This module
 * is the stable interface over whatever the asset currently contains.
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import type { CodeRef, CodeSystem } from './code-keys.js';
import terminologyAsset from '../data/cascade-terminology.json' with { type: 'json' };

/** A coded concept entry in the asset (a {@link CodeRef} plus an optional label). */
export interface ConceptCode {
  system: CodeSystem;
  code: string;
  display?: string;
}

/** The on-disk asset shape (`cascade-terminology.json`). */
export interface TerminologyAsset {
  version: string;
  description?: string;
  status?: string;
  note?: string;
  /** Lowercased brand/surface form -> canonical generic NAME. */
  brandToGeneric: Record<string, string>;
  /** Lowercased lay/clinical surface form -> coded concept(s). */
  concepts: Record<string, ConceptCode[]>;
}

/**
 * The injectable resolver. A narrow contract so consumers depend on the
 * capability, not the asset: `normalizeMedName` only needs {@link toGeneric},
 * the grounder only needs {@link toCodes}.
 */
export interface TerminologyResolver {
  /** Asset version this resolver was built from (`"identity"` for the no-op). */
  readonly version: string;
  /**
   * Canonical generic name for a brand/surface form, else undefined.
   * `"Zyrtec"` -> `"cetirizine"`; an already-generic name -> undefined.
   * Case-insensitive; trims surrounding whitespace.
   */
  toGeneric(surfaceForm: string): string | undefined;
  /**
   * Coded concept(s) for a surface form (lay or clinical), else `[]`.
   * `"your sugar"`'s caller would pass `"sugar"` -> `[{system:'loinc',value:'2339-0'}]`.
   * Case-insensitive; trims surrounding whitespace.
   */
  toCodes(surfaceForm: string): CodeRef[];
}

function key(surfaceForm: string): string {
  return surfaceForm.toLowerCase().trim();
}

/**
 * Build a resolver over a terminology asset. The asset is read at construction;
 * lookups are pure O(1).
 */
export function createTerminologyResolver(asset: TerminologyAsset): TerminologyResolver {
  const brand = asset.brandToGeneric ?? {};
  const concepts = asset.concepts ?? {};
  return {
    version: asset.version,
    toGeneric(surfaceForm: string): string | undefined {
      return brand[key(surfaceForm)];
    },
    toCodes(surfaceForm: string): CodeRef[] {
      const entries = concepts[key(surfaceForm)];
      return entries ? entries.map((c) => ({ system: c.system, value: c.code })) : [];
    },
  };
}

/**
 * The no-op resolver: every lookup misses. Injecting this is identical to
 * injecting nothing, so the matcher/grounder behave exactly as they do without
 * the asset. Use it as the default so behaviour is asset-free by construction.
 */
export const identityTerminologyResolver: TerminologyResolver = {
  version: 'identity',
  toGeneric: () => undefined,
  toCodes: () => [],
};

/** Version string of the bundled Cascade terminology asset. */
export const CASCADE_TERMINOLOGY_VERSION: string = (terminologyAsset as TerminologyAsset).version;

let bundled: TerminologyResolver | undefined;

/**
 * A resolver over the terminology asset bundled with this SDK. Memoized. This is
 * the asset both the reconciler and the grounder use in production; tests can
 * pass {@link identityTerminologyResolver} or a hand-built asset instead.
 */
export function cascadeTerminologyResolver(): TerminologyResolver {
  if (!bundled) bundled = createTerminologyResolver(terminologyAsset as TerminologyAsset);
  return bundled;
}
