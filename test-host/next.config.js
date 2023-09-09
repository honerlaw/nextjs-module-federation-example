const { MFPlugin } = require('../mf-plugin/lib')

const promiseTemplate = (isServer, global, url) => {
    if (isServer) {
        return `promise new Promise((resolve, reject) => {
            var http = require('http')
            var fs = require('fs')
            var path = require('path')

            var download = function(url, dir, dest, cb) {
                fs.mkdirSync(dir, { recursive: true })
                var file = fs.createWriteStream(path.resolve(dir, dest))
                http.get(url, function(response) {
                    response.pipe(file)
                    file.on('finish', function() {
                        file.close(cb)
                    })
                })
            }
            var folderPath = "/Users/honerlaw/Development/module-federation/test-host/mf-assets/${global}/server"
            const fileName = "remoteEntry.server.js"
            var filePath = path.resolve(folderPath, fileName)
            // download("${url}", folderPath, fileName, function() {
                resolve(require(filePath))
            // })
        })`
    }

    return `promise new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = "${url}"
      script.onload = () => {
        const proxy = {
          get: (request) => window.${global}.get(request),
          init: (arg) => {
            try {
              return window.${global}.init(arg)
            } catch(e) {
              console.log('remote container already initialized')
            }
          }
        }
        resolve(proxy)
      }
      document.head.appendChild(script);
    })`
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (
        config,
        { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
      ) => {

        // okay so what we need to do is simply say our stuff is externals

        if (isServer) {
          config.externals.push({
            "test-lib": `var require(process.cwd() + "/mf-assets/test_lib/server/main.js")`
          })
        } else {
          config.externals.push({
            "test-lib": `var {
              StateComp: window.StateComp,
              NoStateComp: window.NoStateComp
            }`
          })
          // console.log(config.externals)
        }
        config.plugins.push(new MFPlugin({
          isExternalHost: true,
          isServer,
          remotes: ['test-lib']
        }))

        /*config.plugins.push(new MFPlugin({
            name: 'test_host',
            library: isServer ? { type: "commonjs-module" } : undefined,
            remotes: {
                'test-lib': promiseTemplate(isServer, 'test_lib', `http://localhost:4000/${isServer ? 'server' : 'web'}/remoteEntry.${isServer ? 'server' : 'web'}.js`)
            },
            isExternalHost: true,
            isServer
        }))*/

        // Important: return the modified config
        return config
      },
}

module.exports = nextConfig