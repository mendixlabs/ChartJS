/*global mx, mendix, require, console, define, module, logger */
(function () {
	'use strict';

	// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
	require([

		'dojo/_base/declare', 'dojo/_base/lang', 'dojo/query', 'dojo/on', 'ChartJS/widgets/Core'

	], function (declare, lang, domQuery, on, _core) {

		// Declare widget.
		return declare('ChartJS.widgets.SingleSeries.widget.SingleSeries', [ _core ], {

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
					label = "";

				sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

				for(var j=0;j < sets.length; j++) {
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

				var listNodes = domQuery("li", this._legendNode);

				if (listNodes.length > 0) {
					for (var k = 0; k < listNodes.length; k++) {
						on(listNodes[k], "click", lang.hitch(this, this._onClickLegend, k, true/*Use single series data format*/));
					}
				}
			},

			_createChart : function (data) {
				if (this.chartType === "Polar")
					this._chart = new this._chartJS(this._ctx).Polar(data);
				else if (this.chartType === "Doughnut")
					this._chart = new this._chartJS(this._ctx).Doughnut(data);
				else // "Pie"
					this._chart = new this._chartJS(this._ctx).Pie(data);
			}
		});
	});

}());