/**
 * clinical v1.20: clinical:narrativeText and clinical:documentType.
 *
 * clinical:narrativeText was already declared in an earlier clinical release
 * (the canonical spelling for FHIR Narrative.text.div / C-CDA section text
 * with markup stripped) but was never registered as a predicate in this SDK;
 * v1.20 restates its comment without changing the term. clinical:documentType
 * is new in v1.20: the human-readable document-type label (FHIR
 * DocumentReference.type.text, e.g. "Progress Note"). Both are PREDICATES
 * ONLY, in the same position as the clinical v1.16 document terms
 * (documentReferenceStatus / documentAuthorName / authenticatorName): this SDK
 * models no clinical:ClinicalDocument class, so there is nothing to attach
 * them to. Registering them still makes them round-trip on whatever subject a
 * caller writes them to; leaving them out would drop them silently.
 *
 * clinical:documentType is NOT a second spelling of cascade:documentType.
 * cascade:documentType is a separate, pre-existing core predicate: a closed,
 * short set of lowercase slugs (summarization, progress-note,
 * discharge-summary) that software branches on. clinical:documentType is
 * open-ended text for a person to read. The two are different predicates with
 * different value spaces and neither is registered in terms of the other.
 */

import { describe, it, expect } from 'vitest';

import { serialize } from '../src/serializer/turtle-serializer.js';
import { deserialize } from '../src/deserializer/turtle-parser.js';
import { PROPERTY_PREDICATES } from '../src/vocabularies/namespaces.js';
import type { CascadeRecord } from '../src/models/common.js';

describe('clinical v1.20 narrative and document-type terms', () => {
  it('registers narrativeText under the exact ontology spelling', () => {
    expect(PROPERTY_PREDICATES['narrativeText']).toBe('clinical:narrativeText');
  });

  it('registers documentType under the exact ontology spelling', () => {
    expect(PROPERTY_PREDICATES['documentType']).toBe('clinical:documentType');
  });

  it('round-trips both on a record that carries them', () => {
    const doc = {
      id: 'urn:uuid:66666666-6666-4666-8666-666666666666',
      type: 'Encounter',
      encounterType: 'Progress note filing',
      narrativeText: 'Patient reports improved symptom control since last visit.',
      documentType: 'Progress Note',
      dataProvenance: 'ClinicalGenerated',
      schemaVersion: '1.3',
    } as unknown as CascadeRecord;

    const turtle = serialize(doc);
    expect(turtle).toContain(
      'clinical:narrativeText "Patient reports improved symptom control since last visit."',
    );
    expect(turtle).toContain('clinical:documentType "Progress Note"');

    const back = deserialize<Record<string, unknown>>(turtle, 'Encounter')[0] as
      | Record<string, unknown>
      | undefined;
    expect(back?.['narrativeText']).toBe(
      'Patient reports improved symptom control since last visit.',
    );
    expect(back?.['documentType']).toBe('Progress Note');
  });

  it('does not share a predicate with cascade:documentType', () => {
    // cascade:documentType is a separate, closed-slug predicate. It is not
    // registered under this SDK's `documentType` JSON key (that key resolves
    // to clinical:documentType), so a caller cannot accidentally write it via
    // the same field: the two never collide on one Turtle line.
    expect(PROPERTY_PREDICATES['documentType']).toBe('clinical:documentType');
    expect(PROPERTY_PREDICATES['documentType']).not.toBe('cascade:documentType');

    const doc = {
      id: 'urn:uuid:77777777-7777-4777-8777-777777777777',
      type: 'Encounter',
      encounterType: 'Progress note filing',
      documentType: 'Progress Note',
      dataProvenance: 'ClinicalGenerated',
      schemaVersion: '1.3',
    } as unknown as CascadeRecord;

    const turtle = serialize(doc);
    expect(turtle).toContain('clinical:documentType "Progress Note"');
    expect(turtle).not.toContain('cascade:documentType');
  });
});
