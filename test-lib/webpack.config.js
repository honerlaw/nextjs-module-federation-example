const path = require('path');
const { MFPlugin } = require('../mf-plugin/lib')

const baseConfig = (isServer, mfPostfix) => ({
    mode: 'development',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist', isServer ? 'server' : 'web'),
        libraryTarget: isServer ? "commonjs-module" : 'global',
    },
    devServer: {
        open: true,
        host: 'localhost',
    },
    plugins: [
        !isServer ? new MFPlugin() : undefined,
    ],
    externals: {
        // Use external version of React
        "react": isServer ? `var require('react')` : `var window.React`,
        "react-dom": isServer ? `var require('react-dom')` : `var ReactDOM`,
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
    },
});

module.exports = [{
    ...baseConfig(false, 'web'),
    name: 'web',
    entry: './src/index.ts',
}, {
    ...baseConfig(true, 'server'),
    name: 'server',
    entry: './src/index.ts',
    target: "async-node",
}]
