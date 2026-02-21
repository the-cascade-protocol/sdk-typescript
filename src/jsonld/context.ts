/**
 * Bundled JSON-LD context for offline use with Cascade Protocol data.
 *
 * The context is embedded inline so that no network fetch is required.
 * It maps short property names and type names to their full IRIs in the
 * Cascade Protocol vocabularies.
 *
 * @module jsonld
 */

import { NAMESPACES, PROPERTY_PREDICATES, TYPE_MAPPING } from '../vocabularies/namespaces.js';

/**
 * The canonical URI for the published Cascade Protocol JSON-LD context.
 *
 * Use this when you want to reference the context by URL (e.g., in a
 * JSON-LD document's `@context` field) rather than embedding it inline.
 */
export const CONTEXT_URI = 'https://cascadeprotocol.org/ns/context/v1/cascade.jsonld';

/**
 * Build and return the Cascade Protocol JSON-LD context object.
 *
 * The context includes:
 * - All namespace prefix mappings
 * - Property-to-IRI mappings from PROPERTY_PREDICATES
 * - Type-to-IRI mappings from TYPE_MAPPING
 * - Typed literal annotations for date, boolean, integer, and double fields
 *
 * @returns A JSON-LD context object suitable for use in `@context`
 */
export function getContext(): object {
  const context: Record<string, unknown> = {};

  // Namespace prefixes
  for (const [prefix, uri] of Object.entries(NAMESPACES)) {
    context[prefix] = uri;
  }

  // Add standard RDF namespace
  context['rdf'] = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

  // Type mappings (RDF types as JSON-LD type aliases)
  for (const mapping of Object.values(TYPE_MAPPING)) {
    const colonIdx = mapping.rdfType.indexOf(':');
    if (colonIdx >= 0) {
      const localName = mapping.rdfType.slice(colonIdx + 1);
      context[localName] = mapping.rdfType;
    }
  }

  // Property predicates
  // Fields that need typed @id annotations
  const idTypedFields = new Set([
    'dataProvenance', 'emergencyContact', 'address', 'preferredPharmacy',
  ]);

  // Fields that need xsd:dateTime typing
  const dateTimeFields = new Set([
    'startDate', 'endDate', 'onsetDate', 'performedDate', 'reportedDate',
    'administrationDate', 'effectiveDate', 'effectivePeriodStart', 'effectivePeriodEnd',
    'effectiveStart', 'effectiveEnd',
  ]);

  // Fields that need xsd:date typing
  const dateOnlyFields = new Set(['dateOfBirth', 'date']);

  // Fields that need xsd:boolean typing
  const booleanFields = new Set(['isActive', 'asNeeded']);

  // Fields that need xsd:integer typing
  const integerFields = new Set([
    'computedAge', 'refillsAllowed', 'supplyDurationDays', 'onsetAge',
    'steps', 'activeMinutes', 'calories', 'awakenings',
    'totalSleepMinutes', 'deepSleepMinutes', 'remSleepMinutes', 'lightSleepMinutes',
  ]);

  // Fields that are URI references
  const uriRefFields = new Set([
    'rxNormCode', 'icd10Code', 'snomedCode', 'loincCode', 'testCode', 'drugCode',
  ]);

  for (const [key, pred] of Object.entries(PROPERTY_PREDICATES)) {
    if (idTypedFields.has(key)) {
      context[key] = { '@id': pred, '@type': '@id' };
    } else if (dateTimeFields.has(key)) {
      context[key] = { '@id': pred, '@type': 'xsd:dateTime' };
    } else if (dateOnlyFields.has(key)) {
      context[key] = { '@id': pred, '@type': 'xsd:date' };
    } else if (booleanFields.has(key)) {
      context[key] = { '@id': pred, '@type': 'xsd:boolean' };
    } else if (integerFields.has(key)) {
      context[key] = { '@id': pred, '@type': 'xsd:integer' };
    } else if (uriRefFields.has(key)) {
      context[key] = { '@id': pred, '@type': '@id' };
    } else {
      context[key] = pred;
    }
  }

  return { '@context': context };
}
