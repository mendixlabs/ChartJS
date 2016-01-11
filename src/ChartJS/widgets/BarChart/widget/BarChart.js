/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global mx, mendix, require, console, define, module, logger, window */
/*mendix */
define([

    "dojo/_base/declare", "dojo/_base/lang", "dojo/on", "ChartJS/widgets/Core"

], function (declare, lang, on, _core) {
    "use strict";

    // Declare widget.
    return declare("ChartJS.widgets.BarChart.widget.BarChart", [ _core ], {

        // Overwrite functions from _core here...

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
                    logger.debug(this.id + " - empty dataset");
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
                    fillColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.5") : color,
                    strokeColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.8") : color,
                    pointColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.8") : color,
                    highlightFill: (this.seriesColorReduceOpacity) ? this._hexToRgb(highlightcolor, "0.75") : highlightcolor,
                    highlightStroke: (this.seriesColorReduceOpacity) ? this._hexToRgb(highlightcolor, "1") : highlightcolor,
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
			if (this._chart !== null) {
				this._chart.destroy();
			}

            this._chart = new this._chartJS(this._ctx, {
                type: 'bar',
                data: data,
                options: {

                    //Boolean - Whether to show labels on the scale
                    scaleShowLabels : this.scaleShowLabels,

                    //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
                    scaleBeginAtZero : this.scaleBeginAtZero,

                    //Boolean - Whether grid lines are shown across the chart
                    scaleShowGridLines : this.scaleShowGridLines,

                    //String - Colour of the grid lines
                    scaleGridLineColor : this.scaleGridLineColor,

                    //Number - Width of the grid lines
                    scaleGridLineWidth : this.scaleGridLineWidth,

                    //Boolean - Whether to show horizontal lines (except X axis)
                    scaleShowHorizontalLines: this.scaleShowHorizontalLines,

                    //Boolean - Whether to show vertical lines (except Y axis)
                    scaleShowVerticalLines: this.scaleShowVerticalLines,

                    //Boolean - If there is a stroke on each bar
                    barShowStroke : this.barShowStroke,

                    //Number - Pixel width of the bar stroke
                    barStrokeWidth : this.barStrokeWidth,

                    //Number - Spacing between each of the X value sets
                    barValueSpacing : this.barValueSpacing,

                    //Number - Spacing between data sets within X values
                    barDatasetSpacing : this.barDatasetSpacing,

                    //String - A legend template
                    legendTemplate : this.legendTemplate,

                    //The scale line width
                    scaleLineWidth : this.scaleLineWidth,

                    //The scale line color
                    scaleLineColor : this.scaleLineColor,

                    // maintainAspectRatio
                    maintainAspectRatio : this.maintainAspectRatio,

                    // Show tooltips at all
                    showTooltips : this.showTooltips,

                    // Custom tooltip?
                    customTooltips : false
                }
            });

            this.connect(window, "resize", lang.hitch(this, function () {
                this._resize();
            }));

            // Add class to determain chart type
            this._addChartClass("chartjs-bar-chart");

            if (this.onclickmf) {
                on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
            }
        }
    });
});
require(["ChartJS/widgets/BarChart/widget/BarChart"], function () {
    "use strict";
});
