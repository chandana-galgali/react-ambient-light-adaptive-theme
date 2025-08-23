import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/components/AmbientLightThemeProvider.tsx",
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
    },
    {
      file: "dist/index.esm.js",
      format: "es",
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
  ],
  external: ["react", "react-dom"],
};