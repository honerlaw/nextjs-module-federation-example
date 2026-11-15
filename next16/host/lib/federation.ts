import * as React from "react";
import * as JSXRuntime from "react/jsx-runtime";
import { createInstance, type ModuleFederation } from "@module-federation/enhanced/runtime";

/**
 * Next 16 App Router has THREE React environments, and this file is compiled into each
 * one separately:
 *
 *   rsc     — server, `react-server` condition (no hooks, no state)
 *   ssr     — server, regular React (renders "use client" components to HTML)
 *   browser — client, regular React (hydration + interactivity)
 *
 * `import * as React from "react"` resolves to a *different* React in each, so each
 * environment gets its own federation instance whose share scope provides *that* React.
 * rsc and ssr run in the same Node process, so they also need distinct
 * `entryGlobalName`s — otherwise MF's globalThis container cache hands the SSR layer
 * a remote that was initialised with the react-server React.
 */
export type FederationEnv = "rsc" | "ssr" | "browser";

export const env: FederationEnv =
  typeof window !== "undefined" ? "browser" : "useState" in React ? "ssr" : "rsc";

const REMOTE_ORIGIN = process.env.NEXT_PUBLIC_REMOTE_ORIGIN ?? "http://localhost:4001";

const entry = env === "browser" ? `${REMOTE_ORIGIN}/browser/remoteEntry.js` : `${REMOTE_ORIGIN}/node/remoteEntry.js`;

const g = globalThis as unknown as { __mfHosts?: Partial<Record<FederationEnv, ModuleFederation>> };
g.__mfHosts ??= {};

export const federation: ModuleFederation = (g.__mfHosts[env] ??= createInstance({
  name: `host_${env}`,
  remotes: [
    {
      name: "remote",
      entry,
      // browser: must match the remote's `var remote` library name.
      // server: rsc + ssr share one process, so give each its own container slot.
      entryGlobalName: env === "browser" ? "remote" : `remote__${env}`,
      type: env === "browser" ? "global" : "commonjs-module",
    },
  ],
  shared: {
    react: {
      version: React.version,
      lib: () => React,
      shareConfig: { singleton: true, requiredVersion: false },
    },
    "react/jsx-runtime": {
      version: React.version,
      lib: () => JSXRuntime,
      shareConfig: { singleton: true, requiredVersion: false },
    },
  },
}));

const cache = new Map<string, Promise<React.ComponentType<any>>>();

/** Load a federated module's default export. Promise is cached so it is safe to `use()`. */
export function loadRemoteComponent<P = {}>(id: string): Promise<React.ComponentType<P>> {
  let p = cache.get(id);
  if (!p) {
    p = federation.loadRemote<{ default: React.ComponentType<any> }>(id).then((m) => {
      if (!m?.default) throw new Error(`Remote module "${id}" has no default export`);
      return m.default;
    });
    // Keep a rejected promise cached briefly. Evicting it immediately makes every
    // `use()` re-render start a new load: an infinite request loop in the browser.
    p.catch(() => setTimeout(() => cache.delete(id), 10_000));
    cache.set(id, p);
  }
  return p as Promise<React.ComponentType<P>>;
}
