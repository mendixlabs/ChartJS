const webpack = require('webpack');
const path = require('path');
const fs = require('fs-extra');
const readDir = require('fs-readdir-recursive');

const BabiliPlugin = require('babili-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const XMLWebpackPlugin = require('xml-webpack-plugin');
const ZipPlugin = require('webpack-archive-plugin');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const env = process.env.WEBPACK_ENV;
const pkg = require('./package.json');
const version = pkg.version;

const widgetConfig = pkg.widget;
const packageName = widgetConfig.package;
const widgetFolder = widgetConfig.filesFolder;
const name = pkg.name;

const srcDir = 'src';
const rootDir = `src/${packageName}`;
const widgetDir = `${rootDir}/widgets`;

const buildDir = 'build';
const mpkDir = 'dist';

fs.ensureDirSync(buildDir);
fs.ensureDirSync(mpkDir);

const entry = {};
const externals = [
    /^mxui\/|^mendix\/|^dojo\/|^dijit\//,
    {
        dojoBaseDeclare: 'dojo/_base/declare'
    },
    {
        widgetBase: 'mxui/widget/_WidgetBase'
    },
];

readDir(widgetDir)
    .filter(file => file.indexOf('.js') !== -1)
    .filter(file => {
        return widgetConfig.libraries || (!widgetConfig.libraries && file.indexOf('Libraries') === -1);
    })
    .filter(file => {
        return widgetConfig.core || (!widgetConfig.core && file.indexOf('Core') === -1);
    })
    .forEach(e => {
        const core = e.replace('.js', '');
        const obj = {};
        entry[e.replace('.js', '')] = path.join(__dirname, widgetDir, e);
        obj[ core ] = `${packageName}/${widgetFolder}/${core}`;
        externals.push(obj);
    });

const packageXml = {
    template: path.join(__dirname, 'widgetpackage.template.xml.ejs'),
    filename: 'package.xml',
    data: {
        packageName,
        version,
        widgetFolder,
        files: []
    }
};

const copyFiles = [];

readDir(rootDir)
    .forEach(file => {
        const parsed = path.parse(file);
        if (file.indexOf('.xml') !== -1) {
            packageXml.data.files.push(file);
            copyFiles.push({
                from: path.join(rootDir, file),
                to: path.join(__dirname, buildDir, packageName, parsed.dir)
            });
        }
        if (parsed.base === 'preview.jpg') {
            copyFiles.push({
                from: path.join(rootDir, file),
                to: path.join(__dirname, buildDir, packageName, parsed.dir)
            });
        }
    });

const webpackDefinitions = {
    version,
    packageName,
    widgetFolder
};

if (widgetConfig.libraries) {
    // externals.push({
    //     Libraries: `${packageName}/${widgetFolder}/Libraries`
    // });
}

if (widgetConfig.core) {
    // externals.push({
    //     Core: `${packageName}/${widgetFolder}/Core`
    // });
}

const webpackConfig = {
    target: 'web',
    entry,
    output: {
        libraryTarget: 'amd',
        path: path.resolve(__dirname, buildDir),
        publicPath: '',
        filename: `${packageName}/${widgetFolder}/[name].js`
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve('node_modules', 'widget-base-helpers')
                ],
                loader: [
                    'babel-loader',
                    'eslint-loader'
                ]
            },
            {
                test: /\.(css|scss)$/,
                loaders: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader!sass-loader!postcss-loader'
                })
            },
            {
                test: /\.template\.html$/,
                use: 'raw-loader'
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loader: [
                    'url-loader?limit=10000',
                    {
                        loader: 'img-loader',
                        options: {
                            // enabled: process.env.NODE_ENV === 'production',
                            gifsicle: {
                                interlaced: false
                            },
                            mozjpeg: {
                                progressive: true,
                                arithmetic: false
                            },
                            optipng: true, // disabled
                            pngquant: {
                                floyd: 0.5,
                                speed: 2
                            },
                            svgo: {
                                plugins: [
                                    {
                                        removeTitle: true
                                    },
                                    {
                                        convertPathData: false
                                    }
                                ]
                            }
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'config': JSON.stringify(webpackDefinitions),
            'version': JSON.stringify(version),
            'packageName': JSON.stringify(packageName),
        }),
        new ExtractTextPlugin({
            filename:  (getPath) => {
                let q = getPath(`[name]`);
                const name = q.split('/')[ 0 ];

                let p = getPath(`${packageName}/${widgetFolder}/[name].css`);
                p = p.replace(`${name}.css`, `ui/${name}.css`);
                p = path.relative(__dirname, p);

                return p;
            }
        }),
        new CopyWebpackPlugin(copyFiles),
        new XMLWebpackPlugin({
            files: [packageXml]
        }),
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss: () => [autoprefixer]
            }
        }),
        new ZipPlugin({
            entries: [{
                src: path.join(__dirname, './build'),
                dist: '/',
            }],
            output: path.join(__dirname, `./${mpkDir}/${packageName}`),
            ext: 'mpk',
            format: 'zip'
        })
    ],
    externals,
    resolve: {
        alias: {
            '@': path.join(__dirname, 'src')
        }
    },
}

if (env !== 'production') {
    webpackConfig.devtool = 'source-map';
} else {
    webpackConfig.plugins.push(new BabiliPlugin({}, {
        test: /\.js$/,
    }));
    webpackConfig.module.loaders.push({
        test: /\.js$/,
        enforce: 'pre',
        exclude: /(node_modules|bower_components|\.spec\.js)/,
        use: [
            {
                loader: 'webpack-strip-block'
            }
        ]
    });
}

module.exports = webpackConfig;
