# flatten-ignorefiles

A CLI utility to recursively discover ignore files, and flatten them into a single file.

## Installation

```sh
deno install --allow-read --allow-write -g jsr:@bcheidemann/flatten-ignorefiles -n flatten-ignorefiles
```

## Usage

```sh
$ flatten-ignorefiles --help
Usage: flatten-ignorefiles [options]

Options:
  -h, --help               Print command line options and usage.
  -d, --dir                The base directory to search for ignore files.
                           (default: ".")
  -g, --glob               The glob pattern used to search for ignore
                           files.
                           (default: "**/.gitignore")
  -e, --exclude-glob       Exclude ignore files matching the provied
                           pattern.
                           (default: "**/node_modules")
  -o, --out                The output file path for the flattened ignore
                           file. If not provided, the flattened file will
                           be logged to stdout. Relative to --dir.
                           (optional)
  -r, --remove             Remove the discovered ignore files.
                           (default: false)
  --skip-source-comments   If omitted, comments will be added indicating
                           the source file for each section of the
                           flattened output file.
                           (default: false)
  --strip-whitespace       Removes the whitespace from source files.
                           (default: false)
  --strip-comments         Removes the comments from source files.
                           (default: false)
```

## Programatic Usage

```ts
import { discoverIgnoreFiles, flattenIgnoreFiles } from "jsr:@bcheidemann/flatten-ignorefiles";

const files = discoverIgnoreFiles({
  // Options
});

const content = flattenIgnoreFiles(files, {
  // Options
});

console.log(content);
```
