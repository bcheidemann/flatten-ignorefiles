/**
 * @module
 * Re-export of `@bcheidemann/flatten-ignorefiles/mod`.
 */

import { parseArgs } from "@std/cli";
import { discoverIgnoreFiles, flattenIgnoreFiles } from "./mod.ts";
import { assert } from "@std/assert";

export * from "./mod.ts";

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    boolean: [
      "help",
      "remove",
      "skip-source-comments",
      "strip-whitespace",
      "strip-comments",
    ],
    string: ["dir", "glob", "out"],
    alias: {
      h: "help",
      d: "dir",
      g: "glob",
      o: "out",
      r: "remove",
    },
    default: {
      dir: ".",
      glob: "**/.gitignore",
      out: false as false,
    },
    unknown(arg) {
      console.error(
        `ERROR: "${arg}" is not a valid option and will be ignored. Run with "--help" for usage.`,
      );
      Deno.exit(1);
    },
  });

  if (args.help) {
    console.log([
      "Usage: flatten-ignorefiles [options]",
      "",
      "Options:",
      "  -h, --help               Print command line options and usage.",
      "  -d, --dir                The base directory to search for ignore files.",
      '                           (default: ".")',
      "  -g, --glob               The glob pattern used to search for ignore",
      "                           files.",
      '                           (default: "**/.gitignore")',
      "  -o, --out                The output file path for the flattened ignore",
      "                           file. If not provided, the flattened file will",
      "                           be logged to stdout. Relative to --dir.",
      "                           (optional)",
      "  -r, --remove             Remove the discovered ignore files.",
      "                           (default: false)",
      "  --skip-source-comments   If omitted, comments will be added indicating",
      "                           the source file for each section of the",
      "                           flattened output file.",
      "                           (default: false)",
      "  --strip-whitespace       Removes the whitespace from source files.",
      "                           (default: false)",
      "  --strip-comments         Removes the comments from source files.",
      "                           (default: false)",
    ].join("\n"));

    Deno.exit(0);
  }

  const files = discoverIgnoreFiles({
    directory: args.dir,
    ignoreFileGlobPattern: args.glob,
  });

  const content = flattenIgnoreFiles(files, {
    baseDirectory: args.dir,
    skipSourceComments: args["skip-source-comments"],
    stripComments: args["strip-comments"],
    stripWhitespace: args["strip-whitespace"],
  });

  if (args.out === false) {
    Deno.stdout.write(new TextEncoder().encode(content));
  } else {
    Deno.writeTextFile(args.out, content);
  }

  if (args.remove) {
    for (const file of files) {
      assert(file.isFile);
      Deno.removeSync(file.path);
    }
  }
}
