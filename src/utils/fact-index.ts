/**
 * Shared, code-keyed Pod fact index (master-plan slice-4 convergence).
 *
 * One index, two consumers, the SAME keys:
 *   - the reconciler asks "which existing records might this new record be a
 *     duplicate of?" — `candidates(fact)` returns the same-code / same-name
 *     records to compare, instead of scanning the whole Pod;
 *   - the grounder asks "which records are about this concept?" —
 *     `lookup({ system, value })` (once an entity-linker resolves a claim to a
 *     code) or `lookup({ normalizedName })` returns exactly those facts, instead
 *     of loading and prompting the whole Pod.
 *
 * KEYED ON CODE + NORMALIZED NAME, deliberately NOT startDate. Identity (when is
 * a record THE SAME, for a stable IRI — see `medicationUri`) and retrieval (how
 * do I FIND a concept's records) are distinct jobs: startDate belongs in the
 * former and would fragment the latter. A fact is therefore findable by ANY code
 * it carries (RxNorm/SNOMED/NDC/ATC/LOINC/ICD-10/CVX) and by its normalized
 * name. See the convergent-core substrate plan's resolved decisions.
 *
 * This module is contract-first: the {@link FactIndex} interface is the
 * load-bearing deliverable that both consumers build against. {@link
 * InMemoryFactIndex} is a deterministic reference implementation (no I/O, no
 * persistence); a persistent on-Pod index is a later refinement that must honor
 * the same interface and keys.
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

import { type CodeSystem, codeRefsFromUris } from './code-keys.js';

/** A fact as the index sees it: its id/type plus the keys it is indexed under. */
export interface IndexableFact {
  /** Stable record IRI. */
  id: string;
  /** Coarse record type (e.g. `clinical:Medication`), for callers that filter. */
  type?: string;
  /**
   * Every code URI the record carries (`clinical:rxNormCode`, the repeated
   * `clinical:drugCode[]`, `health:snomedCode`, `clinical:loincCode`, …).
   * Recognized systems are indexed; unrecognized URIs are ignored.
   */
  codeUris?: string[];
  /**
   * The match-normalized name (drug name via `normalizeMedName`, etc.). Indexed
   * as the name-tier retrieval key for records without a usable code.
   */
  normalizedName?: string;
}

/** A retrieval key: a coded concept, or a normalized name. */
export type FactQuery =
  | { system: CodeSystem; value: string }
  | { normalizedName: string };

/**
 * The shared retrieval contract. An implementation indexes each fact under every
 * code it carries and its normalized name, and answers lookups by those keys.
 * Deterministic: the same facts added in any order yield the same lookup sets
 * (implementations should return ids in insertion order for stability).
 */
export interface FactIndex {
  /** Register a fact under every recognized code it carries and its name. */
  add(fact: IndexableFact): void;
  /** Register many facts. */
  addAll(facts: Iterable<IndexableFact>): void;
  /** Fact ids matching a coded concept or a normalized name (empty if none). */
  lookup(query: FactQuery): string[];
  /**
   * Candidate fact ids that share any key with `fact` (its codes or its name),
   * excluding `fact.id` itself. This is the reconciler's match pre-filter: the
   * small set worth a full pairwise comparison, not the whole Pod.
   */
  candidates(fact: IndexableFact): string[];
  /** Number of distinct facts registered. */
  readonly size: number;
}

/** Key string for the by-code map. */
function codeKey(system: CodeSystem, value: string): string {
  return `${system}:${value}`;
}

/**
 * Deterministic, in-memory reference {@link FactIndex}. Insertion order is
 * preserved within each key bucket, so lookups are stable. A persistent on-Pod
 * index (slice-4 refinement) implements the same interface and keys.
 */
export class InMemoryFactIndex implements FactIndex {
  private readonly byCode = new Map<string, string[]>();
  private readonly byName = new Map<string, string[]>();
  private readonly ids = new Set<string>();

  get size(): number {
    return this.ids.size;
  }

  add(fact: IndexableFact): void {
    if (this.ids.has(fact.id)) return; // idempotent per id
    this.ids.add(fact.id);
    for (const { system, value } of codeRefsFromUris(fact.codeUris ?? [])) {
      pushUnique(this.byCode, codeKey(system, value), fact.id);
    }
    if (fact.normalizedName) {
      pushUnique(this.byName, fact.normalizedName, fact.id);
    }
  }

  addAll(facts: Iterable<IndexableFact>): void {
    for (const f of facts) this.add(f);
  }

  lookup(query: FactQuery): string[] {
    if ('system' in query) {
      return [...(this.byCode.get(codeKey(query.system, query.value)) ?? [])];
    }
    return [...(this.byName.get(query.normalizedName) ?? [])];
  }

  candidates(fact: IndexableFact): string[] {
    const out = new Set<string>();
    for (const { system, value } of codeRefsFromUris(fact.codeUris ?? [])) {
      for (const id of this.byCode.get(codeKey(system, value)) ?? []) out.add(id);
    }
    if (fact.normalizedName) {
      for (const id of this.byName.get(fact.normalizedName) ?? []) out.add(id);
    }
    out.delete(fact.id);
    return [...out];
  }
}

function pushUnique(map: Map<string, string[]>, key: string, id: string): void {
  const bucket = map.get(key);
  if (bucket) {
    if (!bucket.includes(id)) bucket.push(id);
  } else {
    map.set(key, [id]);
  }
}
