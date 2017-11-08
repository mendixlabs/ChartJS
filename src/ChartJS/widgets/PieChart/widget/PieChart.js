define([
    "dojo/_base/declare",
    "ChartJS/widgets/Core",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/on",
    "dojo/html",
    "dojo/dom-style"
], function(declare, Core, lang, domQuery, on, html, domStyle) {
    "use strict";

    return declare("ChartJS.widgets.PieChart.widget.PieChart", [Core], {

        _chartType: "pie",

        _processData: function() {
            logger.debug(this.id + "._processData");
            var sets = [],
                chartData = [],
                points = null,
                set = {
                    points: []
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
                    label: label,
                    backgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.5") : color,
                    hoverBackgroundColor: (this.seriesColorReduceOpacity) ? this._hexToRgb(color, "0.75") : highlightcolor,
                    value: +(set.dataset.get(this.seriesylabel))
                };

                chartData.push(point);
                this._activeDatasets.push({
                    obj: set.dataset,
                    dataset: point,
                    idx: j,
                    active: true
                });
            }

            this._createChart(chartData);
            this._createLegend(true);
        },

        _loadData: function() {
            this._loadDataSingleSet();
        },

        _createChart: function(data) {
            logger.debug(this.id + "._createChart");
            if (this._chart) {
                var set = this._createDataSets(data);
                this._chart.stop();
                this._chart.data.datasets = set.datasets;
                this._chart.data.labels = set.labels;
                this._chart.update(1000);
                this._chart.bindEvents(); // tooltips otherwise won't work
            } else {
                var chartProperties = {
                    type: this._chartType,
                    data: this._createDataSets(data),
                    options: this._chartOptions({

                        elements: {
                            arc: {
                                //String - The colour of each segment stroke
                                borderColor: this.segmentStrokeColor,
                                //Number - The width of each segment stroke
                                borderWidth: this.segmentShowStroke ? this.segmentStrokeWidth : 0
                            }
                        },

                        animation: {
                            //Boolean - Whether we animate the rotation of the Doughnut
                            animateRotate: this.animateRotate,
                            //Boolean - Whether we animate scaling the Doughnut from the centre
                            animateScale: this.animateScale,
                            duration: this.animationDuration,
                            //String - Animation easing effect
                            easing: this.animationEasing
                        },

                        legendCallback: this._legendAlternateCallback,

                        //cutOut of pie
                        cutoutPercentage: 0, //always zero for Pie chart

                        animation: {
                            onComplete: lang.hitch(this, this._animationComplete)
                        }
                    })
                };
                this._chart = new this._chartJS(this._ctx, chartProperties);

                if (this.numberInside && this._numberNode) {
                    var content = this._data.object.get(this.numberInside);
                    html.set(this._numberNode, content !== null ? content.toString() : "");
                }

                // Add class to determain chart type
                this._addChartClass("chartjs-pie-chart");

                on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
            }
        }
    });
});

require(["ChartJS/widgets/PieChart/widget/PieChart"]);
