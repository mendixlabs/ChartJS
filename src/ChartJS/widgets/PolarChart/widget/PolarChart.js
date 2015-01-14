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
        return declare('ChartJS.widgets.PolarChart.widget.PolarChart', [ _core ], {

            _processData : function () {
                var sets = [],
                    chartData = [],
                    points = null,
                    set = {
                        points : []
                    },
                    xlabels = [],
                    xlabelsSet = false,
                    color = "",
                    point = null,
                    label = "",
                    j = null,
                    listNodes = null,
                    k = null;

                sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

                for (j = 0; j < sets.length; j++) {
                    set = sets[j];
                    points = [];
                    color = set.dataset.get(this.seriescolor);
                    label = set.dataset.get(this.datasetlabel);
                    point = {
                        label : label,
                        color: this._hexToRgb(color, "0.5"),
                        highlight: this._hexToRgb(color, "0.75"),
                        value : +(set.point.get(this.seriesylabel))
                    };

                    chartData.push(point);
                    this._activeDatasets.push({
                        dataset : point,
                        idx : j,
                        active : true
                    });
                }

                this._createChart(chartData);

                this._legendNode.innerHTML = this._chart.generateLegend();

                listNodes = domQuery("li", this._legendNode);

                if (listNodes.length > 0) {
                    for (k = 0; k < listNodes.length; k++) {
                        on(listNodes[k], "click", lang.hitch(this, this._onClickLegend, k, true));
                    }
                }
            },

            _createChart : function (data) {

                this._chart = new this._chartJS(this._ctx).PolarArea(data, {

                    //Boolean - Show a backdrop to the scale label
                    scaleShowLabelBackdrop : this.polarScaleShowLabelBackdrop,

                    //String - The colour of the label backdrop
                    scaleBackdropColor : this.polarScaleBackdropColor,

                    // Boolean - Whether the scale should begin at zero
                    scaleBeginAtZero : this.polarScaleBeginAtZero,

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

                    //String - A legend template
                    legendTemplate : this.legendTemplate

                });
                
                on(window, 'resize', lang.hitch(this, function () {
                    this._chart.resize();
                }));


                if (this.onclickmf || this.onclickmfcontext) {
                    on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
                }
            }
        });
    });

}());