const { MFPlugin } = require('../mf-plugin/lib')

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (
        config,
        { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
      ) => {

        if (isServer) {

          // simply require in the bundle for the server
          config.externals.push({
            "test-lib": `var require(process.cwd() + "/mf-assets/test_lib/server/main.js")`
          })
        } else {

          // components are mounted globally, and managed through a Proxy
          config.externals.push({
            "test-lib": `var {
              StateComp: window.externalsProxy.StateComp,
              NoStateComp: window.externalsProxy.NoStateComp
            }`
          })
        }

        // will patch the pages to expose react
        config.plugins.push(new MFPlugin({
          isExternalHost: true
        }))

        // Important: return the modified config
        return config
      },
}

module.exports = nextConfig