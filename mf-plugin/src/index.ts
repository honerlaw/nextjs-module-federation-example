import { Compiler, container } from "webpack"
import { MFPluginOptions, PLUGIN_NAME } from "./constant"
import { patchReact } from "./patch/patchReact"
import { NodeFederationPlugin, StreamingTargetPlugin } from "@module-federation/node"

export class MFPlugin {

    public constructor(private readonly options: MFPluginOptions) {}

    apply(compiler: Compiler) {

        const { isExternalHost, isServer, ...opts } = this.options

        if (isServer) {
            new NodeFederationPlugin(opts, {
                ModuleFederationPlugin: container.ModuleFederationPlugin
            }).apply(compiler)

            const { filename, exposes, ...strOpts } = opts
            new StreamingTargetPlugin(strOpts).apply(compiler)
        } else {
            new container.ModuleFederationPlugin(opts).apply(compiler)
        }

        // we only want to expose modules in the external host runtime
        if (!isExternalHost) {
            return
        }

        compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
            }, async (assets) => {
                await patchReact(compilation, compiler, assets)
            })
        })
    }

}

export default MFPlugin