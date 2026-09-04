/**
 * Browser-safety gate.
 *
 * Bundles the package's public entry point for a browser target and fails if
 * the bundle fails or if a Node-only construct survives into the output.
 *
 * The requirement this enforces: importing `@the-cascade-protocol/sdk` in a page
 * bundled for a browser MUST succeed, and `serialize`, `deserialize`,
 * `validate`, `toJsonLd` and `fromJsonLd` MUST work there. Node-only
 * functionality may exist, but only behind a separate entry point that the
 * browser entry never imports.
 */

import { buildBrowserBundle, scanForNodeOnlyConstructs } from './browser-bundle.mjs';

try {
  const { outfile, code } = await buildBrowserBundle();
  const violations = scanForNodeOnlyConstructs(code);

  if (violations.length > 0) {
    console.error('Browser bundle built, but Node-only constructs survived into the output:');
    for (const { name, sample } of violations) {
      console.error(`  - ${name}: ${sample}`);
    }
    process.exit(1);
  }

  console.log(`Browser bundle OK: ${(code.length / 1024).toFixed(1)} kB at ${outfile}`);
} catch (error) {
  // esbuild has already printed its own diagnostics at log level "error".
  console.error('Browser bundle FAILED: the public entry point does not load in a browser.');
  if (!/build failed/i.test(String(error?.message))) console.error(error);
  process.exit(1);
}
