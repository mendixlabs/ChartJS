define([
    "dojo/_base/declare",
    "ChartJS/widgets/Core",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/on",
    "dojo/html"
], function (declare, Core, lang, domQuery, on, html) {
    "use strict";

    return declare("ChartJS.widgets.DoughnutChart.widget.DoughnutChart", [ Core ], {

        _chartType: "doughnut",

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
            if (this._chart !== null) {
                this._chart.destroy();
            }
            this._chart = new this._chartJS(this._ctx, {
                type: this._chartType,
                data: this._createDataSets(data),
                options: this._chartOptions({

                    //Boolean - Whether we should show a stroke on each segment
                    segmentShowStroke : this.segmentShowStroke,

                    //String - The colour of each segment stroke
                    segmentStrokeColor : this.segmentStrokeColor,

                    //Number - The width of each segment stroke
                    segmentStrokeWidth : this.segmentStrokeWidth,

                    //Number - Amount of animation steps
                    animationSteps : this.animationSteps,

                    //String - Animation easing effect
                    animationEasing : this.animationEasing,

                    //Boolean - Whether we animate the rotation of the Doughnut
                    animateRotate : this.animateRotate,

                    //Boolean - Whether we animate scaling the Doughnut from the centre
                    animateScale : this.animateScale,

                    legendCallback : this._legendAlternateCallback,

                    //Number - The percentage of the chart that we cut out of the middle
                    cutoutPercentage : this.percentageInnerCutout
                })
            });

            this.connect(window, "resize", lang.hitch(this, function () {
                this._resize();
            }));

            // Set the con
            html.set(this._numberNode, this._data.object.get(this.numberInside));

            // Add class to determain chart type
            this._addChartClass("chartjs-doughnut-chart");

            on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
        }
    });
});

require(["ChartJS/widgets/DoughnutChart/widget/DoughnutChart"], function () {
    "use strict";
});
