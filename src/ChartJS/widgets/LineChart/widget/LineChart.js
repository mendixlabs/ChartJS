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
        return declare('ChartJS.widgets.LineChart.widget.LineChart', [ _core ], {

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

                this._chartData.datasets = [];
                this._chartData.labels = [];
                
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
                                xlabels.push(((this.scaleShowLabelsBottom === true) ? set.points[i].get(this.seriesxlabel) : ''));
                            }

                            points.push(+(set.points[i].get(this.seriesylabel))); // Convert to integer, so the stackedbar doesnt break!
                        }

                        if (!xlabelsSet) {
                            xlabelsSet = true;
                        }

                        _set = {
                            label : (this.scaleShowLabelsBottom === true) ? label : '',
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

                if (this._chart !== null) {
                    this._chart.destroy();
                }
                
                this._chart = new this._chartJS(this._ctx).Line(data, {

                    //Boolean - Whether to show labels on the scale
                    scaleShowLabels : this.scaleShowLabels,

                    ///Boolean - Whether grid lines are shown across the chart
                    scaleShowGridLines : this.scaleShowGridLines,

                    //String - Colour of the grid lines
                    scaleGridLineColor : this.scaleGridLineColor,

                    //Number - Width of the grid lines
                    scaleGridLineWidth : this.scaleGridLineWidth,

                    //Boolean - Whether to show horizontal lines (except X axis)
                    scaleShowHorizontalLines : this.scaleShowHorizontalLines,

                    //Boolean - Whether to show vertical lines (except Y axis)
                    scaleShowVerticalLines : this.scaleShowVerticalLines,

                    //Boolean - Whether the line is curved between points
                    bezierCurve : this.bezierCurve,

                    //Number - Tension of the bezier curve between points
                    bezierCurveTension : this.bezierCurveTension,

                    //Boolean - Whether to show a dot for each point
                    pointDot : this.pointDot,

                    //Number - Radius of each point dot in pixels
                    pointDotRadius : this.pointDotRadius,

                    //Number - Pixel width of point dot stroke
                    pointDotStrokeWidth : this.pointDotStrokeWidth,

                    //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
                    pointHitDetectionRadius : this.pointHitDetectionRadius,

                    //Boolean - Whether to show a stroke for datasets
                    datasetStroke : this.datasetStroke,

                    //Number - Pixel width of dataset stroke
                    datasetStrokeWidth : this.datasetStrokeWidth,

                    //Boolean - Whether to fill the dataset with a colour
                    datasetFill : this.datasetFill,

                    //String - A legend template
                    legendTemplate : this.legendTemplate,
                    
                    //The scale line width
                    scaleLineWidth : this.scaleLineWidth,
                    
                    //The scale line color
                    scaleLineColor : this.scaleLineColor,
                    
                    // Show tooltips at all
                    showTooltips : this.showTooltips

                });

                // Add class to determain chart type
                this._addChartClass('chartjs-line-chart');

                if (this.onclickmf) {
                    on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
                }
            }
        });
    });

}());