import { Compilation, Compiler, Template } from "webpack";
import { PLUGIN_NAME } from "../constant";

export async function patchReact(compilation: Compilation, compiler: Compiler, assets: { [key: string]: any }) {
    const assetKeys = Object.keys(assets)
    for(const assetKey of assetKeys) {
        const source = assets[assetKey]
        if (!source || !(assetKey.indexOf('page.js') !== -1 && assetKey.indexOf('static') !== -1)) {
            continue
        }

        console.log('[patchReact]', assetKey)

        const { ReplaceSource } = compiler.webpack.sources
        const newSource = new ReplaceSource(source, PLUGIN_NAME)

        // we need to append some stuff to the bottom
        const template = Template.asString([
            '',
            // `if (typeof window !== "undefined") window.React = __webpack_require__("react");`
            `window.React = __webpack_require__(Object.keys(__webpack_require__.m).find((key) => key.indexOf("dist/compiled/react/index.js") !== -1));`
        ])

        // append the template to the end
        newSource.insert(newSource.source().length - `})();`.length - 1, template, PLUGIN_NAME)

        await compilation.updateAsset(assetKey, newSource)
    }
}