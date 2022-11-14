import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import externals from "rollup-plugin-node-externals";
import strip from "@rollup/plugin-strip";

export default defineConfig({
  input: "./src/index.ts",
  output: [
    {
      file: "dist/index.umd.js",
      format: "umd",
      sourcemap: true,
      name: "messenger",
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "./dist/index.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
  ],
  plugins: [
    json(),
    externals({
      devDeps: false,
    }),
    resolve(),
    commonjs(),
    typescript(),
    strip(),
  ],
  watch: {
    exclude: "node_modules/**",
  },
});
