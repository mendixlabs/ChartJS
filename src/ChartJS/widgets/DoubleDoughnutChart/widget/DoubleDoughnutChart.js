/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global mx, mendix, require, console, define, module, logger, window */
/*mendix */
(function () {
    'use strict';

    // Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
    require([

        'dojo/_base/declare', 'dojo/_base/lang', 'dojo/query', 'dojo/on', 'dojo/html', 'dojo/dom-geometry', 'dojo/dom-style', 'ChartJS/widgets/Core'

    ], function (declare, lang, domQuery, on, html, domGeom, domStyle, _core) {

        // Declare widget.
        return declare('ChartJS.widgets.DoubleDoughnutChart.widget.DoubleDoughnutChart', [ _core ], {

            // Variables
            _ctx1 : null,
            _ctx2 : null,
            _chartDD : null,

            // Template path
            templatePath: require.toUrl('ChartJS/templates/chartjs_dd.html'),

            _createCtx : function () {
                this._ctx1 = this.canvasNode.getContext("2d");
                this._ctx2 = this.canvasNodeDD.getContext("2d");
            },

            _processData : function () {
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
                    _set = null,
                    point = {};

                sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

                for (j = 0; j < sets.length; j++) {
                    set = sets[j];
                    if (set.nopoints === true) {
                        // No points found!
                        console.log(this.id + ' - empty dataset');
                    } else {
                        point = {};
                        points = [];
                        set.points = this._sortArrayMx(set.points, this.sortingxvalue);
                        for (i = 0; i < set.points.length; i++) {
                            color = set.points[i].get(this.seriescolor);
                            highlightcolor = set.points[i].get(this.serieshighlightcolor);
                            label = set.points[i].get(this.seriesylabel);
                            point = {
                                label : label,
                                color: (this.seriesColorNoReformat === false) ? this._hexToRgb(color, "0.5") : color,
                                highlight: (this.seriesColorNoReformat === false) ? this._hexToRgb(highlightcolor, "0.75") : highlightcolor,
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
                }
                this._chartData.labels = ylabels;

                this._createChart(this._chartData);

                this._createLegend(false);
            },

            datasetAdd : function (dataset, datapoints) {
                var set = {
                    dataset : dataset,
                    sorting : +(dataset.get(this.datasetsorting))
                };
                if (datapoints.length === 1) {
                    set.point = datapoints[0];
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

                this._executeMicroflow(this.datasourcemf, lang.hitch(this, function (objs) {
                    var obj = objs[0], // Chart object is always only one.
                        j = null,
                        dataset = null,
                        pointguids = null;

                    this._data.object = obj;

                    // Retrieve datasets
                    mx.data.get({
                        guids : obj.get(this._dataset),
                        callback : lang.hitch(this, function (datasets) {
                            var set = {};

                            this._datasetCounter = datasets.length;
                            this._data.datasets = [];

                            for (j = 0; j < datasets.length; j++) {
                                dataset = datasets[j];
                                pointguids = dataset.get(this._datapoint);
                                if (typeof pointguids === "string" && pointguids !== '') {
                                    pointguids = [pointguids];
                                }
                                if (typeof pointguids !== "string") {
                                    mx.data.get({
                                        guids : pointguids,
                                        callback : lang.hitch(this, this.datasetAdd, dataset)
                                    });
                                } else {
                                    // No points found
                                    set = {
                                        dataset : dataset,
                                        sorting : +(dataset.get(this.datasetsorting)),
                                        nopoints : true
                                    };
                                    this._data.datasets.push(set);
                                    this._datasetCounter--;
                                }
                            }

                        })
                    });
                }), this._mxObj);

            },

            _createChart : function (data) {

                domStyle.set(this.domNode, 'position', 'relative');

                this._chart = new this._chartJS(this._ctx1).Doughnut(data.datasets[0].data, {

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
                    legendTemplate : this.legendTemplate

                });

                var pos = domGeom.position(this.canvasNode),
                    w = (pos.w / this.percentageInnerCutoutStart),
                    h = (pos.h / this.percentageInnerCutoutStart),
                    l = ((pos.w - w) / 2),
                    t = ((pos.h - h) / 2);

                domStyle.set(this.canvasContainerDD, 'width', w + 'px');
                domStyle.set(this.canvasContainerDD, 'height', h + 'px');
                domStyle.set(this.canvasContainerDD, 'position', 'absolute');
                domStyle.set(this.canvasContainerDD, 'left', l + 'px');
                domStyle.set(this.canvasContainerDD, 'top', t + 'px');

                console.log(w + ' - ' + h);

                this._chartDD = new this._chartJS(this._ctx2).Doughnut(data.datasets[1].data, {

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
                    legendTemplate : this.legendTemplate

                });

                on(window, 'resize', lang.hitch(this, function () {
                    
                    this._chart.resize(lang.hitch(this, function () {
                        
                        var pos = domGeom.position(this.canvasNode),
                            w = (pos.w / this.percentageInnerCutoutStart),
                            h = (pos.h / this.percentageInnerCutoutStart),
                            l = ((pos.w - w) / 2),
                            t = ((pos.h - h) / 2);

                        domStyle.set(this.canvasContainerDD, 'width', w + 'px');
                        domStyle.set(this.canvasContainerDD, 'height', h + 'px');
                        domStyle.set(this.canvasContainerDD, 'position', 'absolute');
                        domStyle.set(this.canvasContainerDD, 'left', l + 'px');
                        domStyle.set(this.canvasContainerDD, 'top', t + 'px');

                    }));
                    
                    this._resize();
                }));

                // Set the con
                html.set(this._numberNode, this._data.object.get(this.numberInside));
                this._resize();
                
                // Add class to determain chart type
                this._addChartClass('chartjs-double-doughnut-chart');

                if (this.onclickmf) {
                    on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
                }
            }
        });
    });

}());