import denoJson from "../deno.json" with { type: "json" };
import { build, emptyDir } from "jsr:@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: [
    "./mod.ts",
    {
      kind: "bin",
      name: "flatten-ignorefiles",
      path: "./npm-bin.ts",
    },
  ],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  typeCheck: false,
  test: false,
  package: {
    // package.json properties
    name: "flatten-ignorefiles",
    // deno-lint-ignore no-explicit-any
    version: (denoJson as any).version,
    description:
      "A CLI utility to recursively discover ignore files, and flatten them into a single file.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/bcheidemann/flatten-ignorefiles.git",
    },
    bugs: {
      url: "https://github.com/bcheidemann/flatten-ignorefiles/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
