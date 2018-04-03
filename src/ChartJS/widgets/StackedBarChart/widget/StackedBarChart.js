import defineWidget from 'widget-base-helpers/helpers/define-widget';
import BarChart from 'BarChart/widget/BarChart';

import '../../ChartJS.scss';

export default defineWidget('StackedBarChart.widget.StackedBarChart', null, {

    _chartClass: 'chartjs-stacked-bar-chart',

    stacked: true,

    _createSet(label, color, highlightcolor, points) {
        return {
            label: this.scaleShowLabelsBottom ? label : "",
            backgroundColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, "0.5") : color,
            borderColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, "0.5") : color,
            pointColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, "0.8") : color,
            hoverBackgroundColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, "0.75") : highlightcolor,
            hoverBorderColor: this.seriesColorReduceOpacity ? this._hexToRgb(highlightcolor, "1") : highlightcolor,
            data: points,
        };
    },

}, BarChart);
