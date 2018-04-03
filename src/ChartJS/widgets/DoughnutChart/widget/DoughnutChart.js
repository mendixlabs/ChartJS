import defineWidget from 'widget-base-helpers/helpers/define-widget';
import PieChart from 'PieChart/widget/PieChart';

import '../../ChartJS.scss';

export default defineWidget('DoughnutChart.widget.DoughnutChart', null, {

    _chartClass: 'chartjs-doughnut-chart',

    _chartType: 'doughnut',

}, PieChart);
