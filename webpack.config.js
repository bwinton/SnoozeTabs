const path = require('path');
const webpack = require('webpack');

const NODE_ENV = process.env.NODE_ENV || 'development';

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
      'process.env.NODE_ENV': `"${NODE_ENV}"`
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          babelrc: false,
          presets: [ [ 'env', { modules: false } ], 'stage-0', 'react' ],
        }
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
        type: 'javascript/auto'
      }
    ]
  }
};
