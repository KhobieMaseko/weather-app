const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new Dotenv({
      systemvars: true, // Load system environment variables as well
      safe: true, // Load '.env.example' to verify required variables are present
    }),
    new CopyWebpackPlugin({
        patterns: [
            {
                from: 'src/assets/icons',
                to: 'icons',
                noErrorOnMissing: true
            }
        ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        type: 'asset/resource',
        generator: {
            filename: 'icons/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
            filename: 'fonts/[name][ext]'
        }
      },
    ],
  },
  devServer: {
    static: './dist',
    hot: true,
  },
  mode: 'development',
};
