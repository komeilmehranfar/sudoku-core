import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  target: "es2020",
  outExtension: ({ format }) => ({ js: format === "esm" ? ".mjs" : ".cjs" }),
});
