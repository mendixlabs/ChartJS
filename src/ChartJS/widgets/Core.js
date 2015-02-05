/*jslint white:true, nomen: true, plusplus: true */
/*global mx, mxui, mendix, require, console, define, module, logger, ChartJS, position, clearTimeout, setTimeout */
/*mendix */

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([

    // Mixins
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    
    // Client API and DOJO functions
    'mxui/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-attr', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/html', 'dojo/ready',
    
    // External libraries
    'ChartJS/lib/charts',

    // Templates
    'dojo/text!ChartJS/templates/chartjs.html'

], function (
       
        // Mixins
        declare, _WidgetBase, _TemplatedMixin, 

        // Client API and DOJO functions
        dom, domQuery, domProp, domGeom, domClass, domAttr, domStyle, domConstruct, dojoArray, lang, html, ready, 

        // External libraries 
        _charts,

        // Templates
        _chartJSTemplate) {
    
    'use strict';

    // Declare widget.
    return declare([ _WidgetBase, _TemplatedMixin ], {

        // Template path
        templateString: _chartJSTemplate,

        // Internal variables
        _chartJS : null,
        _chart : null,
        _ctx : null,
        _dataset : null,
        _datasetCounter : 0,
        _data : null,
        _chartData : null,
        _activeDatasets : null,
        _legendNode : null,
        _mxObj : null,
        _handle : null,

        _currentContext : null,

        startup: function () {

            // Activate chartJS.
            this._chartJS = _charts().chartssrc();

            ///Boolean - Whether the chart is responsive
            this._chartJS.defaults.global.responsive = this.responsive;

            // Hack to fix the tooltip event, also added "mouseover"
            this._chartJS.defaults.global.tooltipEvents = ['mouseover', 'mousemove', 'touchstart', 'touchmove', 'mouseout'];
            this._chartJS.defaults.global.tooltipXOffset = 0;

            // Set object , dataset and datapoint.
            this._dataset = this.datasetentity.split("/")[0];
            this._datapoint = this.datapointentity && this.datapointentity.split("/")[0];
            this._data = {};
            this._documentReady = false;

            this._createCtx();

            this._chartData = {
                contextObj : null,
                datasets : []
            };

            this._activeDatasets = [];

        },

        datasetAdd : function (dataset, datapoints) {
            var set = {
                dataset : dataset,
                sorting : +(dataset.get(this.datasetsorting))
            };
            if (datapoints.length === 1) {
                set.point = datapoints[0];
                set.points = datapoints;
            } else {
                set.points = datapoints;
            }

            this._data.datasets.push(set);

            this._datasetCounter--;
            if (this._datasetCounter === 0){
                this._processData();
            }
        },

        update : function (obj, callback) {

            this._mxObj = obj;

            if (this._handle !== null) {
                mx.data.unsubscribe(this._handle);
            }
            this._handle = mx.data.subscribe({
                guid: this._mxObj.getGuid(),
                callback: lang.hitch(this, this._loadData)
            });

            // Load data again.
            this._loadData();

            if(typeof callback !== 'undefined'){
                callback();
            }
        },

        _loadData : function () {

            this._data = {
                object : this._mxObj,
                datasets : []
            };

            console.log(this.id + ' - LOAD DATA');
            this._executeMicroflow(this.datasourcemf, lang.hitch(this, function (objs) {
                var obj = objs[0], // Chart object is always only one.
                    j = null,
                    dataset = null,
                    pointguids = null;

                this._data.object = obj;
                this._data.datasets = [];

                console.log(this.id + ' - executed: ' + this.datasourcemf + ' - ' + obj);

                // Retrieve datasets
                mx.data.get({
                    guids : obj.get(this._dataset),
                    callback : lang.hitch(this, function (datasets) {
                        var set = {},
                            pointObj = null,
                            createZeroValueEntity = null,
                            errorZeroValueEntity = null;

                        console.log(this.id + ' - length datasets: ' + datasets.length);
                        this._datasetCounter = datasets.length;
                        this._data.datasets = [];

                        createZeroValueEntity = function(obj) {
                            obj.set(this.zeroValueAttr, 0);
                            obj.set(this.zeroColorAttr, this.zeroColorValueAttr);
                            set = {
                                dataset : dataset,
                                sorting : +(dataset.get(this.datasetsorting)),
                                point : obj,
                                points : [obj]
                            };
                            this._data.datasets.push(set);
                            this._datasetCounter--;
                            if (this._datasetCounter === 0){
                                this._processData();
                            }
                        };  
                        errorZeroValueEntity = function (e) {
                            console.log("an error occured: " + e);
                        };

                        for(j = 0;j < datasets.length; j++) {
                            dataset = datasets[j];
                            pointguids = dataset.get(this._datapoint);
                            console.log(this.id + ' - length datasets: ' + pointguids);
                            if (typeof pointguids === "string" && pointguids !== '') {
                                pointguids = [pointguids];
                            }
                            if (typeof pointguids !== "string") {
                                mx.data.get({
                                    guids : pointguids,
                                    callback : lang.hitch(this, this.datasetAdd, dataset)
                                });
                            } else {
                                // No points found
                                mx.data.create({
                                    entity: this.zeroValueEntity,
                                    callback: lang.hitch(this, createZeroValueEntity), 
                                    error: errorZeroValueEntity
                                });
                            }
                        }

                    })
                });
            }), this._mxObj);

        },

        uninitialize : function () {
            if (this._handle !== null) {
                mx.data.unsubscribe(this._handle);
            }
        },

        customTooltip : function (tooltip) {

            // Tooltip Element
            var tooltipEl = this._customTooltip,
                tooltipElContent = this._customTooltipContent,
                top = null,
                contextObj = null;

            // Hide if no tooltip
            if (!tooltip) {
                domStyle.set(tooltipEl, 'opacity', 0);
                return;
            }

            // Set caret Position
            domClass.remove(tooltipEl, 'above below');
            domClass.add(tooltipEl, tooltip.yAlign);

            // Set Text
            domConstruct.empty(tooltipElContent);

            // Construct the tooltip form
            if (typeof this.tooltipForm !== 'undefined' && this.tooltipForm !== '') {
                contextObj = new mendix.lib.MxContext();
                contextObj.setTrackObject(this._mxObj);
                this._tooltip = mx.ui.openForm(this.tooltipForm, {
                    location: 'content',
                    context: contextObj,
                    domNode: tooltipElContent,
                    callback: function(form) {
                        var whatEver = null;
                    }
                }, this);
            } else {
                html.set(tooltipElContent, domConstruct.create('span', { innerHTML: tooltip.text + ' - custom tooltip!!!' }));
            }

            // Find Y Location on page
            if (tooltip.yAlign === 'above') {
                top = tooltip.y - tooltip.caretHeight - tooltip.caretPadding;
            } else {
                top = tooltip.y + tooltip.caretHeight + tooltip.caretPadding;
            }

            // Display, position, and set styles for font
            domStyle.set(tooltipEl, 'opacity', 1);
            domStyle.set(tooltipEl, 'left', tooltip.chart.canvas.offsetLeft + (tooltip.x - 7.5) + 'px');
            domStyle.set(tooltipEl, 'top', tooltip.chart.canvas.offsetTop + tooltip.y + 'px');
            domStyle.set(tooltipEl, 'font-family', tooltip.fontFamily);
            domStyle.set(tooltipEl, 'font-size', tooltip.fontSize);
            domStyle.set(tooltipEl, 'font-style', tooltip.fontStyle);

        },

        _createCtx : function() {
            var position = domGeom.position(this.domNode.parentElement, false);
            domAttr.set(this.canvasNode, 'id', 'canvasid_' + this.id);
            this.canvasNode.width = (this.usePixels) ? this.width : position.w;
            this.canvasNode.height = (this.usePixels) ? this.height : position.h;
            this._ctx = this.canvasNode.getContext("2d");
        },

        _processData : function () {
            // STUB
            console.error('_processData: This is placeholder function that should be overwritten by the implementing widget.');
        },

        _createChart : function (data) {
            // STUB
            console.error('_createChart: This is placeholder function that should be overwritten by the implementing widget.', data);
        },

        _onClickChart : function () {
            if (this.onclickmf) {
                this._executeMicroflow(this.onclickmf);
            }
        },

        _createLegend : function (isSingleSeries) {
            var listNodes = null,
                k = null;

            if (this.showLegend) {
                this._legendNode.innerHTML = this._chart.generateLegend();

                listNodes = domQuery("li", this._legendNode);

                if (listNodes.length > 0) {
                    for (k = 0; k < listNodes.length; k++) {
                        this.connect(listNodes[k], "click", lang.hitch(this, this._onClickLegend, k, isSingleSeries )); 
                    }
                }
            }
        },

        _onClickLegend : function (idx, isSingleSeries) {
            var activeSet = null,
                activeSetLegend = null,
                newDatasets = {
                    datasets : [],
                    labels : this._chartData.labels
                },
                i = null;

            this._activeDatasets[idx].active = !this._activeDatasets[idx].active;

            this._chart.destroy();
            for (i = 0; i < this._activeDatasets.length;i++) {
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

        _sortArrayObj : function (values) {
            return values.sort(lang.hitch(this, function (a,b) {
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

        _sortArrayMx : function (values, sortAttr) {
            return values.sort(lang.hitch(this, function (a,b) {
                var aa = +(a.get(sortAttr)),
                    bb = +(b.get(sortAttr));
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

        _addChartClass : function (className) {
            domClass.remove(this.domNode, className);
            domClass.add(this.domNode, className);
        },

        _resize : function () {
            var includeScroll = false,
                numberNodePosition = domGeom.position(this._numberNode, includeScroll),
                chartPosition = domGeom.position(this.canvasNode, includeScroll),
                posX = ((chartPosition.w / 2) - (numberNodePosition.w / 2)),
                posY = ((chartPosition.h / 2) - (numberNodePosition.h / 2));

            console.log('width: ' + (chartPosition.w) + '/' + (chartPosition.w / 2) + ' - ' + (numberNodePosition.w) + '/' + (numberNodePosition.w / 2));
            console.log('height: ' + (chartPosition.h) + '/' + (chartPosition.h / 2) + ' - ' + (numberNodePosition.h) + '/' + (numberNodePosition.h / 2));

            domStyle.set(this._numberNode, 'left', posX + 'px');
            domStyle.set(this._numberNode, 'top', posY + 'px');
        },

        _hexToRgb : function (hex, alpha) {
            var regex = null,
                shorthandRegex = null,
                result = null;

            // From Stackoverflow here: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

            regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (regex) {
                result = {
                    r: parseInt(regex[1], 16),
                    g: parseInt(regex[2], 16),
                    b: parseInt(regex[3], 16)
                };
                return "rgba("+result.r+","+result.g+","+result.b+","+alpha+")";
            }
            return "rgba(220,220,220,"+alpha+")";
        },

        _executeMicroflow : function (mf, callback, obj) {
            var _params = {
                applyto: 'selection',
                actionname: mf,
                guids : []
            };

            if (obj && obj.getGuid()) {
                _params.guids = [obj.getGuid()];
            }

            console.log(this.id + ' - trying to executed: ' + this.datasourcemf + ' - ' + obj);

            mx.data.action({
                params : _params,
                callback: lang.hitch(this, function  (obj) {
                    if(typeof callback !== 'undefined'){
                        callback(obj);
                    }
                }),
                error: function (error) {
                    console.log(error.description);
                }
            }, this);
        }

    });
});