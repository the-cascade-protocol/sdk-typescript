# Changelog

## [Unreleased]

### Added

- `canonicalFieldValue` is exported from the package entry point beside `compareCodePoints`, so a consumer can obtain the canonical form of a multi-valued field, not only the comparator that orders it.

## [4.0.0]

Two breaking changes ship together in this major, both about what the published
package requires of its host and what it guarantees about an identifier.

**Breaking 1 — `engines.node` is now `>=20.0.0`** (was `>=18.0.0`). Node 18 is
end-of-life, and the identity function needs the Web Crypto global that Node
gained in 19. Nothing about the published API changes with it.

**Breaking 2 — identity keys and set-valued field members are now ordered by
Unicode CODE POINT, not by UTF-16 code unit.** core v3.6 states the rule
normatively on `cascade:cascadeUri`: "Sort ascending by Unicode code point.
(Code point, not locale collation: a locale-dependent order would make identity
depend on the machine.)" This SDK sorted with `<`/`>` and a bare `.sort()`, both
of which compare UTF-16 code units. The two orders are identical across the
whole Basic Multilingual Plane and disagree on exactly one shape of input: an
astral-plane character (a surrogate pair, leading unit U+D800..U+DBFF) compared
with a BMP character at or above U+E000, where the surrogate makes the astral
character sort first even though its code point is higher.

Every JavaScript implementation shared that behaviour, so no identifier split
BETWEEN them — but none agreed with the spec, and an implementation whose native
string order is by code point (Python's, Swift's) would disagree with all of
them on the same record. The conformance corpus measures it at both sort sites,
`keyOrderVectors/key-order-astral-vs-bmp` and
`multiValuedFieldVectors/condition-member-order-astral-vs-bmp`; both failed here
before this release and pass after it.

**Which URIs move.** Only an identifier that sorted an astral-plane character
against a BMP character at or above U+E000 — at either sort site. Everything
else is bit-identical, because the two orders agree there by construction.
Measured rather than asserted: `scripts/dump-identity-uris.mjs` mints every
deterministic URI over the shared conformance fixture corpus (60,152 URIs across
166 fixture files — the full field set, the field set reversed, every single
field, and every unordered pair, so each key is compared from both sides) before
and after the change. Seven rows move, all seven inside
`deterministic-ids/test-vectors.json` and all seven the astral vectors
themselves. Across the other 165 fixtures: 59,507 URIs, zero differences. Seven
further rows in that corpus are the documented random third tier — the fallback
taken when a record has no content field and no `fallbackId` — and the dump
records them as such rather than as a value, since they differ between two runs
of unchanged code as well.

### Added (code-point comparator)

- **`compareCodePoints(a, b)`**, exported from the package barrel. The identity
  comparator, written out because JavaScript has no built-in that orders by code
  point: `localeCompare` asks ICU for the reader's alphabet, and `<` / a bare
  `.sort()` order UTF-16 code units. Its header states both failure modes and
  the exact input on which the second one bites. Exported so a consumer
  assembling its own identity string sorts the way this SDK does.
- **`scripts/dump-identity-uris.mjs`**, the corpus-wide URI dump described
  above, so "no URI moves" is a claim a reviewer can re-run rather than take.
- Direct tests for the comparator (the divergence, agreement with the built-in
  across a BMP sample, non-collation, totality, prefix ordering, and that BOTH
  sort sites use it), plus a guard that the identity module never reintroduces
  `localeCompare` or a bare `.sort()` outside prose.
- `tests/deterministic-uri.ts` now iterates the conformance `keyOrderVectors`
  array, which it did not read before, and asserts that both astral vectors are
  present by label so a fixture checkout that had lost them cannot read as a
  green run that tested nothing.

### Changed (code-point comparator)

- **`contentHashedUri` sorts identity keys with `compareCodePoints`** instead of
  `(a < b ? -1 : a > b ? 1 : 0)`.
