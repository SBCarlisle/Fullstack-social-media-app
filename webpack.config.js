const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './frontend-js/main.js', //where our js files live
  output: {
    filename: 'main-bundled.js',
    path: path.resolve(__dirname, 'public') //where we want to export them to
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', //use babel
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}