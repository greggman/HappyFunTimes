const webpack = require('webpack');
const path = require('path');
var plugins = require('webpack-load-plugins')();

module.exports = {
  entry: './src/hft.js',
  output: {
    path: path.join(__dirname, '../dist'),
    filename: 'hft.js',
    library: 'HFT',
    libraryTarget: 'umd',
  },
};


