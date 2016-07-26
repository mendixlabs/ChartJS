/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global mx, mendix, require, console, define, module, logger, window */
/*mendix */
define([

    "dojo/_base/declare", "dojo/_base/lang", "dojo/query", "dojo/on", "ChartJS/widgets/Core"

], function (declare, lang, domQuery, on, _core) {
    "use strict";

    // Declare widget.
    return declare("ChartJS.widgets.PolarChart.widget.PolarChart", [ _core ], {

        _chartType: "polarArea",

        _processData : function () {
            logger.debug(this.id + "._processData");
            var sets = [],
                chartData = [],
                points = null,
                set = {
                    points : []
                },
                color = "",
                highlightcolor = "",
                point = null,
                label = "",
                j = null;

            this._chartData.datasets = [];
            this._chartData.labels = [];
            sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

            for (j = 0; j < sets.length; j++) {
                set = sets[j];

                points = [];
                color = set.dataset.get(this.seriescolor);
                highlightcolor = this.serieshighlightcolor ? set.dataset.get(this.serieshighlightcolor) : color;

                label = set.dataset.get(this.datasetlabel);
                point = {
                    label : label,
                    backgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.5") : color,
                    hoverBackgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.75") : highlightcolor,
                    value : +(set.dataset.get(this.seriesylabel))
                };

                chartData.push(point);
                this._activeDatasets.push({
                    obj: set.dataset,
                    dataset : point,
                    idx : j,
                    active : true
                });
            }

            this._createChart(chartData);

            this._createLegend(true);
        },

        _loadData : function () {
            logger.debug(this.id + "._loadData");

            this._executeMicroflow(this.datasourcemf, lang.hitch(this, function (objs) {
                var obj = objs[0], // Chart object is always only one.
                    j = null,
                    dataset = null;

                this._data.object = obj;

                // Retrieve datasets
                mx.data.get({
                    guids : obj.get(this._dataset),
                    callback : lang.hitch(this, function (datasets) {
                        var set = null;
                        this._data.datasets = [];

                        for (j = 0; j < datasets.length; j++) {
                            dataset = datasets[j];

                            set = {
                                dataset : dataset,
                                sorting : +(dataset.get(this.datasetsorting))
                            };
                            this._data.datasets.push(set);
                        }
                        this._processData();
                    })
                });
            }), this._mxObj);

        },

        _createChart : function (data) {
            logger.debug(this.id + "._createChart");

            this._chart = new this._chartJS(this._ctx, {
                type: this._chartType,
                data: this._createDataSets(data),
                options: {
                    title: {
                        display: (this.chartTitle !== "") ? true : false,
                        text: (this.chartTitle !== "") ? this.chartTitle : "",
                        fontFamily: this._font,
                        fontSize: this.titleSize
                    },

                    responsive : this.responsive,
                    responsiveAnimationDuration : (this.responsiveAnimationDuration > 0 ? this.responsiveAnimationDuration : 0),
                    tooltips : {
                        enabled : this.showTooltips
                    },
                    legend: {
                        display: this.showLegend,
                        labels : { fontFamily : this._font }
                    },
                    scale: {
                        ticks: {
                            yAxes: [{
                                ticks: {
                                    fontFamily: this._font,
                                    beginAtZero: this.scaleBeginAtZero
                                }
                            }]
                        }
                    },

                    //Boolean - Show a backdrop to the scale label
                    scaleShowLabelBackdrop : this.polarScaleShowLabelBackdrop,

                    //String - The colour of the label backdrop
                    scaleBackdropColor : this.polarScaleBackdropColor,

                    //Number - The backdrop padding above & below the label in pixels
                    scaleBackdropPaddingY : this.polarScaleBackdropPaddingY,

                    //Number - The backdrop padding to the side of the label in pixels
                    scaleBackdropPaddingX : this.polarScaleBackdropPaddingX,

                    //Boolean - Show line for each value in the scale
                    scaleShowLine : this.polarScaleShowLine,

                    //Boolean - Stroke a line around each segment in the chart
                    segmentShowStroke : this.segmentShowStroke,

                    //String - The colour of the stroke on each segement.
                    segmentStrokeColor : this.segmentStrokeColor,

                    //Number - The width of the stroke value in pixels
                    segmentStrokeWidth : this.segmentStrokeWidth,

                    //Number - Amount of animation steps
                    animationSteps : this.animationSteps,

                    //String - Animation easing effect.
                    animationEasing : this.animationEasing,

                    //Boolean - Whether to animate the rotation of the chart
                    animateRotate : this.animateRotate,

                    //Boolean - Whether to animate scaling the chart from the centre
                    animateScale : this.animateScale,

                    legendCallback : this._legendAlternateCallback,

                    // Show tooltips at all
                    showTooltips : this.showTooltips,

                    // Custom tooltip?
                    customTooltips : false //lang.hitch(this, this.customTooltip)

                }
            });

            this.connect(window, "resize", lang.hitch(this, function () {
                this._resize();
            }));

            // Add class to determain chart type
            this._addChartClass("chartjs-polar-chart");

            on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
        }
    });
});
require(["ChartJS/widgets/PolarChart/widget/PolarChart"], function () {
    "use strict";
});
