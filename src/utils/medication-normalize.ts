/**
 * Deterministic medication-field normalization for the Cascade Protocol.
 *
 * These utilities are the single source of truth for how a medication's name,
 * dose, frequency, and route are canonicalized before comparison. Both the
 * cascade-cli reconciler (record-vs-record dedup on import) and the conversation
 * grounder (claim-vs-record matching) MUST normalize through this module so a
 * drug mention in a chat ("your lisinopril") matches a recorded "Lisinopril 10
 * mg" identically to how two records match each other.
 *
 * Determinism-first: regex and string-replacement only. No ML, no I/O, no
 * locale-sensitive operations. Identical input always yields identical output.
 *
 * `normalizeMedName` is a behaviour-preserving port of the cascade-cli
 * implementation (`src/lib/reconciler.ts`) so the CLI can swap to this import
 * with no change in matching behaviour. `normalizeDose` / `normalizeFrequency`
 * mirror Cascade Checkup's reconciler rules
 * (`MedicationReconciler.swift` `normalizeDose` / `normalizeFrequency`).
 *
 * @see https://cascadeprotocol.org/docs/cascade-protocol-schemas
 */

// ─── Medication name ─────────────────────────────────────────────────────────

/**
 * Canonicalize a medication name for identity matching.
 *
 * Lowercases, strips embedded dose/unit tokens (`10 mg`, `90 mcg`, `5 %`, `200
 * units`, `40 meq`) and form/route tokens (`oral`, `tablet`, `capsule`, `er`,
 * `xr`, ...), and collapses whitespace. The result is the match-identity form,
 * NOT a display name. Brand-to-generic resolution is deliberately out of scope
 * here; it is layered on by an injectable terminology resolver (S2) so this
 * function stays a pure, deterministic, asset-free baseline.
 *
 * Note: dose tokens are intentionally stripped from the *name* so "Lisinopril
 * 10 mg" and "Lisinopril 20 mg" share an identity. The dose difference is a
 * conflict to surface, compared separately via {@link normalizeDose} — not a
 * reason to treat them as different drugs.
 *
 * @example
 * normalizeMedName('Lisinopril 10 mg Oral Tablet') // => 'lisinopril'
 */
export function normalizeMedName(name: string): string {
  return name.toLowerCase()
    .replace(/\d+(\.\d+)?\s*(mg|mcg|g|ml|%|iu|units?|meq)\b/gi, '')
    .replace(/\b(oral|tablet|capsule|solution|injection|extended|release|er|xr|cr|sr|hr)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
}

// ─── Dose ──────────────────────────────────────────────────────────────────--

/**
 * Canonicalize a dose string for value comparison.
 *
 * Lowercases, removes all whitespace, and folds spelled-out units to their
 * abbreviations (`milligram` -> `mg`, `microgram` -> `mcg`, `gram` -> `g`) plus
 * plural forms (`mgs` -> `mg`, `mcgs` -> `mcg`). Mirrors Checkup's
 * `MedicationReconciler.normalizeDose`. Replacement order is significant and
 * preserved: longer unit words are folded before the bare `gram`.
 *
 * Used to decide whether two matched medications actually disagree on dose
 * ("10 mg" vs "10mg" vs "10 milligrams" all compare equal; "10 mg" vs "20 mg"
 * do not).
 *
 * @example
 * normalizeDose('10 milligrams') // => '10mg'
 * normalizeDose('10mg') === normalizeDose('10 mg') // => true
 */
export function normalizeDose(dose: string): string {
  return dose.toLowerCase()
    .replaceAll(' ', '')
    .replaceAll('milligram', 'mg')
    .replaceAll('microgram', 'mcg')
    .replaceAll('gram', 'g')
    .replaceAll('mgs', 'mg')
    .replaceAll('mcgs', 'mcg');
}

// ─── Frequency ───────────────────────────────────────────────────────────────

/**
 * Canonicalize a dosing frequency to a clinical abbreviation.
 *
 * Lowercases and folds common natural-language frequencies to their Latin
 * abbreviations (`once daily` -> `qd`, `twice daily` -> `bid`, `three times
 * daily` -> `tid`, `four times daily` -> `qid`). Mirrors Checkup's
 * `MedicationReconciler.normalizeFrequency`. Replacement order is significant
 * and preserved: the specific `... daily` phrases are folded before the bare
 * `daily`, so "once daily" yields `qd`, not `once qd`.
 *
 * @example
 * normalizeFrequency('Twice a day') // => 'bid'
 * normalizeFrequency('once daily') === normalizeFrequency('every day') // => true
 */
export function normalizeFrequency(frequency: string): string {
  return frequency.toLowerCase()
    .replaceAll('once daily', 'qd')
    .replaceAll('once a day', 'qd')
    .replaceAll('twice daily', 'bid')
    .replaceAll('twice a day', 'bid')
    .replaceAll('three times daily', 'tid')
    .replaceAll('three times a day', 'tid')
    .replaceAll('four times daily', 'qid')
    .replaceAll('four times a day', 'qid')
    .replaceAll('every day', 'qd')
    .replaceAll('daily', 'qd')
    .trim();
}

// ─── Route ───────────────────────────────────────────────────────────────────

/**
 * Canonical routes of administration this normalizer recognizes. Values follow
 * the lay/EHR surface forms the rest of the pipeline already uses (e.g. `oral`,
 * `inhalation`) rather than coded terms; route is a low-stakes match signal, not
 * an identity key.
 */
const ROUTE_SYNONYMS: Record<string, string> = {
  'oral': 'oral',
  'po': 'oral',
  'by mouth': 'oral',
  'orally': 'oral',
  'inhalation': 'inhalation',
  'inhaled': 'inhalation',
  'inhale': 'inhalation',
  'nebulized': 'inhalation',
  'iv': 'intravenous',
  'intravenous': 'intravenous',
  'im': 'intramuscular',
  'intramuscular': 'intramuscular',
  'subcutaneous': 'subcutaneous',
  'subcut': 'subcutaneous',
  'sc': 'subcutaneous',
  'sq': 'subcutaneous',
  'topical': 'topical',
  'transdermal': 'transdermal',
  'sublingual': 'sublingual',
  'sl': 'sublingual',
  'rectal': 'rectal',
  'pr': 'rectal',
  'nasal': 'nasal',
  'intranasal': 'nasal',
  'ophthalmic': 'ophthalmic',
  'otic': 'otic',
};

/**
 * Canonicalize a route of administration.
 *
 * Lowercases and trims, then maps a known surface form to its canonical route
 * via a fixed synonym table. Unknown routes degrade to the lowercased, trimmed
 * input (identity), so this is safe to apply unconditionally and never invents
 * a value it cannot justify.
 *
 * @example
 * normalizeRoute('PO')        // => 'oral'
 * normalizeRoute('By Mouth')  // => 'oral'
 * normalizeRoute('Inhaled')   // => 'inhalation'
 */
export function normalizeRoute(route: string): string {
  const cleaned = route.toLowerCase().trim();
  return ROUTE_SYNONYMS[cleaned] ?? cleaned;
}
