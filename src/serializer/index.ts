/**
 * Re-exports for the Turtle serializer module.
 *
 * @module serializer
 */

export { TurtleBuilder, SubjectBuilder, escapeTurtleString } from './turtle-builder.js';
export {
  serialize,
  serializeMedication,
  serializeCondition,
  serializeAllergy,
  serializeLabResult,
  serializeVitalSign,
  serializeImmunization,
  serializeProcedure,
  serializeFamilyHistory,
  serializeCoverage,
  serializePatientProfile,
  serializeActivitySnapshot,
  serializeSleepSnapshot,
} from './turtle-serializer.js';