- **`canonicalFieldValue` sorts set members with `compareCodePoints`** instead
  of a bare `.sort()`. This site was the latent half: it had no vector before
  this release, so a fix reaching only the key comparator would have passed
  every key-order vector while still minting a divergent identifier for a record
  whose field held an astral member.

### Browser safety, and the vendored SHA-1

Also part of this release, and where the Node 20 floor above comes from: the
published package now loads and runs in a browser, and CI proves it on every
pull request.

**No URI moves from this half.** Identity output is bit-identical across the
digest swap. The deterministic URI for every conformance fixture input was
computed before and after and compared: 8,533 deterministic URIs, zero
differences. The only values that differ between runs are the ones
`contentHashedUri` documents as random — the fallback taken when a record has no
content fields and no `fallbackId` — and those differ between two runs of
unchanged code as well.

#### Added (browser safety)

- **Browser-safety gate.** `npm run check:browser` bundles the public entry point
  with esbuild for a browser target and fails on an unresolved `node:` builtin or
  a Node-only construct surviving into the output. A `browser-bundle` CI job runs
  it, then executes `serialize`, `deserialize`, `deserializeOne`, `validate`,
  `toJsonLd` and `fromJsonLd` through the bundled artefact — building and working
  being two different claims.
- **`src/vendor/sha1.ts`** — SHA-1 written from FIPS PUB 180-4, original work
  under this package's own licence, with no third-party notice obligation and no
  runtime dependency. Tested against the four published FIPS vectors, the
  padding block boundaries, and Node's `createHash` over 1,000 random strings
  spanning all four UTF-8 encoding widths including astral-plane characters.

#### Changed (browser safety)

- **`src/utils/deterministic-uri.ts` no longer imports `node:crypto`.** It sat on
  the package barrel, so that single import made the entire SDK unloadable in any
  browser bundle. `createHash('sha1')` becomes the vendored implementation and
  `randomUUID()` becomes `globalThis.crypto.randomUUID()`.

  The algorithm is unchanged and deliberately so: SHA-1 is named in the cross-SDK
  CDP-UUID rule, so a different digest would move every URI every pod already
  holds. `crypto.subtle` was not the answer either — it is async-only, and this
  function is called from synchronous record construction throughout the SDK and
  its consumers. A synchronous, universal SHA-1 is what both constraints leave.

  There is deliberately no dynamic-import fallback for `randomUUID`: a
  conditional `import()` of a builtin is opaque to a bundler's static analysis
  and would defeat the gate above.

- CI's Node matrix floor moves from 18.x to 20.x, tracking `engines`.

## [3.1.0] - 2026-08-28

Vocabulary sync: core 3.6 to 3.7, health 2.7 to 2.8, clinical 1.15 to 1.16,
coverage 1.4 to 1.5. 24 new terms.

**Minor, not major: purely additive.** No published type narrows, no record type
changes what it serializes to, and every graph this SDK wrote before still reads
back identically.

Every term here comes from a field-coverage measurement against real FHIR R4
exports: each one is an element a conformant server sends that the vocabulary
had nowhere to put, so an importer dropped it.

### Added

Clinical v1.16 — encounters:
- `encounterClassDisplay` and `encounterClassSystem`, the other two parts of the
  `Encounter.class` Coding. The code stays in `encounterClass` for round-trip;
  because the binding is only extensible, a local code such as `"5"` is
  unreadable without its display and unmappable without its system.
  `encounterClassSystem` is written as a plain string literal — the ontology
  ranges it `xsd:anyURI`, and the shape accepts `anyURI` OR `string` via `sh:or`
  precisely because serializers differ on which they write.
- `encounterReason` (0..*), `admitSource` and `dischargeDisposition`. None
  carries a value set: FHIR binds `reasonCode` and `admitSource` only PREFERRED
  and `dischargeDisposition` only EXAMPLE. The presence of `admitSource` is the
  structured signal separating an admission from an office visit, which was
  unrecoverable from a pod through v1.15.
