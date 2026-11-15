import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PORT = 4001;

// React is provided by the host. `import: false` means the remote never bundles its own
// copy — it MUST get React from the share scope. This replaces the old
// `externals: { react: "var React" }` + `window.React = __webpack_require__(...)` hack.
const shared = {
  react: { singleton: true, import: false, requiredVersion: "^19.0.0" },
  "react/jsx-runtime": { singleton: true, import: false, requiredVersion: "^19.0.0" },
};

const exposes = {
  "./ServerSafe": "./src/ServerSafe.jsx",
  "./Counter": "./src/Counter.jsx",
};

const base = (target) => ({
  mode: "development",
  devtool: false,
  context: import.meta.dirname,
  entry: {},
  resolve: { extensions: [".jsx", ".js"] },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        loader: "builtin:swc-loader",
        options: { jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic", development: false } } } },
      },
    ],
  },
  output: {
    path: path.resolve(import.meta.dirname, "dist", target),
    publicPath: `http://localhost:${PORT}/${target}/`,
    uniqueName: `remote_${target}`,
  },
});

export default [
  {
    ...base("browser"),
    name: "browser",
    target: "web",
    plugins: [new ModuleFederationPlugin({ name: "remote", filename: "remoteEntry.js", exposes, shared, dts: false, manifest: false })],
  },
  {
    ...base("node"),
    name: "node",
    target: "async-node",
    plugins: [
      new ModuleFederationPlugin({
        name: "remote",
        filename: "remoteEntry.js",
        library: { type: "commonjs-module" },
        exposes,
        shared,
        dts: false,
        manifest: false,
        // Lets the remote's *own* chunks be fetched over HTTP when it runs inside the host's Node process.
        runtimePlugins: [require.resolve("@module-federation/node/runtimePlugin")],
      }),
    ],
  },
];
