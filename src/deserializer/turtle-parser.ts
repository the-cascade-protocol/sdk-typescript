/**
 * Zero-dependency Turtle parser for deserializing Cascade Protocol records.
 *
 * Uses regex-based parsing to convert Turtle (Terse RDF Triple Language)
 * content back into typed Cascade Protocol model objects.
 *
 * Supports:
 * - @prefix declarations
 * - Subject-predicate-object triples
 * - Typed literals (xsd:dateTime, xsd:date, xsd:integer, xsd:double)
 * - URI references (angle-bracket and prefixed forms)
 * - Boolean literals
 * - RDF lists `( item1 item2 ... )`
 * - Blank nodes `[ ... ]`
 * - Triple-quoted long literals
 * - Multi-value predicates (repeated predicate with different objects)
 *
 * @module deserializer
 */

import { NAMESPACES, TYPE_MAPPING, buildReversePredicateMap } from '../vocabularies/namespaces.js';
import type { CascadeRecord } from '../models/common.js';

// ─── Internal Types ─────────────────────────────────────────────────────────

interface ParsedTriple {
  subject: string;
  predicate: string;
  object: string;
  objectType: 'uri' | 'literal' | 'boolean' | 'integer' | 'double' | 'list' | 'blankNode';
  datatype?: string;
}

interface ParsedPrefix {
  prefix: string;
  uri: string;
}

// ─── Reverse Predicate Mapping ──────────────────────────────────────────────

/**
 * Type-specific predicate overrides for deserialization.
 * These map full predicate URIs to JSON property names for cases where
 * the same local name is used in different namespaces depending on record type.
 */
const ADDITIONAL_REVERSE_MAPPINGS: Record<string, string> = {
  // VitalSign uses clinical: namespace for these predicates
  [`${NAMESPACES.clinical}snomedCode`]: 'snomedCode',
  [`${NAMESPACES.clinical}interpretation`]: 'interpretation',
};

const REVERSE_PREDICATE_MAP = buildReversePredicateMap(ADDITIONAL_REVERSE_MAPPINGS);

/**
 * Build a reverse mapping from RDF type URI to record type string.
 */
function buildReverseTypeMap(): Map<string, { recordType: string; mappingKey: string }> {
  const reverseMap = new Map<string, { recordType: string; mappingKey: string }>();
  for (const [key, mapping] of Object.entries(TYPE_MAPPING)) {
    const colonIdx = mapping.rdfType.indexOf(':');
    if (colonIdx >= 0) {
      const nsPrefix = mapping.rdfType.slice(0, colonIdx);
      const localName = mapping.rdfType.slice(colonIdx + 1);
      const nsUri = NAMESPACES[nsPrefix as keyof typeof NAMESPACES];
      if (nsUri) {
        reverseMap.set(`${nsUri}${localName}`, { recordType: localName, mappingKey: key });
      }
    }
  }
  return reverseMap;
}

const REVERSE_TYPE_MAP = buildReverseTypeMap();

// ─── Fields requiring special type conversion ───────────────────────────────

/** Fields that are booleans */
const BOOLEAN_FIELDS = new Set([
  'isActive', 'asNeeded',
]);

/** Fields that are numbers (integers) */
const INTEGER_TYPE_FIELDS = new Set([
  'computedAge', 'refillsAllowed', 'supplyDurationDays', 'onsetAge',
  'steps', 'activeMinutes', 'calories', 'awakenings',
  'totalSleepMinutes', 'deepSleepMinutes', 'remSleepMinutes', 'lightSleepMinutes',
]);

/** Fields that are numbers (possibly float) */
const NUMBER_FIELDS = new Set([
  'value', 'referenceRangeLow', 'referenceRangeHigh',
  'distance',
]);

/** Fields that hold arrays of strings */
const ARRAY_TYPE_FIELDS = new Set([
  'drugCodes', 'affectsVitalSigns', 'monitoredVitalSigns',
]);

// ─── Turtle Tokenizer / Parser ──────────────────────────────────────────────

/**
 * Parse @prefix declarations from Turtle content.
 */
function parsePrefixes(content: string): ParsedPrefix[] {
  const prefixes: ParsedPrefix[] = [];
  const regex = /@prefix\s+(\w+):\s+<([^>]+)>\s*\./g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    prefixes.push({ prefix: match[1] ?? '', uri: match[2] ?? '' });
  }
  return prefixes;
}

/**
 * Expand a prefixed name (e.g., "health:medicationName") to a full URI
 * using the parsed prefix declarations.
 */
