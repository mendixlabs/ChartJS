define([

    // Mixins
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",

    // Client API and DOJO functions
    "mxui/dom",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/_base/window",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/html",
    "dojo/ready",

    // External libraries
    "ChartJS/lib/charts",

    // Templates
    "dojo/text!ChartJS/templates/chartjs.html",
    "dojo/text!ChartJS/templates/tooltip.html"

], function (

       // Mixins
       declare, _WidgetBase, _TemplatedMixin,

        // Client API and DOJO functions
        dom, dojoDom, domQuery, domProp, domGeom, domClass, domAttr, domStyle, win, domConstruct, dojoArray, lang, html, ready,

        // External libraries
        _charts,

        // Templates
        _chartJSTemplate,
        _chartJSTooltipTemplate) {

    "use strict";

    // Declare widget.
    return declare([_WidgetBase, _TemplatedMixin], {

        // Template path
        templateString: _chartJSTemplate,

        // Set in modeler
        responsiveRatio: 0,

        // Internal variables
        _chartJS: null,
        _chart: null,
        _ctx: null,
        _dataset: null,
        _datasetCounter: 0,
        _data: null,
        _chartData: null,
        _activeDatasets: null,
        _legendNode: null,
        _mxObj: null,
        _handle: null,

        _chartType: null,

        _resizeTimer: null,

        _currentContext: null,
        _addedToBody: false,

        _tooltipNode: null,

        startup: function () {
            logger.debug(this.id + ".startup");

            var domNode = null;

            // Activate chartJS (and clone it, making sure globals are not overwritten for other instances).
            this._chartJS = lang.clone(_charts);

            // Fonts
            this._font = this.labelFont || "Helvetica Neue";

            // Hack to fix the tooltip event, also added "mouseover"
            this._chartJS.defaults.global.tooltipEvents = ["mouseover", "mouseup", "mousedown", "mousemove", "touchstart", "touchmove", "mouseout"];
            this._chartJS.defaults.global.tooltipXOffset = 0;

            // Set object , dataset and datapoint.
            this._dataset = this.datasetentity.split("/")[0];
            this._datapoint = this.datapointentity && this.datapointentity.split("/")[0];
            this._data = {};
            this._documentReady = false;

            this._createCtx();

            this._chartData = {
                contextObj: null,
                datasets: []
            };

            this._activeDatasets = [];

            // if (!dojoDom.byId("chartjsTooltip")) {
            //     this._tooltipNode = domConstruct.toDom(_chartJSTooltipTemplate);
            //     domConstruct.place(this._tooltipNode, win.body());
            // }

            this.connect(this.mxform, "resize", lang.hitch(this, function () {
                this._resize();
            }));
        },

        datasetAdd: function (dataset, datapoints) {
            logger.debug(this.id + ".datasetAdd");
            var set = {
                dataset: dataset,
                sorting: +(dataset.get(this.datasetsorting))
            };
            if (datapoints.length === 1) {
                set.point = datapoints[0];
                set.points = datapoints;
            } else {
                set.points = datapoints;
            }

            this._data.datasets.push(set);

            this._datasetCounter--;
            if (this._datasetCounter === 0) {
                this._processData();
            }
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");
            this._mxObj = obj;

            if (this._handle !== null) {
                mx.data.unsubscribe(this._handle);
                this._handle = null;
            }

            if (this._mxObj) {
                this._handle = mx.data.subscribe({
                    guid: this._mxObj.getGuid(),
                    callback: lang.hitch(this, this._loadData)
                });

                // Load data again.
                this._loadData();
                domStyle.set(this.domNode, "display", "");
            } else {
                domStyle.set(this.domNode, "display", "none");
            }

            mendix.lang.nullExec(callback);
        },

        _loadData: function () {
            logger.debug(this.id + "._loadData");
            this._data = {
                object: this._mxObj,
                datasets: []
            };

            this._executeMicroflow(this.datasourcemf, lang.hitch(this, function (objs) {
                var obj = objs[0], // Chart object is always only one.
                    j = null,
                    dataset = null,
                    pointguids = null,
                    guids = obj.get(this._dataset);

                this._data.object = obj;
                this._data.datasets = [];

                if (!guids) {
                    logger.warn(this.id + "._loadData failed, no _dataset. Not rendering Chart");
                    return;
                }

                // Retrieve datasets
                mx.data.get({
                    guids: guids,
                    callback: lang.hitch(this, function (datasets) {
                        var set = {};

                        this._datasetCounter = datasets.length;
                        this._data.datasets = [];

                        for (j = 0; j < datasets.length; j++) {
                            dataset = datasets[j];
                            pointguids = dataset.get(this._datapoint);
                            if (typeof pointguids === "string" && pointguids !== "") {
                                pointguids = [pointguids];
                            }
                            if (typeof pointguids !== "string") {
                                mx.data.get({
                                    guids: pointguids,
                                    callback: lang.hitch(this, this.datasetAdd, dataset)
                                });
                            } else {
                                this.datasetAdd(dataset, []);
                            }
                        }

                    })
                });
            }), this._mxObj);

        },

        uninitialize: function () {
            logger.debug(this.id + ".uninitialize");
            if (this._handle !== null) {
                mx.data.unsubscribe(this._handle);
            }

            if (this._tooltipNode) {
                domConstruct.destroy(this._tooltipNode);
            }
        },

        customTooltip: function (tooltip) {
            logger.debug(this.id + ".customTooltip");
            // Tooltip Element
            var tooltipEl = domQuery("#chartjsTooltip")[0],
                tooltipElContent = domQuery("#chartjsTooltip .content")[0],
                top = null,
                contextObj = null;

            // Hide if no tooltip
            if (!tooltip) {
                domStyle.set(tooltipEl, "opacity", 0);
                return;
            }

            // Set caret Position
            domClass.remove(tooltipEl, "above below");
            domClass.add(tooltipEl, tooltip.yAlign);

            // Set Text
            domConstruct.empty(tooltipElContent);

            // Construct the tooltip form
            if (typeof this.tooltipForm !== "undefined" && this.tooltipForm !== "") {
                contextObj = new mendix.lib.MxContext();
                contextObj.setTrackObject(this._mxObj);
                this._tooltip = mx.ui.openForm(this.tooltipForm, {
                    location: "content",
                    context: contextObj,
                    domNode: tooltipElContent,
                    callback: function (form) {
                        var whatEver = null;
                    }
                }, this);
            } else {
                html.set(tooltipElContent, domConstruct.create("span", {
                    innerHTML: tooltip.text + " - custom tooltip!!!"
                }));
            }

            // Find Y Location on page
            if (tooltip.yAlign === "above") {
                top = tooltip.y - tooltip.caretHeight - tooltip.caretPadding;
            } else {
                top = tooltip.y + tooltip.caretHeight + tooltip.caretPadding;
            }

            // Display, position, and set styles for font
            domStyle.set(tooltipEl, "opacity", 1);
            domStyle.set(tooltipEl, "left", tooltip.chart.canvas.offsetLeft + (tooltip.x - 7.5) + "px");
            domStyle.set(tooltipEl, "top", tooltip.chart.canvas.offsetTop + tooltip.y + "px");
            domStyle.set(tooltipEl, "font-family", tooltip.fontFamily);
            domStyle.set(tooltipEl, "font-size", tooltip.fontSize);
            domStyle.set(tooltipEl, "font-style", tooltip.fontStyle);

        },

        _createCtx: function () {
            logger.debug(this.id + "._createCtx");
            var position = domGeom.position(this.domNode.parentElement, false);
            domAttr.set(this.canvasNode, "id", "canvasid_" + this.id);

            if (position.w > 0 && this.responsive) {
                this.canvasNode.width = position.w;
            } else {
                this.canvasNode.width = this.width;
            }

            if (this.responsive) {
                if (this.responsiveRatio > 0) {
                    this.canvasNode.height = Math.round(this.canvasNode.width * (this.responsiveRatio / 100));
                } else if (position.h > 0) {
                    this.canvasNode.height = position.h;
                } else {
                    this.canvasNode.height = this.height;
                }
            } else {
                this.canvasNode.height = this.height;
            }

            this._ctx = this.canvasNode.getContext("2d");

        },

        _processData: function () {
            // STUB
            console.error("_processData: This is placeholder function that should be overwritten by the implementing widget.");
        },

        _createChart: function (data) {
            // STUB
            console.error("_createChart: This is placeholder function that should be overwritten by the implementing widget.", data);
        },

        _onClickChart: function (evt) {
            logger.debug(this.id + "._onClickChart");
            var elements = this._chart.getElementAtEvent(evt);
            if (elements.length) {
                var el = elements[0],
                datasetIndex = el._datasetIndex,
                pointIndex = el._index,
                dataset =  this._data.datasets[datasetIndex],
                datasetObject = dataset ? dataset.dataset : null,
                dataPointObject = dataset && dataset.points ? dataset.points[pointIndex] : null;

                if (this.onclickDataSetMf && datasetObject) {
                    if (this._chartType === "pie" || this._chartType === "doughnut" || this._chartType === "polarArea") {
                        // These chartTypes use a single series data set, so the datasetobject is different
                        datasetObject = this._activeDatasets[pointIndex].obj;
                    }

                    this._executeMicroflow(this.onclickDataSetMf, null, datasetObject);
                }

                if (this.onclickDataPointMf && dataPointObject) {
                    this._executeMicroflow(this.onclickDataPointMf, null, dataPointObject);
                }
            }

            if (this.onclickmf) {
                this._executeMicroflow(this.onclickmf);
            }
        },

        _createLegend: function (isSingleSeries) {
            logger.debug(this.id + "._createLegend");
            var listNodes = null,
                k = null;

            if (this.showLegendCustom) {
                this._legendNode.innerHTML = this._chart.generateLegend();

                listNodes = domQuery("li", this._legendNode);

                if (listNodes.length > 0) {
                    for (k = 0; k < listNodes.length; k++) {
                        this.connect(listNodes[k], "click", lang.hitch(this, this._onClickLegend, k, isSingleSeries));
                    }
                }
            }
        },

        _legendCallback: function (chart) {
            logger.debug(this.id + "._legendCallback");
            var text = [];
            text.push("<ul class=\"" + chart.id + "-legend chart-legend\">");
            for (var i = 0; i < chart.data.datasets.length; i++) {
                text.push("<li class=\"chart-legend_item\"><span class=\"chart-legend_bullet\" style=\"background-color:" + chart.data.datasets[i].backgroundColor + "\"></span>");
                if (chart.data.datasets[i].label) {
                    text.push(chart.data.datasets[i].label);
                }
                text.push("</li>");
            }
            text.push("</ul>");

            return text.join("");
        },

        _legendAlternateCallback: function(chart) {
            var text = [];
            text.push("<ul class=\"" + chart.id + "-legend chart-legend\">");

            if (chart.data.datasets.length) {
                for (var i = 0; i < chart.data.datasets[0].data.length; ++i) {
                    text.push("<li class=\"chart-legend_item\"><span class=\"chart-legend_bullet\" style=\"background-color:" + chart.data.datasets[0].backgroundColor[i] + "\"></span>");
                    if (chart.data.labels[i]) {
                        text.push(chart.data.labels[i]);
                    }
                    text.push("</li>");
                }
            }

            text.push("</ul>");
            return text.join("");
        },

        _onClickLegend: function (idx, isSingleSeries) {
            logger.debug(this.id + "._onClickLegend", idx, isSingleSeries);
            var activeSet = null,
                activeSetLegend = null,
                newDatasets = {
                    datasets: [],
                    labels: this._chartData.labels
                },
                i = null;

            this._activeDatasets[idx].active = !this._activeDatasets[idx].active;

            this._chart.destroy();
            for (i = 0; i < this._activeDatasets.length; i++) {
                activeSet = this._activeDatasets[i];
                activeSetLegend = domQuery("li", this._legendNode)[activeSet.idx];

                if (activeSet.active) {
                    if (domClass.contains(activeSetLegend, "legend-inactive")) {
                        domClass.remove(activeSetLegend, "legend-inactive");
                    }

                    newDatasets.datasets.push(activeSet.dataset);
                } else if (!domClass.contains(activeSetLegend, "legend-inactive")) {
                    domClass.add(activeSetLegend, "legend-inactive");
                }
            }
            if (isSingleSeries) {
                this._createChart(newDatasets.datasets);
            } else {
                this._createChart(newDatasets);
            }
        },

        _createDataSets: function (data) {
            logger.debug(this.id + "._createDataSets");
            var _chartData = {
                labels: [],
                datasets: [
                    {
                        data: [],
                        backgroundColor: [],
                        hoverBackgroundColor: []
                    }
                ]
            };

            for (var j = 0; j < data.length; j++) {
                _chartData.labels.push(data[j].label);
                _chartData.datasets[0].data.push(data[j].value);
                _chartData.datasets[0].backgroundColor.push(data[j].backgroundColor);
                _chartData.datasets[0].hoverBackgroundColor.push(data[j].hoverBackgroundColor);
            }

            return _chartData;
        },

        _sortArrayObj: function (values) {
            logger.debug(this.id + "._sortArrayObj");
            return values.sort(lang.hitch(this, function (a, b) {
                var aa = +(a.sorting),
                    bb = +(b.sorting);
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

        _isNumber: function (n, attr) {
            // Fix for older MX versions who do not have the .isNumeric method
            if (typeof n.isNumeric === "function") {
                return n.isNumeric(attr);
            }
            return n.isNumber(attr);
        },

        _sortArrayMx: function (values, sortAttr) {
            logger.debug(this.id + "._sortArrayMx");
            return values.sort(lang.hitch(this, function (a, b) {
                var aa = +(a.get(sortAttr)),
                    bb = +(b.get(sortAttr));
                //if the attribute is numeric
                aa = this._isNumber(a, sortAttr) ? parseFloat(aa) : aa;
                bb = this._isNumber(b, sortAttr) ? parseFloat(bb) : bb;
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

        _addChartClass: function (className) {
            logger.debug(this.id + "._addChartClass");
            domClass.remove(this.domNode, className);
            domClass.add(this.domNode, className);
        },

        _resize: function () {
            logger.debug(this.id + "._resize");
            var position = domGeom.position(this.domNode.parentElement, false);

            clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(lang.hitch(this, function (){
                //Only resize when chart is set to responsive and width and height of parent element > 0
                if (this._chart && this.responsive && position.w > 0 && position.h > 0) {
                    this._chart.resize();
                }
            }), 50);
        },

        _hexToRgb: function (hex, alpha) {
            //logger.debug(this.id + "._hexToRgb", hex, alpha);
            if (hex !== null) {
                var regex = null,
                    shorthandRegex = null,
                    result = null;

                // From Stackoverflow here: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
                // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
                shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                    return r + r + g + g + b + b;
                });

                regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (regex) {
                    result = {
                        r: parseInt(regex[1], 16),
                        g: parseInt(regex[2], 16),
                        b: parseInt(regex[3], 16)
                    };
                    return "rgba(" + result.r + "," + result.g + "," + result.b + "," + alpha + ")";
                }
            } else {
                logger.warn("Empty hex color!");
            }
            return "rgba(220,220,220," + alpha + ")";
        },

        _chartOptions: function (options) {
            logger.debug(this.id + "._chartOptions");
            // returns default chart options, mixed with specific options for a chart

            var defaultOptions = {
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
                    display : this.showLegend,
                    labels : { fontFamily : this._font }
                },
                maintainAspectRatio : this.maintainAspectRatio,
                showTooltips : this.showTooltips,
                animation: this.chartAnimation ? ({
					duration: this.chartAnimation ? this.animationDuration : 0,
					easing: this.animationEasing
				}) : false
            };

            return lang.mixin(lang.clone(defaultOptions), options);
        },

        _executeMicroflow: function (mf, callback, obj) {
            logger.debug(this.id + "._executeMicroflow");
            var _params = {
                applyto: "selection",
                actionname: mf,
                guids: []
            };

            if (obj === null) {
                obj = this._data.object;
            }

            if (obj && obj.getGuid()) {
                _params.guids = [obj.getGuid()];
            }

            mx.data.action({
                params: _params,
                store: {
                    caller: this.mxform
                },
                callback: lang.hitch(this, function (obj) {
                    if (typeof callback === "function") {
                        callback(obj);
                    }
                }),
                error: lang.hitch(this, function (error) {
                    console.log(this.id + "._executeMicroflow error: " + error.description);
                })
            }, this);
        }

    });
});
