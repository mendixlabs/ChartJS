define([
    "dojo/_base/declare",
    "ChartJS/widgets/Core",
    "dojo/_base/lang",
    "dojo/on"
], function (declare, Core, lang, on) {
    "use strict";

    return declare("ChartJS.widgets.BarChart.widget.BarChart", [ Core ], {

        _chartType: "bar",

        _processData : function () {
            logger.debug(this.id + "._processData");
            var sets = [],
                points = null,
                set = {
                    points : []
                },
                xlabels = [],
                xlabelsSet = false,
                color = "",
                highlightcolor = "",
                label = "",
                j = null,
                i = null,
                k = null,
                _set = null,
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

                points = [];
                if (set.points.length === 0) {
                    for (k = 0; k < maxpoints; k++) {
                        points.push(0);
                    }
                    logger.warn(this.id + " - empty dataset");
                    continue;
                }

                set.points = this._sortArrayMx(set.points, this.sortingxvalue);
                color = set.dataset.get(this.seriescolor);
                highlightcolor = this.serieshighlightcolor ? set.dataset.get(this.serieshighlightcolor) : color;

                label = set.dataset.get(this.datasetlabel);

                for (i = 0; i < set.points.length; i++) {
                    if (!xlabelsSet) {
                        xlabels.push(((this.scaleShowLabelsBottom === true) ? set.points[i].get(this.seriesxlabel) : ""));
                    }

                    points.push(+(set.points[i].get(this.seriesylabel))); // Convert to integer, so the stackedbar doesnt break!
                }

                if (!xlabelsSet) {
                    xlabelsSet = true;
                }

                _set = {
                    label : label,
                    backgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.5") : color,
                    borderColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.8") : color,
                    hoverBackgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(highlightcolor, "0.75") : highlightcolor,
                    hoverBorderColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(highlightcolor, "1") : highlightcolor,
                    data : points
                };
                this._chartData.datasets.push(_set);
                this._activeDatasets.push({
                    dataset : _set,
                    idx : j,
                    active : true
                });

            }
            this._chartData.labels = xlabels;

            this._createChart(this._chartData);

            this._createLegend(false);
        },

        _createChart : function (data) {
            logger.debug(this.id + "._createChart");

            if (this._chart) {
                this._chart.stop();
                this._chart.data.datasets = data.datasets;
                this._chart.data.labels = data.labels;
                this._chart.update(1000);
                this._chart.bindEvents(); // tooltips otherwise won't work
            } else {
                var chartProperties = {
                    type: this._chartType,
                    data: data,
                    options: this._chartOptions({

                        scales : {
                            xAxes: [{
                                display: this.scaleShow,
                                scaleLabel: {
                                    display: (this.xLabel !== "") ? true : false,
                                    labelString: (this.xLabel !== "") ? this.xLabel : "",
                                    fontFamily: this._font
                                },
                                ticks : { fontFamily: this._font, },
                                gridLines: {
                                    display: this.scaleShowVerticalLines,
                                    color: this.scaleGridLineColor,
                                    lineWidth: this.scaleLineWidth
                                },
                            }],
                            yAxes: [{
                                display: this.scaleShow,
                                scaleLabel: {
                                    display: (this.yLabel !== "") ? true : false,
                                    labelString: (this.yLabel !== "") ? this.yLabel : "",
                                    fontFamily: this._font
                                },
                                ticks : {
                                    fontFamily: this._font,
                                    beginAtZero: this.scaleBeginAtZero,
                                    display: this.scaleShowLabels
                                },
                                gridLines: {
                                    display: this.scaleShowHorizontalLines,
                                    color: this.scaleGridLineColor,
                                    lineWidth: this.scaleLineWidth
                                },
                            }]
                        },

                        //Boolean - If there is a stroke on each bar
                        barShowStroke : this.barShowStroke,

                        //Number - Pixel width of the bar stroke
                        barStrokeWidth : this.barStrokeWidth,

                        //Number - Spacing between each of the X value sets
                        barValueSpacing : this.barValueSpacing,

                        //Number - Spacing between data sets within X values
                        barDatasetSpacing : this.barDatasetSpacing,

                        legendCallback : this._legendCallback,

                        //The scale line width
                        scaleLineWidth : this.scaleLineWidth,

                        //The scale line color
                        scaleLineColor : this.scaleLineColor
                    })
                };

                if (this.scaleBeginAtZero) {
                    chartProperties.options.scales.yAxes[0].ticks.suggestedMin = 0;
                    chartProperties.options.scales.yAxes[0].ticks.suggestedMax = 4;
                }

                this._chart = new this._chartJS(this._ctx, chartProperties);

                this.connect(window, "resize", lang.hitch(this, function () {
                    this._resize();
                }));

                // Add class to determain chart type
                this._addChartClass("chartjs-bar-chart");

                on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
            }
        }
    });
});

require(["ChartJS/widgets/BarChart/widget/BarChart"], function () {
    "use strict";
});
