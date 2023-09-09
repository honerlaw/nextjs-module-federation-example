# Example of Module Federation w/ NextJS

This repo contains an example of how to load a remote component from a remote server into the host NextJS App.

## Features

This tries to use as little custom code as possible to stand up a working example of Module Federation with NextJS that allows for components to be rendered in SSR and CSR as well as sharing the `react` dependency appropriately between the host and remote.

The big caveat with this approach, is that we can not wrap the entire NextJS app with a `bootstrap` file, so we have to treat all imports as async imports using `lazy` and `await import()` to fetch components and utilities.

## Running

1. Run `npm install` in each folder: `mf-plugin`, `test-host`, `test-lib`
2. Run `npm run watch` inside of `mf-plugin`
3. Run `npm run watch` inside of `test-lib`
4. copy the contents from `test-lib/dist` to the `test-host/mf-assets/test_lib` directory (and make it if it doesn't exist)
5. Run `npm run dev` inside of `test-host`

You can then vist the following endpoints to see different example usages

- `http://localhost:3000/mf-ssr` will demonstration RSC working with MF
- `http://localhost:3000/mf-csr` will demonstrate `use client` directive working with MF without state in the federated component
- `http://localhost:3000/mf-csr/stateful` will demonstrate `use client` direction working with a stateful federated component