- `EncounterParticipant` and `hasParticipant` (0..*), with `participantName`,
  `participantRole`, `participantRoleCode` (0..*) and `participantSpecialty`.
  Each participation serializes as an INLINE BLANK NODE, following the core
  v3.4 `clinicalSummary` / `wellnessSummary` precedent;
  `clinical:EncounterParticipantShape` omits `sh:nodeKind sh:IRI` so a
  serializer may write one for a structural sub-node. A visit routinely carries
  several participants in the same role, which the rejected flat
  role-qualified-predicate design could not represent at all.

Clinical v1.16 — identity and documents:
- `businessIdentifier` (0..*), typed on `CascadeEntity` because the ontology
  deliberately declares no `rdfs:domain`. Values are the FHIR token form
  `"{system}|{value}"` where the source states a system; this SDK round-trips
  the string verbatim and never splits, parses or invents one. Distinct from
  `sourceRecordId`, which holds the server-assigned logical id: the two id
  spaces do not join.
- `documentReferenceStatus`, `documentAuthorName` (0..*) and
  `authenticatorName`, registered as PREDICATES ONLY — their domain is
  `clinical:ClinicalDocument`, a class this SDK does not model, the same
  position the core v3.4 device-source terms are in. `DocumentReferenceStatus`
  is exported as a type.

Core v3.7 — pod attachments:
- `Attachment` model and the seven properties `hasAttachment` (0..*),
  `attachmentPath`, `attachmentMediaType`, `contentHash`, `hashAlgorithm`,
  `byteSize` and `attachmentTitle`.
- **An attachment is a subject with its own IRI, not a sub-node.**
  `cascade:HasAttachmentEdgeShape` declares `sh:nodeKind sh:IRI` so a record and
  its attachment can live in different files, so `hasAttachment` is an IRI edge.
  This is the one point on which core v3.7 and clinical v1.16 rule oppositely.
- This SDK models the metadata node only: it neither reads, writes, hashes nor
  verifies attachment bytes.

Coverage v1.5:
- `coverage:status` and the `CoverageStatus` type, closed to the four
  `fm-status` codes because the FHIR binding is REQUIRED and the shape
  constrains the value at `sh:Violation`. Written via a record-type override
  because the `status` key already resolves to `health:status`, and declared for
  `InsurancePlan` only — `coverage:status` has `rdfs:domain
  coverage:InsurancePlan`.

Health v2.8:
- SHACL only; no term for this SDK to model. The row moves because the version
  moved.

Core v3.8:
- `PatientReported` added to `ProvenanceType` and to the validator's
  `VALID_PROVENANCE_TYPES`. The second is the one that mattered: a value absent
  from that set is rejected at runtime, so bumping the row alone would have left
  this SDK failing a conformant record. No term modelled in this release
  changes.
- `PatientReported` is distinct from the existing `SelfReported` on the axis of
  who keyed the data in, not who it came from: `SelfReported` is the patient
  entering data directly, `PatientReported` is their own account recorded by
  another party or system (history related to a clinician, imported
  questionnaire responses). It is a direct subclass of `cascade:DataProvenance`
  under neither `ClinicalGenerated` nor `ConsumerGenerated`, since a patient's
  report reaches records through either setting.

### Fixed

- Blank-node labels are minted from a monotonic counter instead of
  `Date.now()` plus four random base-36 characters. The old scheme collides for
  two nodes created in the same millisecond, which was survivable when the only
  inline blank nodes were one summary per manifest, and is not now that an
  encounter carries several participations at once: a collision merged two
  participations, attributing one clinician's role to another's name.

### Known gaps

- `TYPE_MAPPING` resolves both `InsurancePlan` and `CoverageRecord` to
  `clinical:CoverageRecord`, so this SDK still cannot emit a
  `coverage:InsurancePlan` subject and coverage's own shapes never see these
  records. `coverage:status` is therefore a one-way trip: the class is lost on
  read, so re-serializing what came back writes `health:status`. Pinned by test
  rather than fixed, because retargeting the class is a migration.
