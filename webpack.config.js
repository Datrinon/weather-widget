/* eslint-disable no-undef */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // entry: './src/index.js',
  mode: 'development',
  entry: {
    index: './src/js/index.js',
  },
  devtool: 'inline-source-map',
  devServer: {
      contentBase: './dist',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Weather Conduit',
    })
  ],
  output: {
    // filename: 'bundle.js',
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/weather-widget/',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource', 
      },
      {
        test: /\.txt$/i,
        type: 'asset/source',
      },
      {
        test: /\.(csv)$/i,
        loader: 'csv-loader',
        options: {
          dynamicTyping: true,
          header: true,
          skipEmptyLines: true
        }
      },
    ],
  },
};