function expandPrefixedName(
  name: string,
  prefixMap: Map<string, string>,
): string {
  // Already a full URI
  if (name.startsWith('http://') || name.startsWith('https://') || name.startsWith('urn:')) {
    return name;
  }

  const colonIdx = name.indexOf(':');
  if (colonIdx < 0) return name;

  const prefix = name.slice(0, colonIdx);
  const local = name.slice(colonIdx + 1);
  const nsUri = prefixMap.get(prefix);
  if (nsUri) {
    return `${nsUri}${local}`;
  }
  return name;
}

/**
 * Remove Turtle comments (# to end of line) while respecting
 * angle-bracket URIs and quoted strings where # is a literal character.
 */
function removeComments(content: string): string {
  let result = '';
  let inString = false;
  let inTripleQuote = false;
  let inUri = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    // Handle triple-quoted strings
    if (!inString && !inTripleQuote && !inUri && content.slice(i, i + 3) === '"""') {
      inTripleQuote = true;
      result += '"""';
      i += 2;
      continue;
    }
    if (inTripleQuote) {
      if (content.slice(i, i + 3) === '"""' && (i === 0 || content[i - 1] !== '\\')) {
        inTripleQuote = false;
        result += '"""';
        i += 2;
        continue;
      }
      result += ch;
      continue;
    }

    // Handle regular strings
    if (ch === '"' && !inString && !inUri) {
      inString = true;
      result += ch;
      continue;
    }
    if (ch === '"' && inString && (i === 0 || content[i - 1] !== '\\')) {
      inString = false;
      result += ch;
      continue;
    }
    if (inString) {
      result += ch;
      continue;
    }

    // Handle angle-bracket URIs
    if (ch === '<' && !inUri) {
      inUri = true;
      result += ch;
      continue;
    }
    if (ch === '>' && inUri) {
      inUri = false;
      result += ch;
      continue;
    }
    if (inUri) {
      result += ch;
      continue;
    }

    // At top-level: # starts a comment to end of line
    if (ch === '#') {
      // Skip until newline
      while (i < content.length && content[i] !== '\n') {
        i++;
      }
      // Include the newline if present
      if (i < content.length && content[i] === '\n') {
        result += '\n';
      }
      continue;
    }

    result += ch;
  }

  return result;
}

/**
 * Unescape a Turtle string literal (handle \\, \", \n, \r, \t).
 */