- No conformance fixture exercises any of these 24 terms, so cross-implementation
  agreement with `sdk-python` and `cascade-cli` is unverified.

## [3.0.0] - 2026-08-15

Vocabulary sync: core 3.5 to 3.6, health 2.6 to 2.7, clinical 1.14 to 1.15.

**Major because one published type narrows and one record type changes what it
serializes to.** `VitalSign.interpretation` no longer accepts an arbitrary
string, and procedure records move to a different RDF class and name predicate.

### Changed (BREAKING)

- `VitalSign.interpretation` is now `VitalInterpretation`, not
  `VitalInterpretation | string`. The union was justified by
  `clinical:VitalSignShape` carrying no `sh:in`, which clinical v1.15 changes,
  and in the meantime TypeScript collapsed `VitalInterpretation | string` to
  `string`, so the type documented nothing and accepted anything. A source code
  in neither ratified value set goes verbatim on the new
  `interpretationSourceCode` with the nearest ratified reading on
  `interpretation`; that pairing is what makes narrowing lossless.
- Procedure records serialize as `clinical:Procedure` with
  `clinical:procedureName`, not `health:ProcedureRecord` with
  `health:procedureName`. No vocabulary has ever defined either health: spelling
  and no shape targeted them, so procedure records this SDK wrote ran against
  zero constraints. A consumer querying the old spellings must be updated.

### Added

Core v3.6:
- `cascade:dataAbsentReason`, registered and in the generated JSON-LD context.
  Why a record's primary VALUE is absent, with semantics that are exactly FHIR
  R4 `Observation.dataAbsentReason`. It was previously dropped on the floor by
  the serializer.
- `cascade:sourceSystem`, registered and in the generated context. It has been
  in the published context since core v3.0 and was never registered here, so
  the INGESTION axis could not round-trip while ORIGIN could.

Health v2.7 and clinical v1.15:
- `interpretationSourceCode`, registered in both spellings and typed on
  `VitalSign`. A lab writes the `health:` spelling and a vital the `clinical:`
  one, so the verbatim code always sits beside the interpretation it explains.
- `LAB_INTERPRETATION_VALUES` goes from 60 to 74 values, adding the 14
  data-absent-reason codes it lacked. `LAB_INTERPRETATION_CHECKSUM` re-pinned to
  `1ae24bf8ceccfa2a71d870bae21dc91cc7f906d736496ec23ca78b4181ba05b0`, shown
  failing against the previous digest before re-pinning.
- `healthProcedureName` registered, so a name carried only on the deprecated
  spelling survives serialization. It was silently dropped before, and a
  procedure record could serialize with no name at all.
- `tsconfig.typecheck.json` and an `npm run typecheck` script, wired into CI.
  `tsconfig.json` excludes test files and vitest does not typecheck, so a
  type-level assertion in a test was previously invisible to both `npm test` and
  `npm run build`. Widening `VitalSign.interpretation` back leaves all 604 tests
  passing and is caught only by this step, which is precisely why it exists.

### Cross-SDK note

The two SDKs disagreed about vital interpretation in opposite directions: this
one accepted any string, the Python SDK rejected anything outside the set. The
ratified shapes settle it as a severity split, and both SDKs implement that same
split in this round. `clinical:VitalSignShape` binds the value set at
`sh:Warning`, so an out-of-set value on a vital is REPORTED and the record stays
valid; the lab shapes bind it at `sh:Violation`. This SDK does not validate, so
it carries the stance in its types: the 74-value set is what a producer should
write, and `interpretationSourceCode` is where anything else goes.

## [2.0.0] - 2026-08-10

Vocabulary sync: core 3.4 → 3.5, health 2.5 → 2.6, clinical 1.13 → 1.14,
coverage 1.3 → 1.4, checkup 3.2 → 3.3.

