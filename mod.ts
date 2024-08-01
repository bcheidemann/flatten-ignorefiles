/**
 * @module
 * This module contains functions for programatically discovering, parsing and
 * flattening ignore files.
 *
 * @example
 * ```ts
 * import { discoverIgnoreFiles, flattenIgnoreFiles } from "jsr:@bcheidemann/flatten-ignorefiles";
 *
 * const files = discoverIgnoreFiles({
 *  // Options
 * });
 *
 * const content = flattenIgnoreFiles(files, {
 *  // Options
 * });
 *
 * console.log(content);
 * ```
 */

import { type WalkEntry, walkSync } from "jsr:@std/fs/walk";
import { type GlobOptions, globToRegExp } from "jsr:@std/path/glob-to-regexp";
import { joinGlobs } from "jsr:@std/path/join-globs";
import { relative } from "jsr:@std/path/relative";
import { dirname } from "jsr:@std/path/dirname";
import { assert } from "jsr:@std/assert";

const NEWLINE_NODE: Node = {
  kind: "whitespace",
  text: "\n",
};

/** Options for `discoverIgnoreFiles`. */
export type DiscoverIgnoreFilesOptions = {
  /** The directory in which to search for ignore files. */
  directory?: string | URL;
  /** The glob patterns used to search for ignore files. */
  ignoreFileGlobPattern?: string[];
  /** Exclude ignore files matching the provied patterns. */
  excludeGlobPattern?: string[];
  /** Options to modify glob syntax and behaviour. */
  globOptions?: GlobOptions;
};

/** Searches a directory for ignore files. */
export function discoverIgnoreFiles({
  directory = ".",
  ignoreFileGlobPattern = ["**/.gitignore"],
  excludeGlobPattern = ["**/node_modules"],
  globOptions,
}: DiscoverIgnoreFilesOptions): IterableIterator<WalkEntry> {
  return walkSync(directory, {
    includeDirs: false,
    match: ignoreFileGlobPattern.map((pattern) =>
      globToRegExp(pattern, globOptions)
    ),
    skip: excludeGlobPattern.map((pattern) =>
      globToRegExp(pattern, globOptions)
    ),
  });
}

/** Options for `flattenIgnoreFiles`. */
export type FlattenIgnoreFilesOptions = {
  /** The directory relative to which the resulting glob entries will be evaluated. */
  baseDirectory: string;
  /** Add comments indicating the source file for each section of the flattened output file. */
  skipSourceComments?: boolean;
  /** Remove whitespace from source files. */
  stripWhitespace?: boolean;
  /** Remove comments from source files. */
  stripComments?: boolean;
  /** Options to modify glob syntax and behaviour. */
  globOptions?: GlobOptions;
};

/** Flattens a list of ignore files into a single ignore file. Use `flattenIgnoreFiles` to discover ignore files in a directory. */
export function flattenIgnoreFiles(
  files: IterableIterator<WalkEntry> | Array<WalkEntry>,
  {
    baseDirectory = ".",
    globOptions,
    skipSourceComments = false,
    stripWhitespace = false,
    stripComments = false,
  }: FlattenIgnoreFilesOptions,
): string {
  const flattenedNodes: Node[] = [];

  for (const file of files) {
    assert(file.isFile);

    const relativePath = relative(baseDirectory, file.path);

    if (!skipSourceComments) {
      flattenedNodes.push(
        NEWLINE_NODE,
        { kind: "comment", text: `### ${relativePath}\n` },
      );
    }

    let nodes = unstableParseIgnoreFile(file.path);

    if (stripComments) {
      nodes = nodes.filter((node) => node.kind !== "comment");
    }

    if (stripWhitespace) {
      nodes = nodes.flatMap((node) => {
        switch (node.kind) {
          case "comment":
            return [node];
          case "entry":
            return [node, NEWLINE_NODE];
          case "whitespace":
            return [];
        }
      });
    }

    for (const node of nodes) {
      if (node.kind === "entry") {
        node.glob = joinGlobs([dirname(relativePath), node.glob], globOptions);
      }
    }

    flattenedNodes.push(...nodes);
  }

  if (!skipSourceComments) {
    // Remove the leading whitespace
    flattenedNodes.shift();
  }

  return flattenedNodes.map(unstableEmitNode).join("");
}

/** Unstable. Ignore file comment AST node. */
export type CommentNode = {
  kind: "comment";
  /** The full text of the commnet. Includes the leading "#". */
  text: string;
};

/** Unstable. Ignore file whitespace AST node. */
export type WhitespaceNode = {
  kind: "whitespace";
  /** The whitespace text. */
  text: string;
};

/** Unstable. Ignore file entry AST node. */
export type EntryNode = {
  kind: "entry";
  /** If the entry is negated i.e. it starts with a "!". */
  negated: boolean;
  /** The glob string for the entry. */
  glob: string;
};

export type Node = CommentNode | WhitespaceNode | EntryNode;

/** Unstable. Parse an ignore file to AST nodes. */
export function unstableParseIgnoreFile(path: string): Node[] {
  const content = Deno.readTextFileSync(path);

  return content.split("\n").flatMap(unstableParseIgnoreFileLine);
}

/** Unstable. Parse a single line of an ignore file to AST nodes. */
export function unstableParseIgnoreFileLine(line: string): Node[] {
  const lineTrimmed = line.trim();

  if (lineTrimmed.length === 0) {
    return [{
      kind: "whitespace",
      text: line + "\n",
    }];
  }

  if (lineTrimmed.startsWith("#")) {
    return [
      {
        kind: "comment",
        text: line + "\n",
      },
    ];
  }

  const nodes: Node[] = [];

  const whitespaceCountStart = line.length - line.trimStart().length;
  const whitespaceCountEnd = line.length - line.trimEnd().length;

  if (whitespaceCountStart !== 0) {
    nodes.push({
      kind: "whitespace",
      text: line.substring(0, whitespaceCountStart),
    });
  }

  const negated = lineTrimmed.startsWith("!");

  nodes.push({
    kind: "entry",
    negated,
    glob: negated ? lineTrimmed.substring(1) : lineTrimmed,
  });

  if (whitespaceCountEnd !== 0) {
    nodes.push({
      kind: "whitespace",
      text: line.substring(line.length - whitespaceCountEnd),
    });
  }

  nodes.push(NEWLINE_NODE);

  return nodes;
}

/** Unstable. Emit an ignore file AST node as a string. */
export function unstableEmitNode(node: Node): string {
  switch (node.kind) {
    case "comment":
      return node.text;
    case "entry":
      return (node.negated ? "!" : "") + node.glob;
    case "whitespace":
      return node.text;
  }
}
