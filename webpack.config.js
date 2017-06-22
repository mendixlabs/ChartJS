const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const widgetConfig = {
    entry: {
        BarChart: "./src/ChartJS/widgets/BarChart/widget/BarChart.js",
        DoughnutChart: "./src/ChartJS/widgets/DoughnutChart/widget/DoughnutChart.js",
        LineChart: "./src/ChartJS/widgets/LineChart/widget/LineChart.js",
        PieChart: "./src/ChartJS/widgets/PieChart/widget/PieChart.js",
        PolarChart: "./src/ChartJS/widgets/PolarChart/widget/PolarChart.js",
        RadarChart: "./src/ChartJS/widgets/RadarChart/widget/RadarChart.js",
        StackedBarChart: "./src/ChartJS/widgets/StackedBarChart/widget/StackedBarChart.js"
    },
    output: {
        path: path.resolve(__dirname, "dist/tmp/src"),
        filename: "ChartJS/widgets/[name]/widget/[name].js",
        chunkFilename: "ChartJS/widgets/ChartJS[id].js",
        libraryTarget: "amd",
        publicPath: "widgets/"
    },
    devtool: "source-map",
    externals: [ /^mxui\/|^mendix\/|^dojo\/|^dijit\//, "ChartJS/widgets/Core" ],
    plugins: [
        new CopyWebpackPlugin([
            { from: "src/**/*.xml", to: "../" },
            { from: "src/**/*.html", to: "../" },
            { from: "src/**/*.css", to: "../" },
            { from: "src/**/preview.jpg", to: "../" },
        ], { copyUnmodified: true }),
        new webpack.LoaderOptionsPlugin({ debug: true }),
    ]
};

const sharedConfig = {
    entry: "./src/ChartJS/widgets/Core.js",
    output: {
        path: path.resolve(__dirname, "dist/tmp/src"),
        filename: "ChartJS/widgets/Core.js",
        libraryTarget: "amd",
    },
    devtool: "source-map",
    externals: [ /^mxui\/|^mendix\/|^dojo\/|^dijit\// ],
    plugins: [
        new webpack.LoaderOptionsPlugin({ debug: true })
    ]
};

module.exports = [ widgetConfig, sharedConfig ];