**This is a major release because two published types change shape.** Neither
change can be made compatibly: `LabInterpretation` loses a member it should
never have had, and four code properties become 0..*. Reader code that assigns
either to a plain `string` no longer typechecks. Nothing changes at runtime for
data already written (every record that serialized before serializes
byte-identically now), so the migration is a type-level one. See "Migrating"
below.

### Changed (breaking)

- **`LabInterpretation` is now the ratified value set, derived from a runtime
  array.** `LAB_INTERPRETATION_VALUES` carries the 49 selectable codes of HL7 v3
  ObservationInterpretation 3.0.0 (`http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation`,
  the code system FHIR R4 binds `Observation.interpretation` to) in the code
  system's own order, plus the data-absent-reason code `"unknown"` and the ten
  retained legacy words: 60 values. The type is `typeof LAB_INTERPRETATION_VALUES[number]`,
  so the type and the runtime list cannot drift apart. The previous five-member
  union could not express a susceptibility (`S`/`I`/`R`), detection
  (`POS`/`NEG`/`DET`/`ND`/`IND`), reactivity (`RR`/`WR`/`NR`) or change
  (`B`/`D`/`U`/`W`) result, all of which are conformant FHIR that laboratories
  report routinely.
  - **`'elevated'` is gone.** It was a member of this union through 1.6.1 and was
    never accepted by any version of the SHACL shapes, so any record written with
    it has been failing validation all along. `'high'`, accepted by every version
    of the shapes, was missing from the union and is now present.
  - The list is pinned by a SHA-256 (`LAB_INTERPRETATION_CHECKSUM`) that
    `tests/interpretation-codes.test.ts` recomputes from the array and compares
    against a literal. A test that read the shape file was rejected deliberately:
    this package's CI checks out no `spec` sibling, so such a test would either
    fail on every clean machine or skip itself, and a test that skips when it
    cannot find its input reports green while proving nothing.
- **`labCategory`, `testCode`, `icd10Code` and `snomedCode` are 0..\*.** FHIR R4
  `Observation.category` is 0..* and `CodeableConcept.coding` is 0..*, and
  dual-coded problem-list entries and multi-coding lab observations are ordinary
  EHR output; a record that preserved every coding its source sent was being
  rejected for preserving it. The fields are typed `MultiValue<string>`, a new
  exported alias for `T | T[]`.
  - **Arity is preserved on both sides.** One value in produces one triple and
    reads back as a bare string; N values in produce N repeated-predicate triples
    and read back as an N-element array. This keeps every existing single-coded
    record round-tripping to exactly what it round-tripped to before, and it
    avoids reporting structure the graph does not carry. RDF has no "list of one"
    for a repeated predicate. `asArray()` is exported for callers that want one
    shape to iterate over.
  - Applied uniformly by field name, so `Condition`, `LabResult`, `VitalSign`,
    `Procedure`, `Encounter` and `MedicationAdministration` all move together.
    The serializer resolves the namespace per record type (a `VitalSign` writes
    `clinical:snomedCode`, a `Condition` writes `health:snomedCode`) but decides
    cardinality before it has any type context, and no shape still caps any of
    the four at one.
  - Emitted as repeated predicates, never an `rdf:List`: the vocabulary declares
    no order over codings and the shapes count triples.
- **`VitalInterpretation` is an alias of `LabInterpretation`**, and
  `VitalSign.interpretation` is typed `VitalInterpretation | string`.
  `clinical:VitalSignShape` puts no `sh:in` on the property, so the union
  documents the ratified codes without rejecting a value the validator accepts,
  the same idiom this SDK already uses for `vitalType`, `planType` and
  `coverageType`. Existing `VitalSign` code, including `'elevated'`, still
  compiles.
