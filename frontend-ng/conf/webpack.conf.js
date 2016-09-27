const webpack = require('webpack');
const conf = require('./gulp.conf');
const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');

module.exports = {
  module: {
    loaders: [
      {
        test: /.json$/,
        loaders: [
          'json',
        ],
      },
      {
        test: /\.scss$/,
        loaders: [
          'style',
          'css?sourceMap',
          'postcss?sourceMap',
          'sass?sourceMap',
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: [
          'ng-annotate',
          'babel',
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png)\w*/,
        loader: 'file',
      },
      {
        test: /.html$/,
        exclude: /items.renderer.html/,
        loaders: [
          'html',
        ],
      },
    ],
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor-[hash].js',
      minChunks: Infinity,
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({
      template: conf.path.src('index.html'),
      inject: true,
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      'window.$': 'jquery',
      'window.jQuery': 'jquery',
      'window.dragula': 'dragula',
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(conf.paths.npmDir, 'dragula', 'dist', 'dragula.min.js'),
        to: path.resolve(conf.paths.dist, 'scripts', 'dragula.min.js'),
      }, {
        from: path.resolve(conf.paths.npmDir, 'dragula', 'dist', 'dragula.min.css'),
        to: path.resolve(conf.paths.dist, 'styles', 'dragula.min.css'),
      }, {
        from: conf.path.src('i18n'),
        to: path.resolve(conf.paths.dist, 'i18n'),
      }, {
        from: conf.path.src('images'),
        to: path.resolve(conf.paths.dist, 'images'),
      }, {
        from: conf.path.src('styles', 'hippo-iframe.css'),
        to: path.resolve(conf.paths.dist, 'styles', 'hippo-iframe.css'),
      },
    ]),
  ],
  postcss: [
    autoprefixer({
      browsers: [
        'last 1 Chrome versions',
        'last 1 Firefox versions',
        'Safari >= 8',
        'Explorer >= 11',
      ],
    }),
  ],
  debug: true,
  devtool: 'cheap-module-eval-source-map',
  output: {
    filename: '[name]-[hash].js',
    path: path.join(process.cwd(), conf.paths.dist),
    publicPath: '/cms/angular/hippo-cm/',
    pathinfo: true,
  },
  entry: {
    vendor: conf.vendors,
    app: [`./${conf.path.src('index')}`],
  },
};
