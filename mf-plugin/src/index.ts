import { Compiler } from "webpack"
import { MFPluginOptions, PLUGIN_NAME } from "./constant"
import { patchReact } from "./patch/patchReact"
import { patchRemotes } from "./patch/patchRemotes"

export class MFPlugin {

    public constructor(private readonly options: MFPluginOptions) {}

    apply(compiler: Compiler) {
        // we only want to expose modules in the external host runtime
        if (!this.options.isExternalHost) {
            return
        }

        compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
            }, async (assets) => {
                await patchReact(compilation, compiler, assets)

                // await patchRemotes(compilation, compiler, assets, this.options.remotes)
            })
        })
    }

}

export default MFPlugin