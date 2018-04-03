import defineWidget from 'widget-base-helpers/helpers/define-widget';
import Core from 'Core';
import on from 'dojo/on';
import { hitch } from 'dojo/_base/lang';
import { set as htmlSet } from 'dojo/html';

import '../../ChartJS.scss';

export default defineWidget('PieChart.widget.PieChart', null, {

    _chartType: 'pie',

    _chartClass: 'chartjs-pie-chart',

    _processData() {
        this.log('_processData');

        const chartData = [];
        let set = {
            points: [],
        };
        let color = '';
        let highlightcolor = '';
        let point = null;
        let label = '';
        let j = null;

        this._activeDatasets = [];
        this._chartData.datasets = [];
        this._chartData.labels = [];

        const sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

        for (j = 0; j < sets.length; j++) {
            set = sets[ j ];

            color = set.dataset.get(this.seriescolor);
            highlightcolor = this.serieshighlightcolor ? set.dataset.get(this.serieshighlightcolor) : color;

            label = set.dataset.get(this.datasetlabel);
            point = {
                label: label,
                backgroundColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, '0.5') : color,
                hoverBackgroundColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, '0.75') : highlightcolor,
                value: +set.dataset.get(this.seriesylabel),
            };

            chartData.push(point);
            this._activeDatasets.push({
                obj: set.dataset,
                dataset: point,
                idx: j,
                active: true,
            });
        }

        this._createChart(chartData);

        this._createLegend(true);

    },

    _loadData() {
        this._loadDataSingleSet();
    },

    _createChart(data) {
        this.log('_createChart');

        if (this._chart) {
            const set = this._createDataSets(data);
            this._restartChart(set);
        } else {
            const chartProperties = {
                type: this._chartType,
                data: this._createDataSets(data),
                options: this._chartOptions({

                    elements: {
                        arc: {
                            borderColor: this.segmentStrokeColor,
                            borderWidth: this.segmentShowStroke ? this.segmentStrokeWidth : 0,
                        },
                    },

                    animation: {
                        animateRotate: this.animateRotate,
                        animateScale: this.animateScale,
                        duration: this.animationDuration,
                        easing: this.animationEasing,
                        onComplete: hitch(this, this._animationComplete),
                    },

                    legendCallback: this._legendAlternateCallback.bind(this),

                    cutoutPercentage: 'pie' === this._chartType ? 0 : this.percentageInnerCutout,

                }),
            };

            this._chart = new this._chartJS(this._ctx, chartProperties);

            this.connect(window, 'resize', () => {
                this._resize();
            });

            if (this.numberInside && this._numberNode) {
                const content = this._data.object.get(this.numberInside);
                htmlSet(this._numberNode, null !== content ? content.toString() : '');
            }

            // Add class to determain chart type
            this._addChartClass(this._chartClass);

            on(this._chart.chart.canvas, 'click', hitch(this, this._onClickChart));
        }
    },

}, Core);