function unescapeTurtleLiteral(value: string): string {
  return value
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Strip surrounding angle brackets from a URI.
 */
function stripAngleBrackets(uri: string): string {
  if (uri.startsWith('<') && uri.endsWith('>')) {
    return uri.slice(1, -1);
  }
  return uri;
}

/**
 * Parse Turtle content into a list of parsed triples.
 *
 * This is a lightweight regex-based parser that handles the subset of Turtle
 * used by Cascade Protocol records. It does NOT implement a full Turtle grammar.
 */
function parseTurtleContent(content: string): {
  prefixes: ParsedPrefix[];
  triples: ParsedTriple[];
} {
  const prefixes = parsePrefixes(content);
  const prefixMap = new Map<string, string>();
  for (const p of prefixes) {
    prefixMap.set(p.prefix, p.uri);
  }
  // Add well-known prefixes as fallback
  prefixMap.set('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
  prefixMap.set('xsd', NAMESPACES.xsd);

  const triples: ParsedTriple[] = [];

  // Remove prefix declarations
  let body = content
    .replace(/@prefix\s+\w+:\s+<[^>]+>\s*\.\s*/g, '');

  // Remove comments (# to end of line) but NOT when # is inside <...> URIs or "..." strings
  body = removeComments(body).trim();

  // Parse subject blocks: <subject> predicate-list .
  // Match subject URIs or prefixed names
  const subjectRegex = /(<[^>]+>|[a-zA-Z][\w-]*:[\w-]+)\s+/;

  while (body.length > 0) {
    body = body.trim();
    if (body.length === 0) break;

    // Match subject
    const subMatch = subjectRegex.exec(body);
    if (!subMatch) break;

    let subject = subMatch[1] ?? '';
    if (subject.startsWith('<') && subject.endsWith('>')) {
      subject = subject.slice(1, -1);
    } else {
      subject = expandPrefixedName(subject, prefixMap);
    }

    // Find the predicate-object list (everything until the closing '.')
    let startIdx = (subMatch.index ?? 0) + subMatch[0].length;
    const predicateObjects = extractPredicateObjectList(body, startIdx);
    if (!predicateObjects) break;

    body = body.slice(predicateObjects.endIndex).trim();

    // Parse each predicate-object pair
    parsePredicateObjectPairs(subject, predicateObjects.content, prefixMap, triples);
  }

  return { prefixes, triples };
}

/**
 * Extract the predicate-object list from the current position in the body,
 * handling nested blank nodes and lists.
 */
function extractPredicateObjectList(
  body: string,
  startIdx: number,
): { content: string; endIndex: number } | null {
  let depth = 0; // for nested [] and ()
  let i = startIdx;
  let inString = false;
  let inTripleQuote = false;
  let inUri = false; // for <...> URI delimiters
  let prevChar = '';

  while (i < body.length) {
    const ch = body[i];

    // Handle triple-quoted strings
    if (!inString && !inTripleQuote && !inUri && body.slice(i, i + 3) === '"""') {
      inTripleQuote = true;
      i += 3;
      continue;
    }
    if (inTripleQuote) {
      if (body.slice(i, i + 3) === '"""' && prevChar !== '\\') {
        inTripleQuote = false;
        i += 3;
        continue;
      }
      prevChar = ch ?? '';
      i++;
      continue;
    }

    // Handle regular quoted strings
    if (ch === '"' && !inString && !inUri && prevChar !== '\\') {
      inString = true;
      i++;
      prevChar = ch;
      continue;
    }
    if (ch === '"' && inString && prevChar !== '\\') {
      inString = false;
      i++;
      prevChar = ch;
      continue;
    }
    if (inString) {
      prevChar = ch ?? '';
      i++;
      continue;
    }

    // Handle angle-bracket URIs <...>
    if (ch === '<' && !inUri) {
      inUri = true;
      i++;
      prevChar = ch;
      continue;
    }
    if (ch === '>' && inUri) {
      inUri = false;
      i++;
      prevChar = ch;
      continue;
    }
    if (inUri) {
      prevChar = ch ?? '';
      i++;
      continue;
    }

    if (ch === '[' || ch === '(') depth++;
    if (ch === ']' || ch === ')') depth--;

    if (ch === '.' && depth === 0) {
      // Check if this dot is followed by whitespace or end-of-string
      // to distinguish from dots in prefixed names (e.g., "foaf:name")
      const nextChar = i + 1 < body.length ? body[i + 1] : '';
      if (nextChar === '' || nextChar === '\n' || nextChar === '\r' || nextChar === ' ' || nextChar === '\t') {
        return { content: body.slice(startIdx, i).trim(), endIndex: i + 1 };
      }
    }

    prevChar = ch ?? '';
    i++;
  }

  // If we reach the end without a dot, treat the rest as the content
  if (body.slice(startIdx).trim().length > 0) {
    return { content: body.slice(startIdx).trim(), endIndex: body.length };
  }
  return null;
}

/**
 * Parse semicolon-separated predicate-object pairs.
 */
function parsePredicateObjectPairs(
  subject: string,
  content: string,
  prefixMap: Map<string, string>,
  triples: ParsedTriple[],
): void {
  // Split on ';' that are not inside strings, brackets, or parens
  const pairs = splitOnSemicolon(content);

  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (trimmed.length === 0) continue;

    // Handle "a <type>" shorthand
    if (trimmed.startsWith('a ')) {
      const typeValue = trimmed.slice(2).trim();
      const expandedType = typeValue.startsWith('<')
        ? stripAngleBrackets(typeValue)
        : expandPrefixedName(typeValue, prefixMap);

      triples.push({
        subject,
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        object: expandedType,
        objectType: 'uri',
      });
      continue;
    }

    // Split predicate and object(s)
    const spaceIdx = findFirstWhitespace(trimmed);
    if (spaceIdx < 0) continue;

    const predStr = trimmed.slice(0, spaceIdx).trim();
    const objStr = trimmed.slice(spaceIdx + 1).trim();

    const predUri = predStr.startsWith('<')
      ? stripAngleBrackets(predStr)
      : expandPrefixedName(predStr, prefixMap);

    // Parse the object value
    parseObjectValue(subject, predUri, objStr, prefixMap, triples);
  }
}

/**
 * Find the first whitespace character that is not inside brackets or strings.
 */
function findFirstWhitespace(str: string): number {
  let inQuote = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"' && (i === 0 || str[i - 1] !== '\\')) {
      inQuote = !inQuote;
    }
    if (!inQuote && (ch === ' ' || ch === '\t' || ch === '\n')) {
      return i;
    }
  }
  return -1;
}

