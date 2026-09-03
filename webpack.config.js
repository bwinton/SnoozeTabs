const path = require('path');
const webpack = require('webpack');

// mode only accepts production/development, and src/ branches on the injected
// value, so normalise NODE_ENV once and use it for both.
const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development';

module.exports = {
  mode: NODE_ENV,
  devtool: false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  entry: {
    background: './src/background.js',
    'popup/snooze-content': './src/popup/snooze-content.js',
    'lib/confirm-bar': './src/lib/confirm-bar.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
    })
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  // The popup bundles React, moment and the rc-* pickers; its size is expected.
  performance: { hints: false }
};
