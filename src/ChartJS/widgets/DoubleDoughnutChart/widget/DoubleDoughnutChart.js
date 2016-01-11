/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global mx, mendix, require, console, define, module, logger, window */
/*mendix */

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([

    // Client API and DOJO functions
    "dojo/_base/declare", "dojo/_base/lang", "dojo/query", "dojo/on", "dojo/html", "dojo/dom-geometry", "dojo/dom-attr", "dojo/dom-style",

    // External libraries
    "ChartJS/widgets/Core",

    // Templates
    "dojo/text!ChartJS/templates/chartjs_dd.html"

], function (declare, lang, domQuery, on, html, domGeom, domAttr, domStyle,
              _core,
              _chartJSDDTemplate) {
    "use strict";

    // Declare widget.
    return declare("ChartJS.widgets.DoubleDoughnutChart.widget.DoubleDoughnutChart", [ _core ], {

        // Variables
        _ctx1 : null,
        _ctx2 : null,
        _chartDD : null,

        // Template path
        templateString: _chartJSDDTemplate,

        _createCtx : function () {
            logger.debug(this.id + "._createCtx");
            var position = domGeom.position(this.domNode.parentElement, false);
            domAttr.set(this.canvasNode, "id", "canvasid_" + this.id);

            if (position.w > 0 && this.responsive) {
                this.canvasNode.width =  position.w;
                this.canvasNodeDD.width = position.w;
            } else {
                this.canvasNode.width = this.width;
                this.canvasNodeDD.width = this.width;
            }

            if (position.h > 0 && this.responsive) {
                this.canvasNode.height = position.h;
                this.canvasNodeDD.height = position.h;
            } else {
                this.canvasNode.height = this.height;
                this.canvasNodeDD.height = this.height;
            }

            this._ctx1 = this.canvasNode.getContext("2d");
            this._ctx2 = this.canvasNodeDD.getContext("2d");
        },

        _processData : function () {
            logger.debug(this.id + "._processData");
            var sets = [],
                points = null,
                set = {
                    points : []
                },
                ylabels = [],
                ylabelsSet = false,
                color = "",
                highlightcolor = "",
                label = "",
                j = null,
                i = null,
                k = null,
                _set = null,
                point = {},
                maxpoints = 0;

            this._chartData.datasets = [];
            this._chartData.labels = [];
            sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

            for (j = 0; j < sets.length; j++) {
                set = sets[j];
                if (set.points.length > maxpoints) {
                    maxpoints = set.points.length;
                }
            }

            for (j = 0; j < sets.length; j++) {
                set = sets[j];

                point = {};
                points = [];
                if (set.points.length === 0) {
                    for (k = 0; k < maxpoints; k++) {
                        points.push(0);
                    }
                    logger.debug(this.id + " - empty dataset");
                }
                set.points = this._sortArrayMx(set.points, this.sortingxvalue);
                for (i = 0; i < set.points.length; i++) {
                    color = set.points[i].get(this.seriescolor);
                    highlightcolor = this.serieshighlightcolor ? set.dataset.get(this.serieshighlightcolor) : color;

                    label = set.points[i].get(this.seriesylabel);
                    point = {
                        label : label,
                        color: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.5") : color,
                        highlight: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.75") : highlightcolor,
                        value : +(set.points[i].get(this.seriesyvalue))
                    };
                    points.push(point);
                }

                if (!ylabelsSet) {
                    ylabelsSet = true;
                }

                _set = {
                    data : points
                };
                this._chartData.datasets.push(_set);
                this._activeDatasets.push({
                    dataset : _set,
                    idx : j,
                    active : true
                });
            }
            this._chartData.labels = ylabels;

            logger.debug(" CHART DATA - " + this.id);
            logger.debug(this.id + " --- " + JSON.stringify(this._chartData));

            this._createChart(this._chartData);

            this._createLegend(false);
        },

        datasetAdd : function (dataset, datapoints) {
            logger.debug(this.id + ".datasetAdd");
            var set = {
                dataset : dataset,
                sorting : +(dataset.get(this.datasetsorting))
            };
            if (datapoints.length === 1) {
                set.point = datapoints[0];
                set.points = datapoints;
            } else {
                set.points = datapoints;
            }

            this._data.datasets.push(set);

            this._datasetCounter--;
            if (this._datasetCounter === 0) {
                this._processData();
            }
        },

        _loadData : function () {
            logger.debug(this.id + "._loadData");
            this._datasetCounter = 0;
            this._data = {
                object : this._mxObj,
                datasets : []
            };

            this._executeMicroflow(this.datasourcemf, lang.hitch(this, function (objs) {
                var obj = objs[0], // Chart object is always only one.
                    j = null,
                    dataset = null,
                    pointguids = null,
                    createZeroValueEntity = null,
                    errorZeroValueEntity = null;

                this._data.object = obj;
                this._data.datasets = [];

                logger.debug(this.id + " - executed: " + this.datasourcemf + " - " + obj);

                // Retrieve datasets
                mx.data.get({
                    guids : obj.get(this._dataset),
                    callback : lang.hitch(this, function (datasets) {
                        var set = {};

                        logger.debug(this.id + " - length datasets: " + datasets.length);
                        this._datasetCounter = datasets.length;
                        this._data.datasets = [];

                        for (j = 0; j < datasets.length; j++) {
                            dataset = datasets[j];
                            pointguids = dataset.get(this._datapoint);
                            logger.debug(this.id + " - length datasets: " + pointguids);
                            if (typeof pointguids === "string" && pointguids !== "") {
                                pointguids = [pointguids];
                            }
                            if (typeof pointguids !== "string") {
                                mx.data.get({
                                    guids : pointguids,
                                    callback : lang.hitch(this, this.datasetAdd, dataset)
                                });
                            } else {
                                // No points found
                                this.datasetAdd(dataset, []);
                            }
                        }

                    })
                });
            }), this._mxObj);

        },

        _resizeDoubleChart : function () {
            logger.debug(this.id + "._resizeDoubleChart");
            this._chart.resize(lang.hitch(this, function () {

                var pos = domGeom.position(this.canvasNode),
                    w = (pos.w / this.percentageInnerCutoutStart),
                    h = (pos.h / this.percentageInnerCutoutStart),
                    l = ((pos.w - w) / 2),
                    t = ((pos.h - h) / 2);

                domStyle.set(this.canvasContainerDD, "width", w + "px");
                domStyle.set(this.canvasContainerDD, "height", h + "px");
                domStyle.set(this.canvasContainerDD, "position", "absolute");
                domStyle.set(this.canvasContainerDD, "left", l + "px");
                domStyle.set(this.canvasContainerDD, "top", t + "px");

            }));
        },

        _createChart : function (data) {
            logger.debug(this.id + "._createChart");

            domStyle.set(this.domNode, "position", "relative");

            if (this._chart !== null) {
                this._chart.destroy();
                this._chartDD.destroy();
            }

            this._chart = new this._chartJS(this._ctx1).Doughnut(data.datasets[0].data, {

                // Boolean - whether to calculate the aspectratio from the height instead of the width!
                aspectRatioFromHeight : this.aspectRatioFromHeight,

                // Maintain aspect ratio
                maintainAspectRatio : this.maintainAspectRatio,

                //Boolean - Whether we should show a stroke on each segment
                segmentShowStroke : this.segmentShowStroke,

                //String - The colour of each segment stroke
                segmentStrokeColor : this.segmentStrokeColor,

                //Number - The width of each segment stroke
                segmentStrokeWidth : this.segmentStrokeWidth,

                //Number - The percentage of the chart that we cut out of the middle
                percentageInnerCutout : this.percentageInnerCutout, // This is 0 for Pie charts

                //Number - Amount of animation steps
                animationSteps : this.animationSteps,

                //String - Animation easing effect
                animationEasing : this.animationEasing,

                //Boolean - Whether we animate the rotation of the Doughnut
                animateRotate : this.animateRotate,

                //Boolean - Whether we animate scaling the Doughnut from the centre
                animateScale : this.animateScale,

                //String - A legend template
                legendTemplate : this.legendTemplate,

                // Show tooltips at all
                showTooltips : this.showTooltips,

                // Custom tooltip?
                customTooltips : false // lang.hitch(this, this.customTooltip)

            });

            var pos = domGeom.position(this.canvasNode),
                w = (pos.w / this.percentageInnerCutoutStart),
                h = (pos.h / this.percentageInnerCutoutStart),
                l = ((pos.w - w) / 2),
                t = ((pos.h - h) / 2);

            domStyle.set(this.canvasContainerDD, "width", w + "px");
            domStyle.set(this.canvasContainerDD, "height", h + "px");
            domStyle.set(this.canvasContainerDD, "position", "absolute");
            domStyle.set(this.canvasContainerDD, "left", l + "px");
            domStyle.set(this.canvasContainerDD, "top", t + "px");

            logger.debug(this.id + " --- " + w + " - " + h);

            this._chartDD = new this._chartJS(this._ctx2).Doughnut(data.datasets[1].data, {

                // Boolean - whether to calculate the aspectratio from the height instead of the width!
                aspectRatioFromHeight : this.aspectRatioFromHeight,

                // Maintain aspect ratio
                maintainAspectRatio : this.maintainAspectRatio,

                //Boolean - Whether we should show a stroke on each segment
                segmentShowStroke : this.segmentShowStroke,

                //String - The colour of each segment stroke
                segmentStrokeColor : this.segmentStrokeColor,

                //Number - The width of each segment stroke
                segmentStrokeWidth : this.segmentStrokeWidth,

                //Number - The percentage of the chart that we cut out of the middle
                percentageInnerCutout : this.percentageInnerCutoutSecond, // This is 0 for Pie charts

                //Number - Amount of animation steps
                animationSteps : this.animationSteps,

                //String - Animation easing effect
                animationEasing : this.animationEasing,

                //Boolean - Whether we animate the rotation of the Doughnut
                animateRotate : this.animateRotate,

                //Boolean - Whether we animate scaling the Doughnut from the centre
                animateScale : this.animateScale,

                //String - A legend template
                legendTemplate : this.legendTemplate,

                // Show tooltips at all
                showTooltips : this.showTooltips,

                // Custom tooltip?
                customTooltips : false //lang.hitch(this, this.customTooltip)

            });

            on(window, "resize", lang.hitch(this, function () {
                this._resizeDoubleChart();
            }));

            // Set the con
            html.set(this._numberNode, this._data.object.get(this.numberInside));


            // Add class to determain chart type
            this._addChartClass("chartjs-double-doughnut-chart");

            if (this.onclickmf) {
                on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
            }

        }
    });
});
require(["ChartJS/widgets/DoubleDoughnutChart/widget/DoubleDoughnutChart"], function () {
    "use strict";
});
