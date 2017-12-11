define([
    "dojo/_base/declare",
    "ChartJS/widgets/Core",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/on"
], function(declare, Core, lang, domQuery, on) {
    "use strict";

    return declare("ChartJS.widgets.LineChart.widget.LineChart", [Core], {

        _chartType: "line",

        _processData: function() {
            logger.debug(this.id + "._processData");

            var sets = [],
                points = null,
                set = {
                    points: []
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
                highlightcolor = set.dataset.get(this.serieshighlightcolor);

                label = set.dataset.get(this.datasetlabel);

                for (i = 0; i < set.points.length; i++) {
                    if (!xlabelsSet) {
                        xlabels.push(((this.scaleShowLabelsBottom === true) ? set.points[i].get(this.seriesxlabel) : ""));
                    }

                    var pointvalue = set.points[i].get(this.seriesylabel);
                    if (pointvalue === "") {
                        points.push(null);
                    } else {
                        points.push(+pointvalue); // Convert to number, so the stackedbar doesnt break!
                    }
                    //points.push(+(set.points[i].get(this.seriesylabel))); // Convert to integer, so the stackedbar doesnt break!

                }

                if (!xlabelsSet) {
                    xlabelsSet = true;
                }

                var _bezier;
                try {
                    _bezier = parseFloat(this.bezierCurveTension);
                } catch (e) {
                    _bezier = 0.4;
                }

                _set = {
                    label: (this.scaleShowLabelsBottom === true) ? label : "",
                    backgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.2") : color,
                    borderColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.5") : color,
                    pointColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.8") : color,
                    pointBorderColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.8") : color,
                    pointHoverBackgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.75") : highlightcolor,
                    pointHoverBorderColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(highlightcolor, "1") : highlightcolor,
                    data: points,
                    fill: this.seriescolorfilled,
                    tension: this.bezierCurve ? _bezier : 0

                };
                this._chartData.datasets.push(_set);
                this._activeDatasets.push({
                    dataset: _set,
                    idx: j,
                    active: true
                });
            }
            this._chartData.labels = xlabels;

            //logger.debug(this.id + " Created LineChart data");
            //logger.debug(this.id + "  " + JSON.stringify(this._chartData));

            this._createChart(this._chartData);

            this._createLegend(false);
        },

        _createChart: function(data) {
            logger.debug(this.id + "._createChart");

            if (this._chart) {
                this._chart.stop();
                this._chart.data.datasets = data.datasets;
                this._chart.data.labels = data.labels;
                this._chart.update(1000);
                this._chart.bindEvents(); // tooltips otherwise won't work
            } else {
                //logger.debug("stacked:" + this.isStacked);

                var ticksOptions = {
                    fontFamily: this._font,
                    beginAtZero: this.scaleBeginAtZero,
                    display: this.scaleShowLabels,
                    callback: lang.hitch(this, function(value) {
                        var round = parseInt(this.roundY);
                        if (!isNaN(round) && round >= 0) {
                            return Number(value).toFixed(round);
                        }
                        return value;
                    })
                };
                if (this.maxYValue) {
                    ticksOptions.max = this.maxYValue * 1;
                }

                var chartProperties = {
                    type: this._chartType,
                    data: data,
                    options: this._chartOptions({

                        scales: {
                            yAxes: [{
                                display: this.scaleShow,
                                //If stacked is set to true, the Y-axis needs to be stacked for it to work
                                stacked: this.isStacked,
                                scaleLabel: {
                                    display: (this.yLabel !== "") ? true : false,
                                    labelString: (this.yLabel !== "") ? this.yLabel : "",
                                    fontFamily: this._font
                                },
                                gridLines: {
                                    display: this.scaleShowHorizontalLines,
                                    color: this.scaleGridLineColor,
                                    lineWidth: this.scaleLineWidth
                                },
                                ticks: ticksOptions
                            }],
                            xAxes: [{
                                display: this.scaleShow,
                                scaleLabel: {
                                    display: (this.xLabel !== "") ? true : false,
                                    labelString: (this.xLabel !== "") ? this.xLabel : "",
                                    fontFamily: this._font
                                },
                                gridLines: {
                                    display: this.scaleShowVerticalLines,
                                    color: this.scaleGridLineColor,
                                    lineWidth: this.scaleLineWidth
                                },
                                type: "category",
                                id: "x-axis-0",
                                ticks: {
                                    display: this.scaleShowLabelsBottom,
                                    fontFamily: this._font,
                                    maxTicksLimit: this.maxTickSize > 0 ? this.maxTickSize : null
                                }
                            }]
                        },

                        elements: {
                            point: {
                                radius: this.pointDot ? this.pointRadius : 0,
                                borderWidth: this.pointDot ? this.pointBorderWidth : 0,
                                hitRadius: this.pointHitRadius,
                                hoverRadius: this.pointHoverRadius,
                                hoverBorderWidth: this.pointHoverBorderWidth
                            }
                        },

                        //Boolean - Whether or not to render as a stacked chart
                        stacked: this.isStacked,

                        //Boolean - Whether to show a stroke for datasets
                        datasetStroke: this.datasetStroke,

                        //Number - Pixel width of dataset stroke
                        datasetStrokeWidth: this.datasetStrokeWidth,

                        //Boolean - Whether to fill the dataset with a colour
                        datasetFill: this.datasetFill,

                        legendCallback: this._legendCallback,

                        //The scale line width
                        scaleLineWidth: this.scaleLineWidth,

                        //The scale line color
                        scaleLineColor: this.scaleLineColor,

                        animation: {
                            onComplete: lang.hitch(this, this._animationComplete)
                        }
                    })
                };

                if (this.scaleBeginAtZero) {
                    chartProperties.options.scales.yAxes[0].ticks.suggestedMin = 0;
                }

                this._chart = new this._chartJS(this._ctx, chartProperties);

                this.connect(window, "resize", lang.hitch(this, function() {
                    this._resize();
                }));

                // Add class to determain chart type
                this._addChartClass("chartjs-line-chart");

                on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
            }
        }

    });
});

require(["ChartJS/widgets/LineChart/widget/LineChart"]);
