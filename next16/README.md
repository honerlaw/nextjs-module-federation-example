# Module Federation on Next.js 16: runtime-only spike

A follow-up to the Next 13 example in the repo root. Next 16 makes Turbopack the
default bundler, so the old approach no longer applies: a webpack plugin plus
patching `window.React = __webpack_require__(...)` into page bundles.

This spike skips build-time federation in the host entirely. The **host is a
plain Turbopack Next 16.4 app with an empty `next.config.ts`**. Federation
happens at runtime through `@module-federation/enhanced/runtime`. The remote is
an ordinary Rspack MF build.

> **Not officially supported.** Next.js has never supported Module Federation,
> in the App Router or otherwise. This spike uses no Next federation API,
> because none exists. It relies on Next implementation details (described
> below) that can change in any release. See [the landscape](#the-next-16-landscape-as-of-nov-2026)
> for the options Vercel supports.

## Running

Node 20+ required (tested on 24). Use three terminals:

```sh
cd remote && npm i && npm run build && npm run serve   # assets on :4001
cd host   && npm i && npm run dev                      # Next on :3000
```

## Verifying

`verify/check.mjs` runs the checks below against a running host. It uses
`playwright-core` with your installed **Google Chrome**, so there's no browser
download.

```sh
cd verify && npm i && npm run check                    # against dev on :3000

# production build too:
cd host && npm run build && npx next start --port 3001
cd verify && HOST=http://localhost:3001 npm run check
```

Expected output: 7 ✓ lines and `all checks passed`. To check by hand instead:

1. `/rsc`: the teal box says "Hello RSC — rendered by the remote". Click
   between `/client` and `/rsc` in the nav. The Network tab shows **no**
   requests to `:4001` on `/rsc`.
2. `/client`: view source and you'll find `Remote counter: <span …>5</span>`,
   which shows it was server-rendered. In the page, increment works. The
   Network tab shows exactly `remoteEntry.js` + `src_Counter_jsx.js` from
   `:4001`.
3. `/broken`: returns a 500, and the server logs "Invalid hook call".

| Route     | What it shows                                                                                   | Verified (dev + `next build`/`start`)                  |
| --------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `/rsc`    | A Server Component `await`s a remote module and renders it with the `react-server` React         | ✅ HTML + RSC payload. Client-side nav loads 0 remote JS |
| `/client` | A remote stateful `Counter` is SSR'd to HTML, then hydrated in the browser                      | ✅ SSR shows `5`, two clicks give `7`, 2 remote requests |
| `/broken` | The same `Counter` rendered directly inside an RSC                                              | ❌ by design: "Invalid hook call"                       |

## How it works

### 1. There are three Reacts, and each needs its own federation instance

In the App Router, a module can be compiled into three environments:

| env       | where   | React build                       | can run                         |
| --------- | ------- | --------------------------------- | ------------------------------- |
| `rsc`     | Node    | `react-server` condition, no hooks | server components               |
| `ssr`     | Node    | regular                           | `"use client"` components → HTML |
| `browser` | browser | regular                           | hydration + interactivity       |

`host/lib/federation.ts` is compiled once per environment. It creates one MF
instance per environment and puts *that environment's* `react` and
`react/jsx-runtime` into the share scope through `shared: { react: { lib: () => React } }`.
This replaces the old `externals: { react: "var React" }` and `window.React` hack.
The remote declares `import: false` for React, so it cannot bundle its own copy.
The spike working at all shows the sharing is correct.

### 2. `rsc` and `ssr` share one Node process, so containers must be isolated

MF caches loaded containers on `globalThis[entryGlobalName]`, which defaults to
the remote's name. If nothing is changed, the SSR layer reuses the container the
RSC layer already initialised with the `react-server` React, and hooks break.
The fix is a per-environment `entryGlobalName: "remote__rsc" | "remote__ssr"`.
For this to work, the node remote build has to export the container as
`module.exports` (`library: { type: "commonjs-module" }` with **no** `name`).

### 3. RSC → remote client component needs a host-owned boundary

A Server Component can't render a remote `"use client"` component directly. RSC
serialises client components as *references* into Next's client-reference
manifest, and modules from a remote aren't in that manifest. So the server
references `host/components/RemoteClient.tsx`, a host client component, and
passes it `{ id, props }`. Props must be serialisable. That component does
`use(loadRemoteComponent(id))`. SSR renders the remote to HTML with the SSR
React, and the browser loads the browser build and hydrates. This is the same
pattern as `TestStateComp` in the old example, now made explicit.

### 4. Remote Node chunks are fetched over HTTP

The remote's node build includes `@module-federation/node/runtimePlugin`. The
host's Node process fetches `remoteEntry.js` and evaluates it with `vm`, and the
remote fetches its own chunks the same way. The host bundler is not involved.

## Gotchas found while building this

- **Infinite load loop in the browser.** When `loadRemote` rejects and you evict
  the cached promise, every `use()` re-render starts a new load. I hit ~5,000
  requests for `remoteEntry.js` before fixing it. Keep rejected promises cached
  for a while.
- **Browser `entryGlobalName` must match the remote's library var.** Here that
  is `var remote`. Only the server environments get the per-layer suffix.
- **Stale containers live on `globalThis`.** After changing the remote's export
  shape, the dev server has to be restarted.
- **SWC in development mode emits `react/jsx-dev-runtime`.** That gets bundled
  into the remote as a private copy unless you share it or set
  `development: false`.
- **`/client` gets statically prerendered by `next build`.** The remote's SSR
  HTML is frozen at build time. Mark routes dynamic or revalidate when remotes
  deploy.
- There's a noisy but harmless `ERR_INVALID_FILE_URL_HOST` log. Node tries to
  read a source map for the vm-evaluated `remoteEntry.js`.

## Limits of this approach

- **A remote *server* component can't contain a remote *client* component.**
  `ServerSafe` can't render an interactive child that comes from the remote,
  because nothing registers that child in the host's client-reference manifest.
  Your options are:
  - Split the server and client parts into separate exposes and compose them in the host.
  - Use an approach where the remote renders its own RSC payload (see below).
- No HMR across the boundary. CSS, types, version negotiation and a production
  caching/CDN strategy are not covered here.
- Next's own modules (`next/link`, `next/navigation`) aren't shared. A remote
  that imports them would get its own copy.

## The Next 16 landscape (as of Nov 2026)

| Option | Status | Notes |
| ------ | ------ | ----- |
| `@module-federation/nextjs-mf` | Deprecated, **Pages Router only**, peers stop at Next 15 | The maintainer said it would be dropped from CI around the end of 2026. It fails the build if it detects `app/`. |
| Webpack MF plugin with `next dev/build --webpack` | Still possible: the `webpack()` key and `--webpack` flag exist in 16.4.6 | You're back to the old hand-built webpack plugin against Next's internal layers, with no upstream support. |
| **Runtime MF (this spike)** | Works today with Turbopack | Component-level, with RSC, SSR and CSR as shown above. You own the layer and boundary glue. |
| Native Turbopack MF (`experimental.turbopackModuleFederation`) | **Not merged.** vercel/next.js#97625 (consume) and #97626 (expose) are open, and not in 16.5 canary | Worth watching. Whether it integrates with client-reference manifests is unknown. |
| Vercel `remote-components` | 0.4.x, marked "work in progress" | Each remote is a full Next app that renders its own HTML and RSC payload. The host embeds it and hydrates with `createFromReadableStream`, swapping in the host's React and `next/*`. It relies on Next config hooks (`turbopack.chunkLoadingGlobal`, `experimental.turbopackSharedRuntime`, `reactBrowserBailout`, `compiler.defineServer`) that exist in 16.4. This is the only approach that handles a remote RSC tree with client islands. |
| Multi-zones / `@vercel/microfrontends` | Stable | Route-level only, no component composition. |