- **`SubscriberRelationship` is the full HL7 SubscriberPolicyholder code set**
  (`child`, `parent`, `spouse`, `common`, `other`, `self`, `injured`), which is
  what FHIR R4 binds `Coverage.relationship` to. Coverage v1.4 added `common` and
  `injured`; `parent` had been missing here since the type was introduced. A
  widening: the fields that use it are already `| string`.

### Added

- **`cascade:sourceIdentity` (core v3.5), the ORIGIN axis.** A canonical,
  transport-independent identity for the organization a record came from, so a
  FHIR export and a C-CDA document of the same health system agree. Registered as
  a predicate, carried in the generated JSON-LD context as a plain term, and
  typed on `CascadeEntity` because its `rdfs:domain` is `owl:Thing`. Values are
  scheme-prefixed `org:{slug}` / `ns:{namespace}` / `transport:{label}`. The
  accessor is a plain optional string: this SDK stores and round-trips the value
  and deliberately does not validate or derive the scheme, because minting a slug
  requires the source document that only an importer has, and rejecting an
  unrecognized value here would discard origin information a producer was
  entitled to write.
- `MultiValue<T>` and `asArray()` exports.
- `LAB_INTERPRETATION_VALUES`, `LAB_INTERPRETATION_CHECKSUM` and
  `OBSERVATION_INTERPRETATION_CODE_COUNT` exports.

### Fixed

- An empty code array now counts as no coding rather than as a coding, so
  `testCode: []` no longer suppresses the missing-coding warning on a record that
  carries no code.
- The Turtle serializer declares a namespace prefix for every member of a
  multi-valued code property, not only the first, so two codings from two code
  systems are both declared.

### Migrating from 1.6.x

- Replace `'elevated'` with a code the shapes accept. For a lab result that is
  `'H'` (or `'HH'` for a critically high value); the retained word `'high'` is
  also accepted but is not recommended for new writes.
- Reading one of the four code properties now yields `string | string[]`. Wrap
  the read in `asArray()`, for example `for (const code of asArray(condition.icd10Code))`,
  or narrow with `Array.isArray`. Writing is unchanged: a bare string still
  compiles and still produces one triple.
- Nothing needs to be rewritten on disk. Existing Turtle parses to the same
  values it parsed to before.

## [1.6.1] - 2026-08-04

No functional change. This release exists to exercise the tag-driven publishing
workflow end to end, since 1.6.0 was published manually before that workflow
existed and a tag for it would be rejected as a duplicate.

The published artifact is byte-equivalent in behaviour to 1.6.0; the only
difference is how it got to npm. From this release on, publishing is triggered
by pushing a `v*` tag and authenticated with OIDC, so no long-lived npm token
exists for this package and every release carries a provenance attestation.

## [1.6.0] - 2026-08-04

Vocabulary sync: core 3.3 → 3.4, health 2.4 → 2.5, clinical 1.9 → 1.13.

### Added
- **Pod export manifest (core v3.4).** `ExportManifest`, `RecordSummary` and `InteractionScenario` models, type mappings, and all 26 uncontested `cascade:` properties. `ExportManifest` is modelled on `dcat:Dataset` (its descriptive fields are Dublin Core terms, not Cascade inventions) and `RecordSummary` on `void:Dataset`, whose per-domain counts are `void:entities` subproperties in the ontology; `dcat` and `void` are now registered namespaces. An inline `cascade:RecordSummary` blank node is reconstructed on read rather than reported as a blank-node identifier.
- **Single-day wellness snapshots (health v2.5).** `DailyActivitySnapshot` and `DailySleepSnapshot` models with `activeEnergyKcal`, `exerciseMinutes`, `standHours` and `durationHours`. These are distinct from the 7-day aggregate `ActivitySnapshot` / `SleepSnapshot`; both forms are emitted and neither replaces the other.
- **Sleep quality individuals (health v2.5).** `SleepQuality` type and `SLEEP_QUALITY_VALUES`. `health:sleepQuality` is written and parsed as an IRI (`health:Good`), which is what emitters produce and what the shape's `sh:in` ranges over.
- **Wellness container classes (health v2.5).** `WELLNESS_CONTAINER_SUBCLASSES` and `isHealthProfileType()`, encoding the six containers' `rdfs:subClassOf health:HealthProfile` declarations. Use the helper rather than an equality check: a subject typed `health:SleepData` is a health profile.
- **Traversable graph edges (clinical v1.10–v1.12).** `hasEncounter`, `indicationReference`, `parsedIndicationReference` and `linkedCondition`, all IRI-valued. `indicationReference` is available on `Procedure` and `MedicationAdministration` as well as `Medication`, matching the domain widened in v1.11. `parsedIndicationReference` stays a separate field so a derived match can be presented differently from a stated one.
- `CascadeEntity`, the base for Cascade subjects that are not `cascade:HealthRecord` subclasses and therefore carry no required provenance. `CascadeRecord` extends it and still requires `dataProvenance` and `schemaVersion`.
- `SubjectBuilder.uriList()` (an `rdf:List` of IRIs) and `SubjectBuilder.decimal()` (a plain decimal literal).

