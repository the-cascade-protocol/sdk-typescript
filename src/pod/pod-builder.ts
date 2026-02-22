import { serialize } from '../serializer/turtle-serializer.js';
import { CURRENT_SCHEMA_VERSION, NAMESPACES } from '../vocabularies/namespaces.js';
import type { Medication } from '../models/medication.js';
import type { Condition } from '../models/condition.js';
import type { Allergy } from '../models/allergy.js';
import type { LabResult } from '../models/lab-result.js';
import type { VitalSign } from '../models/vital-sign.js';
import type { Immunization } from '../models/immunization.js';
import type { Procedure } from '../models/procedure.js';
import type { FamilyHistory } from '../models/family-history.js';
import type { Coverage } from '../models/coverage.js';
import type { PatientProfile } from '../models/patient-profile.js';
import type { ActivitySnapshot } from '../models/activity-snapshot.js';
import type { SleepSnapshot } from '../models/sleep-snapshot.js';
import type { HealthProfile } from '../models/health-profile.js';
import type { CascadeRecord } from '../models/common.js';

// ─── Public Interfaces ──────────────────────────────────────────────────────

export interface PodFile {
  readonly path: string;
  readonly content: string;
}

export interface PodManifest {
  readonly title: string;
  readonly description?: string;
  readonly created: string;
  readonly schemaVersion: string;
  readonly files: readonly string[];
}

export interface PodOptions {
  readonly title: string;
  readonly description?: string;
  readonly schemaVersion?: string;
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

const PREFIX_LINE_RE = /^@prefix\s+\S+\s+<[^>]+>\s*\.\s*$/;

interface ParsedTurtle {
  prefixes: Map<string, string>;
  body: string;
}

function parseTurtle(turtle: string): ParsedTurtle {
  const lines = turtle.split('\n');
  const prefixes = new Map<string, string>();
  const bodyLines: string[] = [];
  let pastPrefixes = false;

  for (const line of lines) {
    if (!pastPrefixes && PREFIX_LINE_RE.test(line.trim())) {
      const match = line.match(/@prefix\s+(\S+):\s+<([^>]+)>/);
      if (match) {
        prefixes.set(match[1]!, match[2]!);
      }
    } else {
      pastPrefixes = true;
      bodyLines.push(line);
    }
  }

  // Trim leading blank lines from body
  while (bodyLines.length > 0 && bodyLines[0]!.trim() === '') {
    bodyLines.shift();
  }

  return { prefixes, body: bodyLines.join('\n') };
}

const PREFIX_ORDER = [
  'cascade', 'health', 'clinical', 'coverage', 'checkup', 'pots',
  'fhir', 'rxnorm', 'sct', 'loinc', 'icd10', 'ucum',
  'prov', 'foaf', 'ldp', 'dcterms', 'xsd',
];

function sortedPrefixEntries(prefixes: Map<string, string>): [string, string][] {
  const entries = Array.from(prefixes.entries());
  entries.sort((a, b) => {
    const ai = PREFIX_ORDER.indexOf(a[0]);
    const bi = PREFIX_ORDER.indexOf(b[0]);
    const aIdx = ai >= 0 ? ai : PREFIX_ORDER.length;
    const bIdx = bi >= 0 ? bi : PREFIX_ORDER.length;
    return aIdx - bIdx;
  });
  return entries;
}

function mergeTurtleDocuments(turtles: string[]): string {
  const mergedPrefixes = new Map<string, string>();
  const bodies: string[] = [];

  for (const ttl of turtles) {
    const parsed = parseTurtle(ttl);
    for (const [k, v] of parsed.prefixes) {
      mergedPrefixes.set(k, v);
    }
    if (parsed.body.trim().length > 0) {
      bodies.push(parsed.body.trimEnd());
    }
  }

  const prefixLines = sortedPrefixEntries(mergedPrefixes)
    .map(([name, uri]) => `@prefix ${name}: <${uri}> .`);

  const parts: string[] = [...prefixLines];
  if (prefixLines.length > 0 && bodies.length > 0) {
    parts.push('');
  }
  parts.push(...bodies);

  return parts.join('\n') + '\n';
}

function isClinicalProvenance(record: CascadeRecord): boolean {
  return record.dataProvenance !== 'DeviceGenerated';
}

// ─── Pod Builder ────────────────────────────────────────────────────────────

export class PodBuilder {
  private readonly _options: PodOptions;
  private readonly _medications: Medication[] = [];
  private readonly _conditions: Condition[] = [];
  private readonly _allergies: Allergy[] = [];
  private readonly _labResults: LabResult[] = [];
  private readonly _clinicalVitalSigns: VitalSign[] = [];
  private readonly _deviceVitalSigns: VitalSign[] = [];
  private readonly _immunizations: Immunization[] = [];
  private readonly _procedures: Procedure[] = [];
  private readonly _familyHistory: FamilyHistory[] = [];
  private readonly _coverage: Coverage[] = [];
  private readonly _patientProfiles: PatientProfile[] = [];
  private readonly _activitySnapshots: ActivitySnapshot[] = [];
  private readonly _sleepSnapshots: SleepSnapshot[] = [];

  constructor(options: PodOptions) {
    this._options = options;
  }

  addMedication(med: Medication): this {
    this._medications.push(med);
    return this;
  }

  addCondition(cond: Condition): this {
    this._conditions.push(cond);
    return this;
  }

