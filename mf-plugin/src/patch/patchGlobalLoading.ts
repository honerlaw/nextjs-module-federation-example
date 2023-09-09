import { Compilation, Compiler, Template } from "webpack";
import { PLUGIN_NAME } from "../constant";

const TARGET = `var __webpack_exports__ = __webpack_require__("./src/index.ts");`

/**
 * This basically wraps the export in a Proxy object, this prevents __webpack_require__ from being called prematurely / before its
 * actually used by a NextJS page (and thus before react is loaded into the global space).
 */
export async function patchGlobalLoading(compilation: Compilation, compiler: Compiler, assets: { [key: string]: any }) {
    const assetKeys = Object.keys(assets)
    for(const assetKey of assetKeys) {
        const source = assets[assetKey]
        if (!source || assetKey.indexOf('main.js') === -1) {
            continue
        }

        console.log('[patchGlobalLoading]', assetKey)

        const { ReplaceSource } = compiler.webpack.sources
        const newSource = new ReplaceSource(source, PLUGIN_NAME)

        const start = newSource.source().indexOf(TARGET)
        const end = start + TARGET.length
        if (start === -1) {
            return
        }

        // we need to append some stuff to the bottom
        const template = Template.asString([
            `var proxyObj = {};`,
            `var proxyHandler = { get: function(target, prop, receiver) { return typeof window.React !== "undefined" && __webpack_require__('./src/index.ts')[prop] } };`,
            `var __webpack_exports__ = { externalsProxy: new Proxy(proxyObj, proxyHandler) };`,
        ])

        newSource.replace(start, end, template, PLUGIN_NAME)

        await compilation.updateAsset(assetKey, newSource)
    }
}