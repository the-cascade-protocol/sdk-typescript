# Changelog

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
