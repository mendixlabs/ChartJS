import defineWidget from 'widget-base-helpers/helpers/define-widget';
import BarChart from 'BarChart/widget/BarChart';

import '../../ChartJS.scss';

export default defineWidget('HorizontalBarChart.widget.HorizontalBarChart', null, {

    horizontalStackedBar: false,

    _chartClass: 'chartjs-horizontal-bar-chart',

    _chartType: 'horizontalBar',

}, BarChart);
