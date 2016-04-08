/*jslint white:true, nomen: true, plusplus: true */
/*global mx, mendix, require, console, define, module, logger, window */
/*mendix */
define([

    "dojo/_base/declare", "dojo/_base/lang", "dojo/query", "dojo/on", "ChartJS/widgets/Core"

], function (declare, lang, domQuery, on, _core) {
    "use strict";

    // Declare widget.
    return declare("ChartJS.widgets.RadarChart.widget.RadarChart", [ _core ], {

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
                maxpoints= 0;

            this._chartData.datasets = [];
            this._chartData.labels = [];

            sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

            for (j = 0; j < sets.length; j++) {
                set = sets[j];
                if(set.points.length > maxpoints) {
                    maxpoints = set.points.length;
                }
            }

            for(j = 0; j < sets.length; j++) {
                set = sets[j];

                points = [];

                if (set.points.length === 0) {
                    for(k=0; k < maxpoints; k++) {
                        points.push(0);
                    }
                    logger.warn(this.id + " - empty dataset");
                    continue;
                }

                set.points = this._sortArrayMx(set.points, this.sortingxvalue);
                color = set.dataset.get(this.seriescolor);
                highlightcolor = this.serieshighlightcolor ? set.dataset.get(this.serieshighlightcolor) : color;

                label = set.dataset.get(this.datasetlabel);

                for(i = 0;i < set.points.length; i++) {
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
                    backgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.5") : color,
                    borderColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.5") : color,
                    pointColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.8") : color,
                    hoverBackgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.75") : highlightcolor,
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

                this._chart = new this._chartJS(this._ctx, {
                    type: "radar",
                    data: data,
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

                        //Boolean - Whether to show lines for each scale point
                        scaleShowLine : this.scaleShowLine,

                        //Boolean - Whether we show the angle lines out of the radar
                        angleShowLineOut : this.angleShowLineOut,

                        //Boolean - Whether to show labels on the scale
                        scaleShowLabels : this.scaleShowLabels,

                        //String - Colour of the angle line
                        angleLineColor : this.angleLineColor,

                        //Number - Pixel width of the angle line
                        angleLineWidth : this.angleLineWidth,

                        //String - Point label font declaration
                        pointLabelFontFamily : this.pointLabelFontFamily,

                        //String - Point label font weight
                        pointLabelFontStyle : this.pointLabelFontStyle,

                        //Number - Point label font size in pixels
                        pointLabelFontSize : this.pointLabelFontSize,

                        //String - Point label font colour
                        pointLabelFontColor : this.pointLabelFontColor,

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

                        legendCallback : this._legendCallback,

                        // Show tooltips at all
                        showTooltips : this.showTooltips,

                        // maintainAspectRatio
                        maintainAspectRatio : this.maintainAspectRatio,

                        // Custom tooltip?
                        customTooltips : false //lang.hitch(this, this.customTooltip)

                    }
                });

                // Add class to determain chart type
                this._addChartClass("chartjs-radar-chart");

                if (this.onclickmf) {
                    on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
                }
            }
        }
    });
});
require(["ChartJS/widgets/RadarChart/widget/RadarChart"], function () {
    "use strict";
});
