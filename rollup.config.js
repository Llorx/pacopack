import FS from "fs";

import dts from "rollup-plugin-dts";
import { terser } from "rollup-plugin-terser";
import nodePolyfills from "rollup-plugin-node-polyfills";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import inject from "@rollup/plugin-inject";

try {
    FS.rmSync("./lib", { recursive: true });
} catch (e) {}

export default [{
    input: "./src/index.ts",
    output: [{
        file: __dirname + "/lib/pacopack.mjs",
        sourcemap: true,
        format: "es"
    }, {
        file: __dirname + "/lib/pacopack.min.mjs",
        format: "es",
        plugins: [terser()]
    }, {
        file: __dirname + "/lib/pacopack.js",
        sourcemap: true,
        format: "cjs"
    }, {
        file: __dirname + "/lib/pacopack.min.js",
        format: "cjs",
        plugins: [terser()]
    }],
    plugins: [
        commonjs(),
        typescript({ tsconfig: "./tsconfig.build.json" })
    ]
}, {
    input: "./src/index.ts",
    output: [{
        file: __dirname + "/lib/pacopack.browser.js",
        sourcemap: true,
        format: "umd",
        name: "window",
        extend: true,
        plugins: []
    }, {
        file: __dirname + "/lib/pacopack.browser.min.js",
        format: "umd",
        name: "window",
        extend: true,
        plugins: [terser()]
    }],
    plugins: [
        nodePolyfills(),
        inject({ Buffer: ["buffer", "Buffer"] }),
        commonjs(),
        typescript({ tsconfig: "./tsconfig.build.json" })
    ]
}, {
    input: "./src/index.ts",
    output: {
        file: __dirname + "/types/index.d.ts",
        format: "es"
    },
    plugins: [
        dts()
    ]
}]