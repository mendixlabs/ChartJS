/*global mx, mendix, require, console, define, module, logger */
(function () {
    'use strict';

    // Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
    require([

        'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_Widget', 'dijit/_TemplatedMixin',
        'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/window', 'dojo/on', 'dojo/_base/lang', 'dojo/text',
        'ChartJS/lib/charts'

    ], function (declare, _WidgetBase, _Widget, _Templated, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, win, on, lang, text, _charts) {

        // Declare widget.
        return declare('ChartJS.widgets.MultiSeries.widget.MultiSeries', [ _WidgetBase, _Widget, _Templated, _charts ], {

            // Template path
            templatePath: require.toUrl('ChartJS/widgets/MultiSeries/widget/templates/MultiSeries.html'),

            _chartJS : null,
            _chart : null,
            _ctx : null,
            _dataset : null,
            _datasetCounter : 0,
            _data : null,
            _chartData : null,
            _activeDatasets : null,

            startup: function () {
                this._chartJS = _charts().chartssrc();
                this._chartJS.defaults.global.responsive = true;
                this._chartData = {
                    datasets : []
                };
                this._activeDatasets = [];

                domStyle.set(this.domNode, {
                    padding: 0,
                    width : '100%',
                    maxWidth : '100%',
                    maxHeight : '100%',
                    overflow : 'hidden'
                });

                this._ctx = this.canvasNode.getContext("2d");
                this._dataset = this.datasetentity.split("/")[0];
                this._datapoint = this.datapointentity.split("/")[0];
                this._data = {};
            },

            update : function (obj, callback) {
                this._executeMicroflow(lang.hitch(this, function (objs) {
                    var obj = objs[0]; // Chart object is always only one.
                    this._data.object = obj;

                    // Retrieve datasets
                    mx.data.get({
                        guids : obj.get(this._dataset),
                        callback : lang.hitch(this, function (datasets) {
                            this._datasetCounter = datasets.length;
                            this._data.datasets = [];

                            for(var j=0;j < datasets.length; j++) {
                                var dataset = datasets[j];

                                // Retrieve datapoints for each dataset
                                mx.data.get({
                                    guids : dataset.get(this._datapoint),
                                    callback : lang.hitch(this, function ( dataset, datapoints) {
                                        this._data.datasets.push({
                                            dataset : dataset,
                                            sorting : +(dataset.get(this.datasetsorting)),
                                            points : datapoints
                                        });

                                        this._datasetCounter--;
                                        if (this._datasetCounter === 0){
                                            this._processData();
                                        }

                                    }, dataset)
                                });
                            }
                        })
                    });
                }));

                callback && callback();
            },

            _processData : function () {
                var sets = [],
                    points = null,
                    set = {
                        points : []
                    },
                    xlabels = [],
                    xlabelsSet = false,
                    color = "",
                    label = "";

                sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

                for(var j=0;j < sets.length; j++) {
                    set = sets[j];
                    points = [];
                    set.points = this._sortArrayMx(set.points, this.sortingxvalue);
                    color = set.dataset.get(this.seriescolor);
                    label = set.dataset.get(this.datasetlabel);

                    for(var i=0;i < set.points.length; i++) {
                        if (!xlabelsSet)
                            xlabels.push(set.points[i].get(this.seriesxlabel));

                        points.push(+(set.points[i].get(this.seriesylabel))); // Convert to integer, so the stackedbar doesnt break!
                    }

                    if (!xlabelsSet)
                        xlabelsSet = true;
                    var _set = {
                        label : label,
                        fillColor: this._hexToRgb(color, "0.5"),
                        strokeColor: this._hexToRgb(color, "0.8"),
                        pointColor: this._hexToRgb(color, "0.8"),
                        highlightFill: this._hexToRgb(color, "0.75"),
                        highlightStroke: this._hexToRgb(color, "1"),
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

                if (this.chartType === "Bar")
                    this._chart = new this._chartJS(this._ctx).Bar(this._chartData);
                else if (this.chartType === "Radar")
                    this._chart = new this._chartJS(this._ctx).Radar(this._chartData);
                else if (this.chartType === "StackedBar")
                    this._chart = new this._chartJS(this._ctx).StackedBar(this._chartData);
                else // "Line"
                    this._chart = new this._chartJS(this._ctx).Line(this._chartData);

                this.legendNode.innerHTML = this._chart.generateLegend();

                var listNodes = domQuery("li", this.legendNode);

                if (listNodes.length > 0) {
                    for (var i = 0; i < listNodes.length; i++) {
                        on(listNodes[i], "click", lang.hitch(this, this._onClickLegend, i));
                    }
                }

                /*window.setTimeout(lang.hitch(this, function () {
                    this._chart.datasets = [];
                    this._chart.addData(this._chartData.datasets[0]);
                    this._chart.update();
                }), 5000);*/
            },

            _onClickLegend : function (idx) {
                this._activeDatasets[idx].active = !this._activeDatasets[idx].active;

                this._chart.datasets = [];
                for (var i=0; i< this._activeDatasets.length;i++) {
                    if (this._activeDatasets[i].active)
                        this._chart.push(this._activeDatasets[i].dataset);
                }
                this._chart.update();
                this._chart.resize();
            },

            _sortArrayObj : function (values) {
                return values.sort(lang.hitch(this, function (a,b) {
                    var aa = a.sorting;
                    var bb = b.sorting;
                    if (aa > bb) {
                        return 1;
                    }
                    if (aa < bb) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                }));
            },

            _sortArrayMx : function (values, sortAttr) {
                return values.sort(lang.hitch(this, function (a,b) {
                    var aa = a.get(sortAttr);
                    var bb = b.get(sortAttr);
                    if (aa > bb) {
                        return 1;
                    }
                    if (aa < bb) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                }));
            },

            _hexToRgb : function (hex, alpha) {
                // From Stackoverflow here: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
                // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
                var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                    return r + r + g + g + b + b;
                });

                var regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (regex) {
                    var result = {
                        r: parseInt(regex[1], 16),
                        g: parseInt(regex[2], 16),
                        b: parseInt(regex[3], 16)
                    };
                    return "rgba("+result.r+","+result.g+","+result.b+","+alpha+")";
                }
                return "rgba(220,220,220,"+alpha+")";
            },

            _executeMicroflow : function (callback) {
                mx.data.action({
                    params: {
                        applyto: 'selection',
                        actionname: this.datasourcemf,
                        guids: []
                    },
                    callback: lang.hitch(this, callback),
                    error: function (error) {
                        console.log(error.description);
                    }
                }, this);
            }

        });
    });

}());


