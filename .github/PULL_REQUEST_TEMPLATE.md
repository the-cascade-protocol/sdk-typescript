## Summary

<!-- What vocabulary classes or properties does this implement? What bug does it fix? -->

**Spec reference:** <!-- e.g., spec vocab/clinical-v1.7, spec vocab/core-v2.8 -->

---

## Checklist

- [ ] Model file(s) added in `src/models/` — interface matches TTL class definition
- [ ] Predicate URIs added to `src/vocabularies/namespaces.ts`
- [ ] Added to TYPE_MAPPING with correct `rdfType`
- [ ] Added to serializer and deserializer
- [ ] Added to JSON-LD context (`src/jsonld/context.ts`)
- [ ] Exported from `src/index.ts`
- [ ] Conformance fixtures pass for new/changed classes
- [ ] `VOCAB_VERSIONS` updated
- [ ] CHANGELOG.md updated
- [ ] `package.json` version bumped appropriately
