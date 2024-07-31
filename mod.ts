import { type WalkEntry, walkSync } from "@std/fs/walk";
import { type GlobOptions, globToRegExp } from "@std/path/glob-to-regexp";
import { joinGlobs } from "@std/path/join-globs";
import { relative } from "@std/path/relative";
import { dirname } from "@std/path/dirname";
import { assert } from "@std/assert";

const NEWLINE_NODE: Node = {
  kind: "whitespace",
  text: "\n",
};

/** Options for `discoverIgnoreFiles`. */
export type DiscoverIgnoreFilesOptions = {
  /** The directory in which to search for ignore files. */
  directory?: string | URL;
  /** The glob pattern used to search for ignore files. */
  ignoreFileGlobPattern?: string;
  /** Options to modify glob syntax and behaviour. */
  globOptions?: GlobOptions;
};

/** Searches a directory for ignore files. */
export function discoverIgnoreFiles({
  directory = ".",
  ignoreFileGlobPattern = "**/.gitignore",
  globOptions,
}: DiscoverIgnoreFilesOptions): IterableIterator<WalkEntry> {
  return walkSync(directory, {
    includeDirs: false,
    match: [globToRegExp(ignoreFileGlobPattern, globOptions)],
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
  files: IterableIterator<WalkEntry>,
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
        { kind: "comment", text: `### ${relativePath}\n` },
        NEWLINE_NODE,
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

  return flattenedNodes.map(unstableEmitNode).join("");
}

export type CommentNode = {
  kind: "comment";
  text: string;
};

export type WhitespaceNode = {
  kind: "whitespace";
  text: string;
};

export type EntryNode = {
  kind: "entry";
  negated: boolean;
  glob: string;
};

export type Node = CommentNode | WhitespaceNode | EntryNode;

/**
 * Parse an ignore file to AST nodes.
 *
 * This function is unstable.
 */
export function unstableParseIgnoreFile(path: string): Node[] {
  const content = Deno.readTextFileSync(path);

  return content.split("\n").flatMap(unstableParseIgnoreFileLine);
}

/**
 * Parse a single line of an ignore file to AST nodes.
 *
 * This function is unstable.
 */
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

/**
 * Emit an ignore file AST node as a string.
 *
 * This function is unstable.
 */
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
