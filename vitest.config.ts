import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Vitest's default `exclude` covers node_modules and dist but not
    // `.claude/`, where git worktrees of this repo are created. Without this,
    // a worktree checked out inside the repo is collected as a second copy of
    // the whole suite and every reported count silently doubles.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
});
