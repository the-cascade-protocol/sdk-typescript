/**
 * Bundles the SDK's public entry point for a browser target.
 *
 * Shared by `npm run check:browser` (the gate) and the bundle smoke test, so
 * the artefact the smoke test exercises is byte-identical to the one the gate
 * checks rather than a second, differently-configured build.
 *
 * The entry point is `src/index.ts`, not `dist/index.js`: esbuild compiles the
 * TypeScript itself, so the gate runs without a prior `tsc` and catches a
 * browser-hostile import the moment it is written rather than after a build
 * step someone may have skipped.
 */

import { build } from 'esbuild';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * A `node:` specifier or a CommonJS `require(` surviving into the output means
 * something reached the browser entry point that a browser cannot load. esbuild
 * already fails the build on an unresolved builtin; this second pass catches the
 * cases it would not — a builtin marked `--external`, a `require` synthesized by
 * an interop shim, or a vendored file that assembles the specifier at runtime.
 */
const FORBIDDEN = [
  { name: 'node: builtin specifier', pattern: /(?:^|[^\w.])(?:from\s*|import\s*\(?\s*|require\s*\(\s*)["']node:[a-z_/]+["']/g },
  { name: 'CommonJS require(', pattern: /(?:^|[^\w.$])require\s*\(/g },
];

export async function buildBrowserBundle() {
  const outDir = await mkdtemp(join(tmpdir(), 'cascade-sdk-browser-'));
  const outfile = join(outDir, 'sdk.browser.js');

  await build({
    entryPoints: [join(repoRoot, 'src', 'index.ts')],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2022',
    outfile,
    logLevel: 'error',
  });

  const code = await readFile(outfile, 'utf8');
  return { outfile, code };
}

/** @returns {{name: string, sample: string}[]} */
export function scanForNodeOnlyConstructs(code) {
  const violations = [];
  for (const { name, pattern } of FORBIDDEN) {
    pattern.lastIndex = 0;
    const match = pattern.exec(code);
    if (match) violations.push({ name, sample: match[0].trim() });
  }
  return violations;
}
