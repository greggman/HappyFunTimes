const webpack = require('webpack');
const path = require('path');
var plugins = require('webpack-load-plugins')();

module.exports = {
    entry: './hft.js',
    output: {
        path: path.join(__dirname, '../dist'),
        filename: 'hft.js',
    },
}

