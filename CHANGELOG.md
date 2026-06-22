# Changelog

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
