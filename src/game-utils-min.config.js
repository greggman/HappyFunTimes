const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './game-utils.js',
    output: {
        path: path.join(__dirname, '../Assets/WebPlayerTemplates/HappyFunTimes/3rdparty'),
        filename: 'game-utils-min.js',
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                side_effects: false,
            },
            output: {
                comments: false,
            },
        }),
    ],
};