/**
 * Split a string on ';' characters that are not inside strings, brackets, or parens.
 */
function splitOnSemicolon(content: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let inString = false;
  let inTripleQuote = false;
  let inUri = false;
  let current = '';

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    // Handle triple-quoted strings
    if (!inString && !inTripleQuote && !inUri && content.slice(i, i + 3) === '"""') {
      inTripleQuote = true;
      current += '"""';
      i += 2;
      continue;
    }
    if (inTripleQuote) {
      if (content.slice(i, i + 3) === '"""' && (i === 0 || content[i - 1] !== '\\')) {
        inTripleQuote = false;
        current += '"""';
        i += 2;
        continue;
      }
      current += ch;
      continue;
    }

    if (ch === '"' && !inString && !inUri && (i === 0 || content[i - 1] !== '\\')) {
      inString = true;
      current += ch;
      continue;
    }
    if (ch === '"' && inString && (i === 0 || content[i - 1] !== '\\')) {
      inString = false;
      current += ch;
      continue;
    }
    if (inString) {
      current += ch;
      continue;
    }

    // Handle angle-bracket URIs <...>
    if (ch === '<' && !inUri) {
      inUri = true;
      current += ch;
      continue;
    }
    if (ch === '>' && inUri) {
      inUri = false;
      current += ch;
      continue;
    }
    if (inUri) {
      current += ch;
      continue;
    }

    if (ch === '[' || ch === '(') depth++;
    if (ch === ']' || ch === ')') depth--;

    if (ch === ';' && depth === 0) {
      result.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim().length > 0) {
    result.push(current);
  }

  return result;
}

/**
 * Parse an object value string into the appropriate type and add a triple.
 */
