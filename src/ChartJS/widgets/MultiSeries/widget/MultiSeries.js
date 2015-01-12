/*global mx, mendix, require, console, define, module, logger */
(function () {
	'use strict';

	// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
	require([

		'dojo/_base/declare', 'dojo/_base/lang', 'dojo/query', 'dojo/on', 'ChartJS/widgets/Core'

	], function (declare, lang, domQuery, on, _core) {

		// Declare widget.
		return declare('ChartJS.widgets.MultiSeries.widget.MultiSeries', [ _core ], {

			// Overwrite functions from _core here...

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

				this._createChart(this._chartData);

				this._legendNode.innerHTML = this._chart.generateLegend();

				var listNodes = domQuery("li", this._legendNode);

				if (listNodes.length > 0) {
					for (var k = 0; k < listNodes.length; k++) {
						on(listNodes[k], "click", lang.hitch(this, this._onClickLegend, k, false/*Use multi series data format*/));
					}
				}
			},

			_createChart : function (data) {
				if (this.chartType === "Bar")
					this._chart = new this._chartJS(this._ctx).Bar(data);
				else if (this.chartType === "Radar")
					this._chart = new this._chartJS(this._ctx).Radar(data);
				else if (this.chartType === "StackedBar")
					this._chart = new this._chartJS(this._ctx).StackedBar(data);
				else // "Line"
					this._chart = new this._chartJS(this._ctx).Line(data);

				if (this.onclickmf || this.onclickmfcontext) {
					on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
				}
			}
		});
	});

}());