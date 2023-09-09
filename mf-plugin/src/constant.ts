import { container } from "webpack"

export type MFPluginOptions = ConstructorParameters<typeof container.ModuleFederationPlugin>[0] & {
    isExternalHost?: boolean
    isServer?: boolean
}

export const PLUGIN_NAME = 'MFPlugin'