function parseObjectValue(
  subject: string,
  predicate: string,
  objStr: string,
  prefixMap: Map<string, string>,
  triples: ParsedTriple[],
): void {
  const trimmed = objStr.trim();

  // Boolean literals
  if (trimmed === 'true' || trimmed === 'false') {
    triples.push({
      subject,
      predicate,
      object: trimmed,
      objectType: 'boolean',
    });
    return;
  }

  // URI reference (angle brackets)
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    triples.push({
      subject,
      predicate,
      object: stripAngleBrackets(trimmed),
      objectType: 'uri',
    });
    return;
  }

  // Prefixed name (e.g., cascade:ClinicalGenerated)
  if (/^[a-zA-Z][\w-]*:[\w-]+$/.test(trimmed)) {
    triples.push({
      subject,
      predicate,
      object: expandPrefixedName(trimmed, prefixMap),
      objectType: 'uri',
    });
    return;
  }

  // Plain integer (no quotes)
  if (/^-?\d+$/.test(trimmed)) {
    triples.push({
      subject,
      predicate,
      object: trimmed,
      objectType: 'integer',
    });
    return;
  }

  // Plain double (no quotes, has decimal)
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    triples.push({
      subject,
      predicate,
      object: trimmed,
      objectType: 'double',
    });
    return;
  }

  // RDF list ( item1 item2 ... )
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const listContent = trimmed.slice(1, -1).trim();
    // Parse list items
    const items = parseListItems(listContent);
    triples.push({
      subject,
      predicate,
      object: JSON.stringify(items),
      objectType: 'list',
    });
    return;
  }

  // Blank node [ ... ]
  if (trimmed.startsWith('[')) {
    // For blank nodes, we store the inner content as the object
    // and parse it recursively
    const bnodeId = `_:b${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    triples.push({
      subject,
      predicate,
      object: bnodeId,
      objectType: 'blankNode',
    });

    // Extract inner content between [ and ]
    const innerStart = trimmed.indexOf('[') + 1;
    const innerEnd = trimmed.lastIndexOf(']');
    if (innerEnd > innerStart) {
      const inner = trimmed.slice(innerStart, innerEnd).trim();
      parsePredicateObjectPairs(bnodeId, inner, prefixMap, triples);
    }
    return;
  }

  // Triple-quoted string literal """..."""
  if (trimmed.startsWith('"""')) {
    const endIdx = trimmed.indexOf('"""', 3);
    if (endIdx >= 0) {
      const value = trimmed.slice(3, endIdx);
      const afterQuote = trimmed.slice(endIdx + 3).trim();
      let datatype: string | undefined;
      if (afterQuote.startsWith('^^')) {
        const dtStr = afterQuote.slice(2);
        datatype = dtStr.startsWith('<')
          ? stripAngleBrackets(dtStr)
          : expandPrefixedName(dtStr, prefixMap);
      }
      triples.push({
        subject,
        predicate,
        object: unescapeTurtleLiteral(value),
        objectType: 'literal',
        datatype,
      });
    }
    return;
  }

  // Quoted string literal "..."
  if (trimmed.startsWith('"')) {
    // Find matching closing quote (not escaped)
    let endQuoteIdx = -1;
    for (let i = 1; i < trimmed.length; i++) {
      if (trimmed[i] === '"' && trimmed[i - 1] !== '\\') {
        endQuoteIdx = i;
        break;
      }
    }
    if (endQuoteIdx >= 0) {
      const value = trimmed.slice(1, endQuoteIdx);
      const afterQuote = trimmed.slice(endQuoteIdx + 1).trim();
      let datatype: string | undefined;
      if (afterQuote.startsWith('^^')) {
        const dtStr = afterQuote.slice(2);
        datatype = dtStr.startsWith('<')
          ? stripAngleBrackets(dtStr)
          : expandPrefixedName(dtStr, prefixMap);
      }
      triples.push({
        subject,
        predicate,
        object: unescapeTurtleLiteral(value),
        objectType: 'literal',
        datatype,
      });
    }
    return;
  }

  // Fallback: treat as literal
  triples.push({
    subject,
    predicate,
    object: trimmed,
    objectType: 'literal',
  });
}

/**
 * Parse items from an RDF list, handling quoted strings.
 */
function parseListItems(content: string): string[] {
  const items: string[] = [];
  let remaining = content.trim();

  while (remaining.length > 0) {
    remaining = remaining.trim();
    if (remaining.length === 0) break;

    if (remaining.startsWith('"')) {
      // Find closing quote
      let endIdx = -1;
      for (let i = 1; i < remaining.length; i++) {
        if (remaining[i] === '"' && remaining[i - 1] !== '\\') {
          endIdx = i;
          break;
        }
      }
      if (endIdx >= 0) {
        items.push(unescapeTurtleLiteral(remaining.slice(1, endIdx)));
        remaining = remaining.slice(endIdx + 1).trim();
        // Skip optional datatype
        if (remaining.startsWith('^^')) {
          const spaceIdx = remaining.indexOf(' ');
          remaining = spaceIdx >= 0 ? remaining.slice(spaceIdx) : '';
        }
      } else {
        break;
      }
    } else if (remaining.startsWith('<')) {
      // URI
      const endIdx = remaining.indexOf('>');
      if (endIdx >= 0) {
        items.push(remaining.slice(1, endIdx));
        remaining = remaining.slice(endIdx + 1).trim();
      } else {
        break;
      }
    } else {
      // Unquoted token
      const spaceIdx = remaining.indexOf(' ');
      if (spaceIdx >= 0) {
        items.push(remaining.slice(0, spaceIdx));
        remaining = remaining.slice(spaceIdx + 1);
      } else {
        items.push(remaining);
        remaining = '';
      }
    }
  }

  return items;
}

// ─── Public API ─────────────────────────────────────────────────────────────

const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

/**
 * Resolve a Cascade record type string (e.g., "MedicationRecord") to the full
 * RDF type URI used in Turtle.
 */
function resolveTypeUri(type: string): string | null {
  // Try direct match in TYPE_MAPPING values
  for (const mapping of Object.values(TYPE_MAPPING)) {
    const colonIdx = mapping.rdfType.indexOf(':');
    if (colonIdx >= 0) {
      const nsPrefix = mapping.rdfType.slice(0, colonIdx);
      const localName = mapping.rdfType.slice(colonIdx + 1);
      if (localName === type) {
        const nsUri = NAMESPACES[nsPrefix as keyof typeof NAMESPACES];
        if (nsUri) return `${nsUri}${localName}`;
      }
    }
  }
  return null;
}

/**
 * Convert parsed triples for a single subject into a typed record object.
 */
function triplesToRecord<T extends CascadeRecord>(
  subjectUri: string,
  triples: ParsedTriple[],
  recordType: string,
): T {
  const record: Record<string, unknown> = {
    id: subjectUri,
    type: recordType,
  };

  // Group triples by predicate for multi-value handling
  const triplesByPredicate = new Map<string, ParsedTriple[]>();
  for (const triple of triples) {
    if (triple.subject !== subjectUri) continue;
    if (triple.predicate === RDF_TYPE) continue;

    const existing = triplesByPredicate.get(triple.predicate);
    if (existing) {
      existing.push(triple);
    } else {
      triplesByPredicate.set(triple.predicate, [triple]);
    }
  }

  for (const [predUri, predTriples] of triplesByPredicate) {
    const jsonKey = REVERSE_PREDICATE_MAP.get(predUri);
    if (!jsonKey) continue;

    // Handle array fields
    if (ARRAY_TYPE_FIELDS.has(jsonKey)) {
      const values: string[] = [];
      for (const t of predTriples) {
        if (t.objectType === 'list') {
          try {
            const parsed = JSON.parse(t.object) as string[];
            values.push(...parsed);
          } catch {
            values.push(t.object);
          }
        } else {
          values.push(t.object);
        }
      }
      record[jsonKey] = values;
      continue;
    }

    // Single-value fields use the first triple
    const triple = predTriples[0];
    if (!triple) continue;

    // dataProvenance: extract local name from cascade namespace
    if (jsonKey === 'dataProvenance') {
      const cascadeNs = NAMESPACES.cascade;
      if (triple.object.startsWith(cascadeNs)) {
        record[jsonKey] = triple.object.slice(cascadeNs.length);
      } else {
        record[jsonKey] = triple.object;
      }
      continue;
    }

    // Boolean fields
    if (triple.objectType === 'boolean' || BOOLEAN_FIELDS.has(jsonKey)) {
      record[jsonKey] = triple.object === 'true';
      continue;
    }

    // Integer fields
    if (INTEGER_TYPE_FIELDS.has(jsonKey) || triple.objectType === 'integer' ||
        triple.datatype === NAMESPACES.xsd + 'integer') {
      record[jsonKey] = parseInt(triple.object, 10);
      continue;
    }

    // Number fields (plain numeric)
    if (NUMBER_FIELDS.has(jsonKey)) {
      const num = parseFloat(triple.object);
      if (!isNaN(num)) {
        record[jsonKey] = num;
      } else {
        record[jsonKey] = triple.object;
      }
      continue;
    }

    // Double/decimal fields
    if (triple.objectType === 'double' ||
        triple.datatype === NAMESPACES.xsd + 'double' ||
        triple.datatype === NAMESPACES.xsd + 'decimal') {
      record[jsonKey] = parseFloat(triple.object);
      continue;
    }

    // URI fields: keep the full URI string
    if (triple.objectType === 'uri') {
      record[jsonKey] = triple.object;
      continue;
    }

    // Default: string literal
    record[jsonKey] = triple.object;
  }

  return record as T;
}

/**
 * Parse Turtle content and return typed records matching the specified type.
 *
 * @param turtle - Turtle document content
 * @param type - Record type string (e.g., "MedicationRecord", "VitalSign", "PatientProfile")
 * @returns Array of parsed records of the specified type
 *
 * @example
 * ```typescript
 * import { deserialize } from '@the-cascade-protocol/sdk';
 * import type { Medication } from '@the-cascade-protocol/sdk';
 *
 * const meds = deserialize<Medication>(turtleString, 'MedicationRecord');
 * ```
 */
export function deserialize<T extends CascadeRecord>(turtle: string, type: string): T[] {
  const { triples } = parseTurtleContent(turtle);

  // Resolve the requested type to a full URI
  const typeUri = resolveTypeUri(type);
  if (!typeUri) {
    throw new Error(`Unknown record type: ${type}. Cannot resolve to RDF type URI.`);
  }

  // Find all subjects with matching rdf:type
  const matchingSubjects: string[] = [];
  for (const triple of triples) {
    if (triple.predicate === RDF_TYPE && triple.object === typeUri) {
      matchingSubjects.push(triple.subject);
    }
  }

  // Look up the record type name from REVERSE_TYPE_MAP
  const typeInfo = REVERSE_TYPE_MAP.get(typeUri);
  const recordType = typeInfo?.recordType ?? type;

  // Convert each subject to a record
  return matchingSubjects.map((subjectUri) =>
    triplesToRecord<T>(subjectUri, triples, recordType),
  );
}

/**
 * Parse a single record from Turtle content.
 *
 * Returns the first record matching the specified type, or `null` if none found.
 *
 * @param turtle - Turtle document content
 * @param type - Record type string
 * @returns The parsed record, or null
 */
export function deserializeOne<T extends CascadeRecord>(turtle: string, type: string): T | null {
  const results = deserialize<T>(turtle, type);
  return results[0] ?? null;
}
