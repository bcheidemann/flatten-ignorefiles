import denoJson from "./deno.json" with { type: "json" };
import { parseArgs } from "jsr:@std/cli@^1.0.1";
import { assert } from "jsr:@std/assert@^1.0.1";
import { discoverIgnoreFiles, flattenIgnoreFiles } from "./mod.ts";

export function run() {
  const args = parseArgs(Deno.args, {
    boolean: [
      "version",
      "help",
      "remove",
      "skip-source-comments",
      "strip-whitespace",
      "strip-comments",
    ],
    string: ["dir", "glob", "exclude-glob", "out"],
    alias: {
      v: "version",
      h: "help",
      d: "dir",
      g: "glob",
      e: "exclude-glob",
      o: "out",
      r: "remove",
    },
    collect: ["glob", "exclude-glob"],
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

  if (args.version) {
    // deno-lint-ignore no-explicit-any
    console.log((denoJson as any).version);
    Deno.exit(0);
  }

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
      "  -e, --exclude-glob       Exclude ignore files matching the provied",
      "                           pattern.",
      '                           (default: "**/node_modules")',
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

  const files = Array.from(discoverIgnoreFiles({
    directory: args.dir,
    ignoreFileGlobPattern: Array.isArray(args.glob) ? args.glob : [args.glob],
    excludeGlobPattern: Array.isArray(args["exclude-glob"])
      ? args["exclude-glob"]
      : [args["exclude-glob"]],
  }));

  const content = flattenIgnoreFiles(files, {
    baseDirectory: args.dir,
    skipSourceComments: args["skip-source-comments"],
    stripComments: args["strip-comments"],
    stripWhitespace: args["strip-whitespace"],
  });

  if (args.remove) {
    for (const file of files) {
      assert(file.isFile);
      Deno.removeSync(file.path);
    }
  }

  if (args.out === false) {
    Deno.stdout.write(new TextEncoder().encode(content));
  } else {
    Deno.writeTextFile(args.out, content);
  }
}