  addAllergy(allergy: Allergy): this {
    this._allergies.push(allergy);
    return this;
  }

  addLabResult(lab: LabResult): this {
    this._labResults.push(lab);
    return this;
  }

  addVitalSign(vital: VitalSign): this {
    if (isClinicalProvenance(vital)) {
      this._clinicalVitalSigns.push(vital);
    } else {
      this._deviceVitalSigns.push(vital);
    }
    return this;
  }

  addImmunization(imm: Immunization): this {
    this._immunizations.push(imm);
    return this;
  }

  addProcedure(proc: Procedure): this {
    this._procedures.push(proc);
    return this;
  }

  addFamilyHistory(fam: FamilyHistory): this {
    this._familyHistory.push(fam);
    return this;
  }

  addCoverage(cov: Coverage): this {
    this._coverage.push(cov);
    return this;
  }

  addPatientProfile(profile: PatientProfile): this {
    this._patientProfiles.push(profile);
    return this;
  }

  addActivitySnapshot(activity: ActivitySnapshot): this {
    this._activitySnapshots.push(activity);
    return this;
  }

  addSleepSnapshot(sleep: SleepSnapshot): this {
    this._sleepSnapshots.push(sleep);
    return this;
  }

  addHealthProfile(profile: HealthProfile): this {
    if (profile.patientProfile) {
      this.addPatientProfile(profile.patientProfile);
    }
    for (const med of profile.medications) this.addMedication(med);
    for (const cond of profile.conditions) this.addCondition(cond);
    for (const allergy of profile.allergies) this.addAllergy(allergy);
    for (const lab of profile.labResults) this.addLabResult(lab);
    for (const vital of profile.vitalSigns) this.addVitalSign(vital);
    for (const imm of profile.immunizations) this.addImmunization(imm);
    for (const proc of profile.procedures) this.addProcedure(proc);
    for (const fam of profile.familyHistory) this.addFamilyHistory(fam);
    for (const cov of profile.coverage) this.addCoverage(cov);
    for (const activity of profile.activitySnapshots) this.addActivitySnapshot(activity);
    for (const sleep of profile.sleepSnapshots) this.addSleepSnapshot(sleep);
    return this;
  }

  build(): PodFile[] {
    const files: PodFile[] = [];

    const addFile = (path: string, records: CascadeRecord[]): void => {
      if (records.length === 0) return;
      const turtles = records.map((r) => serialize(r));
      files.push({ path, content: mergeTurtleDocuments(turtles) });
    };

    // Clinical files
    addFile('clinical/medications.ttl', this._medications);
    addFile('clinical/conditions.ttl', this._conditions);
    addFile('clinical/allergies.ttl', this._allergies);
    addFile('clinical/lab-results.ttl', this._labResults);
    addFile('clinical/vital-signs.ttl', this._clinicalVitalSigns);
    addFile('clinical/immunizations.ttl', this._immunizations);
    addFile('clinical/procedures.ttl', this._procedures);
    addFile('clinical/family-history.ttl', this._familyHistory);
    addFile('clinical/insurance.ttl', this._coverage);
    addFile('clinical/patient-profile.ttl', this._patientProfiles);

    // Wellness files
    addFile('wellness/vital-signs.ttl', this._deviceVitalSigns);
    addFile('wellness/activity.ttl', this._activitySnapshots);
    addFile('wellness/sleep.ttl', this._sleepSnapshots);

    // Index file
    files.push({ path: 'index.ttl', content: this._buildIndex(files) });

    return files;
  }

  buildManifest(): PodManifest {
    const files = this.build();
    const filePaths = files.map((f) => f.path).filter((p) => p !== 'index.ttl');

    return {
      title: this._options.title,
      description: this._options.description,
      created: new Date().toISOString(),
      schemaVersion: this._options.schemaVersion ?? CURRENT_SCHEMA_VERSION,
      files: filePaths,
    };
  }

  private _buildIndex(files: PodFile[]): string {
    const schemaVersion = this._options.schemaVersion ?? CURRENT_SCHEMA_VERSION;
    const created = new Date().toISOString();

    const dataPaths = files
      .map((f) => f.path)
      .filter((p) => p !== 'index.ttl');

    const lines: string[] = [
      `@prefix ldp: <${NAMESPACES.ldp}> .`,
      `@prefix dcterms: <${NAMESPACES.dcterms}> .`,
      `@prefix cascade: <${NAMESPACES.cascade}> .`,
      `@prefix xsd: <${NAMESPACES.xsd}> .`,
      '',
      '<> a ldp:BasicContainer ;',
      `    dcterms:title "${escapeTitleString(this._options.title)}" ;`,
      `    dcterms:created "${created}"^^xsd:dateTime ;`,
      `    cascade:schemaVersion "${schemaVersion}" ;`,
    ];

    if (dataPaths.length === 0) {
      // Remove trailing semicolon from schemaVersion line and close
      lines[lines.length - 1] = lines[lines.length - 1]!.replace(/ ;$/, ' .');
    } else if (dataPaths.length === 1) {
      lines.push(`    ldp:contains <${dataPaths[0]}> .`);
    } else {
      lines.push('    ldp:contains');
      for (let i = 0; i < dataPaths.length; i++) {
        const isLast = i === dataPaths.length - 1;
        lines.push(`        <${dataPaths[i]}>${isLast ? ' .' : ' ,'}`);
      }
    }

    return lines.join('\n') + '\n';
  }
}

function escapeTitleString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}
