/*jslint white:true, nomen: true, plusplus: true */
/*global mx, mendix, require, console, define, module, logger */
/*mendix */

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([

	'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_Widget', 'dijit/_TemplatedMixin',
	'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/window', 'dojo/on', 'dojo/_base/lang', 'dojo/text',
	'ChartJS/lib/charts'

], function (declare, _WidgetBase, _Widget, _Templated, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, win, on, lang, text, _charts) {
    'use strict';
    
	// Declare widget.
	return declare([ _WidgetBase, _Widget, _Templated, _charts ], {

		// Template path
		templatePath: require.toUrl('ChartJS/templates/chartjs.html'),

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

		startup: function () {
			this._chartJS = _charts().chartssrc();
            
            ///Boolean - Whether the chart is responsive
            this._chartJS.defaults.global.responsive = this.responsive;
                
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

        datasetAdd : function (dataset, datapoints) {
            var set = {
                dataset : dataset,
                sorting : +(dataset.get(this.datasetsorting))
            };
            if (datapoints.length === 1) {
                set.point = datapoints[0];
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
			this._executeMicroflow(this.datasourcemf, lang.hitch(this, function (objs) {
				var obj = objs[0], // Chart object is always only one.
                    j = null,
                    dataset = null,
                    pointguids = null,
                    func = null;
                    
				this._data.object = obj;
                
				// Retrieve datasets
				mx.data.get({
					guids : obj.get(this._dataset),
					callback : lang.hitch(this, function (datasets) {
						this._datasetCounter = datasets.length;
						this._data.datasets = [];

						for(j = 0;j < datasets.length; j++) {
							dataset = datasets[j];
							pointguids = dataset.get(this._datapoint);
							if (typeof pointguids === "string" && pointguids !== '') {
								pointguids = [pointguids];
							}
                            if (typeof pointguids !== "string") {
                                mx.data.get({
                                    guids : pointguids,
                                    callback : lang.hitch(this, this.datasetAdd, dataset)
                                });
                            }
						}
                        
					})
				});
			}), this._mxObj);

			if(typeof callback !== 'undefined'){
				callback();
			}
		},

		_processData : function () {
			// STUB
			console.error('_processData: This is placeholder function that should be overwritten by the implementing widget.');
		},

		_createChart : function (data) {
			// STUB
			console.error('_createChart: This is placeholder function that should be overwritten by the implementing widget.');
		},

		_onClickChart : function () {
			if (this.onclickmfcontext && this._mxObj) {
				this._executeMicroflow(this.onclickmfcontext, null, this._mxObj);
            } else {
				this._executeMicroflow(this.onclickmf);
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
				var aa = a.sorting,
				    bb = b.sorting;
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
				var aa = a.get(sortAttr),
                    bb = b.get(sortAttr);
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