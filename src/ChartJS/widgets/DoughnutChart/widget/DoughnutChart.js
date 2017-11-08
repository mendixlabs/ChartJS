define([
    "dojo/_base/declare",
    "ChartJS/widgets/Core",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/on",
    "dojo/html"
], function(declare, Core, lang, domQuery, on, html) {
    "use strict";

    return declare("ChartJS.widgets.DoughnutChart.widget.DoughnutChart", [Core], {

        _chartType: "doughnut",

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

            this._activeDatasets = [];
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
            if (this._chart !== null) {
                this._chart.destroy();
            }
            this._chart = new this._chartJS(this._ctx, {
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

                    //Number - The percentage of the chart that we cut out of the middle
                    cutoutPercentage: this.percentageInnerCutout,

                    animation: {
                        onComplete: lang.hitch(this, this._animationComplete)
                    }
                })
            });

            this.connect(window, "resize", lang.hitch(this, function() {
                this._resize();
            }));

            // Set the con
            if (this.numberInside) {
                html.set(this._numberNode, this._data.object.get(this.numberInside).toString());
            }

            // Add class to determain chart type
            this._addChartClass("chartjs-doughnut-chart");

            on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
        }
    });
});

require(["ChartJS/widgets/DoughnutChart/widget/DoughnutChart"]);
