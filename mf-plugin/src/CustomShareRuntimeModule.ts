import { RuntimeModule } from "webpack";

/**
 * In the host app, we inject a runtime module in the config that
 * will expose the webpack modules to the remoteEntry file
 */
export class CustomShareRuntimeModule extends RuntimeModule {

    public constructor() {
        super('custom/share')
    }

    // we don't need this really... we need to expose it at the asset level
    generate(): string | null {
        return `
            if (typeof window === 'undefined') {
                return
            }
            console.log(Object.keys(__webpack_modules__))
            window.React = __webpack_require__('react')
        `
    }

}