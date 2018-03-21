const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const extractCSS = new ExtractTextPlugin('./dist/css/[name].css');

const path = require('path');

const sassPaths = [
    'bower_components/normalize.scss/sass',
    'bower_components/foundation-sites/scss',
    'bower_components/motion-ui/src'
];

const config = {
    entry: './src/main.ts',
    devtool: 'inline-source-map',
    watch: false,
    output: {
        path: path.resolve(__dirname, '../theme/static'),
        filename: 'js/main.js'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader",
                        options: {
                            sourceMap: false
                        }
                    }, {
                        loader: "css-loader",
                        options: {
                            sourceMap: false
                        }
                    }, {
                        loader: "sass-loader",
                        options: {
                            includePaths: sassPaths,
                            sourceMap: true
                        }
                    }]
            }]
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: './bower_components/jquery/dist/jquery.js', to: './js/'},
            {from: './bower_components/what-input/dist/what-input.js', to: './js/'},
            {from: './bower_components/foundation-sites/dist/js/foundation.js', to: './js/'}
        ])
    ]
};

module.exports = config;
