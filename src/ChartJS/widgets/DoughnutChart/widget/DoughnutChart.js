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
		return declare('ChartJS.widgets.DoughnutChart.widget.DoughnutChart', [ _core ], {

			_processData : function () {
				var sets = [],
					chartData = [],
					points = null,
					set = {
						points : []
					},
					color = "",
					point = null,
					label = "",
					j = null;

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
						value : +(set.dataset.get(this.seriesylabel))
					};

					chartData.push(point);
					this._activeDatasets.push({
						dataset : point,
						idx : j,
						active : true
					});
				}

				this._createChart(chartData);

				this._createLegend(true);
			},

			_loadData : function () {

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

							for(j = 0;j < datasets.length; j++) {
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

				this._chart = new this._chartJS(this._ctx).Doughnut(data, {

					//Boolean - Whether we should show a stroke on each segment
					segmentShowStroke : this.segmentShowStroke,

					//String - The colour of each segment stroke
					segmentStrokeColor : this.segmentStrokeColor,

					//Number - The width of each segment stroke
					segmentStrokeWidth : this.segmentStrokeWidth,

					//Number - The percentage of the chart that we cut out of the middle
					percentageInnerCutout : this.percentageInnerCutout, // This is 0 for Pie charts

					//Number - Amount of animation steps
					animationSteps : this.animationSteps,

					//String - Animation easing effect
					animationEasing : this.animationEasing,

					//Boolean - Whether we animate the rotation of the Doughnut
					animateRotate : this.animateRotate,

					//Boolean - Whether we animate scaling the Doughnut from the centre
					animateScale : this.animateScale,

					//String - A legend template
					legendTemplate : this.legendTemplate

				});

				on(window, 'resize', lang.hitch(this, function () {
					this._chart.resize();
				}));

				if (this.onclickmf) {
					on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
				}
			}
		});
	});

}());