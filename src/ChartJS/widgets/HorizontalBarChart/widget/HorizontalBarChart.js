define([
    "dojo/_base/declare",
    "ChartJS/widgets/BarChart/widget/BarChart",
    "dojo/_base/lang",
    "dojo/on"
], function (declare, Core, lang, on) {
    "use strict";

    return declare("ChartJS.widgets.HorizontalBarChart.widget.HorizontalBarChart", [ Core ], {

        _chartType: "horizontalBar"

    });
});

require(["ChartJS/widgets/BarChart/widget/BarChart"]);