### Changed
- **Readers accept the four classes deprecated in clinical v1.13; writers never emit them.** `clinical:LabResult`, `clinical:Condition`, `clinical:Allergy` and `clinical:Immunization` were deprecated, not removed, and existing pods contain them, so `deserialize()` accepts both spellings (including the unambiguous `clinical:` spellings of their properties) while `TYPE_MAPPING` carries no entry that could produce one.
- The deprecated `clinical:linkedConditionIds` literal is still read, so links written before v1.10 are not lost.
- Generic serialization emits decimals plain (`7.4`) rather than `"7.4"^^xsd:double`, matching every conformance fixture. RDF 1.1 already types a bare `7.4` as `xsd:decimal`. `SubjectBuilder.double()` is unchanged for callers that want the explicit form.
- `cascade:RecordSummary` counts serialize with their declared `^^xsd:integer` datatype.
- `serialize()`, `validate()`, `validateAll()`, `toJsonLd()`, `fromJsonLd()` and `deserialize()` accept `CascadeEntity` (a widening; every existing call still typechecks).
- VOCAB_VERSIONS updated: core=3.4, health=2.5, clinical=1.13.

### Fixed
- The Turtle parser now accepts `<>`, the empty relative IRI a pod export manifest uses to name itself. Manifests were previously unreadable.
- Multi-line `rdf:List` members are tokenized on any whitespace, not the space character alone, which had captured the trailing newline into each member.

## [1.5.0] - 2026-06-22

### Added
- `SocialHistoryRecord` model (`health:SocialHistoryRecord`) — consumer-reported social history (smoking, alcohol, exercise, occupation). DISTINCT from the EHR-extracted `ClinicalSocialHistoryRecord` (`clinical:SocialHistoryRecord`).
- `AdvisoryApplicationActivity` model (`cascade:AdvisoryApplicationActivity`) — PROV-O activity recording application of a Cascade Advisory Patch; carries `appliedTriplesCount`.
- `AIGenerationActivity` model (`cascade:AIGenerationActivity`) — LLM generation activity (sibling of `AIExtractionActivity`); adds `promptVersion`, `generationTemperature`, `trigger`, and reuses `extractionModel`/`extractionConfidence`/`sourceNarrativeSection`/`requiresUserReview`.
- `GenerationTrigger` type (`InitialGeneration` | `RegenerationAfterReclassification` | `AudienceRetargeting`).
- `ProxyAgent` model (`cascade:ProxyAgent`) — caregiver acting on a patient's behalf; `actsForPatient`, `proxyWebID`, `proxyRelationship`, `proxyScope`, `proxyGrantedAt`, `proxyRevokedAt`.
- `'AIAsserted'` provenance value (`cascade:AIAsserted`, subClassOf `cascade:ConsumerGenerated`) — ungrounded general-AI content; never to be confused with `AIExtracted`.
- PROPERTY_PREDICATES, TYPE_MAPPING, and TYPE_TO_MAPPING_KEY entries for all new classes/properties; JSON-LD context typing for `proxyGrantedAt`/`proxyRevokedAt` (xsd:dateTime), `appliedTriplesCount` (xsd:integer), `generationTemperature` (xsd:decimal).

