/**
 * @module
 * Re-export of `@bcheidemann/flatten-ignorefiles/mod`.
 */

import { run } from "./cli.ts";

export * from "./mod.ts";

if (import.meta.main) {
  run();
}
