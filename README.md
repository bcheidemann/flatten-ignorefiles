[![JSR](https://jsr.io/badges/@bcheidemann/flatten-ignorefiles)](https://jsr.io/@bcheidemann/flatten-ignorefiles)
[![JSR](https://img.shields.io/npm/v/flatten-ignorefiles)](https://www.npmjs.com/package/flatten-ignorefiles)

# flatten-ignorefiles

A CLI utility to recursively discover ignore files, and flatten them into a single file.

## Installation

### Deno

```sh
deno install -g --allow-read --allow-write jsr:@bcheidemann/flatten-ignorefiles -n flatten-ignorefiles
```

### NPM

```sh
npm install -g flatten-ignorefiles
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

### Use Case: Flatten and remove recursive .gitignore files

The following command will flatten all recursive `.gitignore` files into a
single root file, deleting the other files.

```sh
$ flatten-ignorefiles --out .gitignore --remove
```

### Use Case: Convert recursive .gitignore files into a non-recursive .dockerignore file

The following command will flatten all recursive `.gitignore` files into a
single root `.dockerignore` file, preserving the `.gitignore` files.

```sh
$ flatten-ignorefiles --out .dockerignore --remove
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