### Changed
- VOCAB_VERSIONS updated: core=3.3, health=2.4, clinical=1.9 (coverage/checkup/pots unchanged).

## [1.3.0] - 2026-03-27

### Added
- `contentHashedUri(resourceType, contentFields, fallbackId?)` — deterministic content-hashed URI generator using CDP-UUID algorithm
- `deterministicUuid(input)` — CDP-UUID hash function. Cross-SDK: `deterministicUuid("hello") === "aaf4c61d-dcc5-58a2-9abe-de0f3b482cd9"`
- Typed convenience helpers: `patientUri()`, `immunizationUri()`, `observationUri()`, `conditionUri()`, `allergyUri()`, `medicationUri()`
- Cross-SDK conformance test vectors loaded from `conformance/fixtures/deterministic-ids/test-vectors.json`
- 16 new tests

## [1.2.0] - 2026-03-20

### Added
- `MedicationAdministration` model (`clinical:MedicationAdministration`) — single-event medication administration records (IV antibiotics, injections, etc.)
- `ImplantedDevice` model (`clinical:ImplantedDevice`) — permanent implanted medical devices (pacemakers, stents, cochlear implants)
- `ImagingStudy` model (`clinical:ImagingStudy`) — diagnostic imaging metadata (CT, MRI, X-ray, ultrasound) without DICOM payloads
- `ClaimRecord`, `BenefitStatement`, `DenialNotice` type mappings for coverage vocabulary (`coverage:` namespace)
- TYPE_MAPPING and TYPE_TO_MAPPING_KEY entries for all new types and coverage v1.3 classes
- PROPERTY_PREDICATES entries for all new clinical and coverage v1.3 properties
- Core v2.8 FHIR passthrough predicates: `layerPromotionStatus`, `fhirJson`, `sourceRecordDate`

### Changed
- VOCAB_VERSIONS updated: core=2.8, clinical=1.7, coverage=1.3

## 1.1.1 (2026-03-18)

### Added
- `Encounter` data model interface (`encounterType`, `encounterClass`, `encounterStatus`, `encounterStart`, `encounterEnd`, `providerName`, `snomedCode`)
- `Encounter` deserialization support — TYPE_MAPPING entry and predicate mappings for `clinical:*` encounter predicates
- `cptCode` and `procedureStatus` fields on `Procedure` model

### Fixed
- `deserialize(ttl, 'Procedure')` now works — rdfType corrected from `health:ProcedureRecord` to `clinical:Procedure`
- `deserialize(ttl, 'Encounter')` now works — was completely absent from SDK
- `clinical:performedDate`, `clinical:sourceRecordId`, `clinical:status`, `clinical:notes` predicates now map correctly via ADDITIONAL_REVERSE_MAPPINGS
- `Procedure.type` discriminant corrected from `'ProcedureRecord'` to `'Procedure'`

## 1.1.0 (2026-03-12)

### Added
- PodBuilder support for procedures and family-history records
- Shared utilities extracted to vocabularies module

### Fixed
- npm scope corrected to `@the-cascade-protocol`
- Publishing metadata (repository, homepage, bugs, files fields)

## 1.0.0 (2026-02-21)

### Added
- Core data model interfaces for all 13 Cascade Protocol types
- Turtle serializer with TurtleBuilder fluent API
- Turtle deserializer (zero runtime dependencies)
- JSON-LD conversion (toJsonLd/fromJsonLd)
- Vocabulary constants (NAMESPACES, TYPE_MAPPING, PROPERTY_PREDICATES)
- Bundled JSON-LD context with CONTEXT_URI
- Full conformance test suite passing all fixtures
