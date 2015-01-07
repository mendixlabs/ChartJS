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

			startup: function () {
				this._chartJS = _charts().chartssrc();
				this._chartJS.defaults.global.responsive = true;

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
			},

			update : function (obj, callback) {
				this._executeMicroflow(lang.hitch(this, function (objs) {
					var obj = objs[0],
						data = {
							datasets : []
						},
						xlabels = [],
						xlabelsSet = false;

					mx.data.get({
						guids : obj.get(this._dataset),
						callback : lang.hitch(this, function (finalCallback, datasets) {

							var len = datasets.length;

							for(var j=0;j < datasets.length; j++) {
								var dataset = datasets[j];

								mx.data.get({
									guids : dataset.get(this._datapoint),
									callback : lang.hitch(this, function ( dataset, len, j, finalCallback, datapoints) {
										var points = [];

										var datapoints = this._sortDatapoints(datapoints);

										for(var i=0;i < datapoints.length; i++) {
											if (!xlabelsSet)
												xlabels.push(datapoints[i].get(this.seriesxlabel));

											points.push(datapoints[i].get(this.seriesylabel));
										}

										if (!xlabelsSet)
											xlabelsSet = true;
										var color = dataset.get(this.seriescolor);

										data.datasets.push({
											label : dataset.get(this.datasetlabel),
											fillColor: this._hexToRgb(color, "0.5"),
											strokeColor: this._hexToRgb(color, "0.8"),
											pointColor: this._hexToRgb(color, "0.8"),
											highlightFill: this._hexToRgb(color, "0.75"),
											highlightStroke: this._hexToRgb(color, "1"),
											data : points
										});

										if (len-1 === j){
											finalCallback();
										}

									}, dataset, len, j, finalCallback)
								});
							}
						}, lang.hitch(this, function () {
							data.labels = xlabels;
							
							if (this.chartType === "Bar")
								this._chart = new this._chartJS(this._ctx).Bar(data);
							else if (this.chartType === "Radar")
								this._chart = new this._chartJS(this._ctx).Radar(data);
							else // "Line"
								this._chart = new this._chartJS(this._ctx).Line(data);
							
							this.legendNode.innerHTML = this._chart.generateLegend();
							
						}))
					});
				}));

				callback && callback();
			},

			_sortDatapoints : function (points) {
				return points.sort(lang.hitch(this, function (a,b) {
					var aa = a.get(this.sortingxvalue);
					var bb = b.get(this.sortingxvalue);
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


