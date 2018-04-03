import defineWidget from 'widget-base-helpers/helpers/define-widget';
import Core from 'Core';
import on from 'dojo/on';
import { hitch } from 'dojo/_base/lang';

import '../../ChartJS.scss';

export default defineWidget('PolarChart.widget.PolarChart', null, {

    _chartType: 'polarArea',

    _chartClass: 'chartjs-polar-chart',

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
                value: +(set.dataset.get(this.seriesylabel)), // eslint-disable-line no-extra-parens
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
        this.log('._createChart');

        this._chart = new this._chartJS(this._ctx, {
            type: this._chartType,
            data: this._createDataSets(data),
            options: {
                title: {
                    display: '' !== this.chartTitle,
                    text: '' !== this.chartTitle ? this.chartTitle : '',
                    fontFamily: this._font,
                    fontSize: this.titleSize,
                },
                responsive: this.responsive,
                responsiveAnimationDuration: 0 < this.responsiveAnimationDuration ? this.responsiveAnimationDuration : 0,
                tooltips: {
                    enabled: this.showTooltips,
                },
                legend: {
                    display: this.showLegend,
                    labels: {
                        fontFamily: this._font,
                    },
                },
                scale: {
                    ticks: {
                        yAxes: [{
                            ticks: {
                                fontFamily: this._font,
                                beginAtZero: this.scaleBeginAtZero,
                            },
                        }],
                    },
                },

                //Boolean - Show a backdrop to the scale label
                scaleShowLabelBackdrop: this.polarScaleShowLabelBackdrop,

                //String - The colour of the label backdrop
                scaleBackdropColor: this.polarScaleBackdropColor,

                //Number - The backdrop padding above & below the label in pixels
                scaleBackdropPaddingY: this.polarScaleBackdropPaddingY,

                //Number - The backdrop padding to the side of the label in pixels
                scaleBackdropPaddingX: this.polarScaleBackdropPaddingX,

                //Boolean - Show line for each value in the scale
                scaleShowLine: this.polarScaleShowLine,

                //Boolean - Stroke a line around each segment in the chart
                segmentShowStroke: this.segmentShowStroke,

                //String - The colour of the stroke on each segement.
                segmentStrokeColor: this.segmentStrokeColor,

                //Number - The width of the stroke value in pixels
                segmentStrokeWidth: this.segmentStrokeWidth,

                //Number - Amount of animation steps
                animationSteps: this.animationSteps,

                //String - Animation easing effect.
                animationEasing: this.animationEasing,

                //Boolean - Whether to animate the rotation of the chart
                animateRotate: this.animateRotate,

                //Boolean - Whether to animate scaling the chart from the centre
                animateScale: this.animateScale,

                legendCallback: this._legendAlternateCallback.bind(this),

                // Show tooltips at all
                showTooltips: this.showTooltips,

                // Custom tooltip?
                customTooltips: false,

                animation: {
                    onComplete: hitch(this, this._animationComplete),
                },

            },
        });

        this.connect(window, 'resize', () => {
            this._resize();
        });

        // Add class to determain chart type
        this._addChartClass(this._chartClass);

        on(this._chart.chart.canvas, 'click', hitch(this, this._onClickChart));
    },

}, Core);
