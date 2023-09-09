import { Compiler } from "webpack"
import { MFPluginOptions, PLUGIN_NAME } from "./constant"
import { patchReact } from "./patch/patchReact"
import { patchGlobalLoading } from "./patch/patchGlobalLoading"

export class MFPlugin {

    public constructor(private readonly options: MFPluginOptions = {}) {}

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
            }, async (assets) => {

                // we need to expose react on the window so that our remote dependencies can use it,
                // the host is considered the shell app
                if (this.options.isExternalHost) {
                    await patchReact(compilation, compiler, assets)
                } else {

                    // since our libraries are injected into the window using a global, but we need to wait for the
                    // react dependency to be available, so instead, we inject a proxy that will only require
                    // the dependencies when they are actually called
                    await patchGlobalLoading(compilation, compiler, assets)
                }
            })
        })
    }

}

export default MFPlugin