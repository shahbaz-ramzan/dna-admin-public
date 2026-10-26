const webpack = require('webpack')
const dotenv = require('dotenv')
const path = require('path')

module.exports = {
    plugins: [
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(dotenv.config({ path: path.resolve(__dirname, '.env') }).parsed || {}),
        }),
    ],
}
