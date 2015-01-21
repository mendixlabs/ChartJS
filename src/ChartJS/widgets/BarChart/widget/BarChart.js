/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global mx, mendix, require, console, define, module, logger, window */
/*mendix */
(function () {
    'use strict';

    // Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
    require([

        'dojo/_base/declare', 'dojo/_base/lang', 'dojo/query', 'dojo/on', 'ChartJS/widgets/Core'

    ], function (declare, lang, domQuery, on, _core) {

        // Declare widget.
        return declare('ChartJS.widgets.BarChart.widget.BarChart', [ _core ], {

            // Overwrite functions from _core here...

            _processData : function () {
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
                    _set = null;

                sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

                for (j = 0; j < sets.length; j++) {
                    set = sets[j];

                    if (set.nopoints === true) {
                        // No points found!
                        console.log(this.id + ' - empty dataset');
                    } else {

                        points = [];
                        set.points = this._sortArrayMx(set.points, this.sortingxvalue);
                        color = set.dataset.get(this.seriescolor);
                        highlightcolor = set.dataset.get(this.serieshighlightcolor);
                        label = set.dataset.get(this.datasetlabel);

                        for (i = 0; i < set.points.length; i++) {
                            if (!xlabelsSet) {
                                xlabels.push(set.points[i].get(this.seriesxlabel));
                            }

                            points.push(+(set.points[i].get(this.seriesylabel))); // Convert to integer, so the stackedbar doesnt break!
                        }

                        if (!xlabelsSet) {
                            xlabelsSet = true;
                        }

                        _set = {
                            label : label,
                            fillColor: (this.seriesColorNoReformat === false) ? this._hexToRgb(color, "0.5") : color,
                            strokeColor: (this.seriesColorNoReformat === false) ? this._hexToRgb(color, "0.8") : color,
                            pointColor: (this.seriesColorNoReformat === false) ? this._hexToRgb(color, "0.8") : color,
                            highlightFill: (this.seriesColorNoReformat === false) ? this._hexToRgb(color, "0.75") : highlightcolor,
                            highlightStroke: (this.seriesColorNoReformat === false) ? this._hexToRgb(color, "1") : highlightcolor,
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
                this._chartData.labels = xlabels;

                this._createChart(this._chartData);

                this._createLegend(false);
            },

            _createChart : function (data) {

                this._chart = new this._chartJS(this._ctx).Bar(data, {

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
                    legendTemplate : this.legendTemplate

                });

                on(window, 'resize', lang.hitch(this, function () {
                    this._chart.resize();
                }));
                
                // Add class to determain chart type
                this._addChartClass('chartjs-bar-chart');

                if (this.onclickmf) {
                    on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
                }
            }
        });
    });

}());