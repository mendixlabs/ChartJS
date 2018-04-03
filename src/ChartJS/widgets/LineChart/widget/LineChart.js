import defineWidget from 'widget-base-helpers/helpers/define-widget';
import Core from 'Core';
import on from 'dojo/on';
import { hitch } from 'dojo/_base/lang';

import '../../ChartJS.scss';

export default defineWidget('LineChart.widget.LineChart', null, {

    _chartType: 'line',

    _chartClass: 'chartjs-line-chart',

    _processData() {
        this.log('._processData');

        let points = null;
        let set = {
            points: [],
        };
        const xlabels = [];
        let xlabelsSet = false;
        let color = '';
        let highlightcolor = '';
        let label = '';
        let j = null;
        let i = null;
        let k = null;
        let _set = null;
        let maxpoints = 0;

        this._chartData.datasets = [];
        this._chartData.labels = [];
        const sets = this._data.datasets = this._sortArrayObj(this._data.datasets);

        for (j = 0; j < sets.length; j++) {
            set = sets[ j ];
            if (set.points.length > maxpoints) {
                maxpoints = set.points.length;
            }
        }

        for (j = 0; j < sets.length; j++) {
            set = sets[ j ];

            points = [];
            if (0 === set.points.length) {
                for (k = 0; k < maxpoints; k++) {
                    points.push(0);
                }
                logger.warn(this.id + ' - empty dataset');
                continue;
            }

            set.points = this._sortArrayMx(set.points, this.sortingxvalue);
            color = set.dataset.get(this.seriescolor);
            highlightcolor = this.serieshighlightcolor ? set.dataset.get(this.serieshighlightcolor) : color;

            label = set.dataset.get(this.datasetlabel);

            for (i = 0; i < set.points.length; i++) {
                if (!xlabelsSet) {
                    xlabels.push(true === this.scaleShowLabelsBottom ? set.points[ i ].get(this.seriesxlabel) : '');
                }

                const pointvalue = set.points[ i ].get(this.seriesylabel);
                if ('' === pointvalue) {
                    points.push(null);
                } else {
                    points.push(+pointvalue); // Convert to number, so the stackedbar doesnt break!
                }
                //points.push(+(set.points[i].get(this.seriesylabel))); // Convert to integer, so the stackedbar doesnt break!
            }

            if (!xlabelsSet) {
                xlabelsSet = true;
            }

            let _bezier;
            try {
                _bezier = parseFloat(this.bezierCurveTension);
            } catch (e) {
                _bezier = 0.4;
            }

            _set = {
                label: true === this.scaleShowLabelsBottom ? label : '',
                backgroundColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, '0.2') : color,
                borderColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, '0.5') : color,
                pointColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, '0.8') : color,
                pointBorderColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, '0.8') : color,
                pointHoverBackgroundColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, '0.75') : highlightcolor,
                pointHoverBorderColor: this.seriesColorReduceOpacity ? this._hexToRgb(highlightcolor, '1') : highlightcolor,
                data: points,
                fill: this.seriescolorfilled,
                tension: this.bezierCurve ? _bezier : 0,

            };
            this._chartData.datasets.push(_set);
            this._activeDatasets.push({
                dataset: _set,
                idx: j,
                active: true,
            });
        }
        this._chartData.labels = xlabels;

        this._createChart(this._chartData);

        this._createLegend(false);
    },

    _createChart(data) {
        this.log('._createChart');

        if (this._chart) {
            this._restartChart(data);// tooltips otherwise won't work
        } else {

            const ticksOptions = {
                fontFamily: this._font,
                beginAtZero: this.scaleBeginAtZero,
                display: this.scaleShowLabels,
                callback: value => {
                    const round = parseInt(this.roundY, 10);
                    if (!isNaN(round) && 0 <= round) {
                        return Number(value).toFixed(round);
                    }
                    return value;
                },
            };
            if (this.maxYValue) {
                ticksOptions.max = this.maxYValue * 1;
            }

            let lineWidth = parseFloat(this.scaleLineWidth);
            if (isNaN(lineWidth)) {
                lineWidth = 1.0;
            }

            const chartProperties = {
                type: this._chartType,
                data: data,
                options: this._chartOptions({

                    scales: {
                        yAxes: [{
                            display: this.scaleShow,
                            //If stacked is set to true, the Y-axis needs to be stacked for it to work
                            stacked: this.isStacked,
                            scaleLabel: {
                                display: '' !== this.yLabel,
                                labelString: '' !== this.yLabel ? this.yLabel : '',
                                fontFamily: this._font,
                            },
                            gridLines: {
                                display: this.scaleShowHorizontalLines,
                                color: this.scaleGridLineColor,
                                lineWidth,
                            },
                            ticks: ticksOptions,
                        }],
                        xAxes: [{
                            display: this.scaleShow,
                            scaleLabel: {
                                display: '' !== this.xLabel,
                                labelString: '' !== this.xLabel ? this.xLabel : '',
                                fontFamily: this._font,
                            },
                            gridLines: {
                                display: this.scaleShowVerticalLines,
                                color: this.scaleGridLineColor,
                                lineWidth,
                            },
                            type: 'category',
                            id: 'x-axis-0',
                            ticks: {
                                display: this.scaleShowLabelsBottom,
                                fontFamily: this._font,
                                maxTicksLimit: 0 < this.maxTickSize ? this.maxTickSize : null,
                            },
                        }],
                    },

                    elements: {
                        point: {
                            radius: this.pointDot ? this.pointRadius : 0,
                            borderWidth: this.pointDot ? this.pointBorderWidth : 0,
                            hitRadius: this.pointHitRadius,
                            hoverRadius: this.pointHoverRadius,
                            hoverBorderWidth: this.pointHoverBorderWidth,
                        },
                    },

                    //Boolean - Whether or not to render as a stacked chart
                    stacked: this.isStacked,

                    //Boolean - Whether to show a stroke for datasets
                    datasetStroke: this.datasetStroke,

                    //Number - Pixel width of dataset stroke
                    datasetStrokeWidth: this.datasetStrokeWidth,

                    //Boolean - Whether to fill the dataset with a colour
                    datasetFill: this.datasetFill,

                    legendCallback: this._legendCallback.bind(this),

                    animation: {
                        onComplete: hitch(this, this._animationComplete),
                    },
                }),
            };

            if (this.scaleBeginAtZero) {
                chartProperties.options.scales.yAxes[ 0 ].ticks.suggestedMin = 0;
            }

            this._chart = new this._chartJS(this._ctx, chartProperties);

            this.connect(window, 'resize', () => {
                this._resize();
            });

            // Add class to determain chart type
            this._addChartClass(this._chartClass);

            on(this._chart.chart.canvas, 'click', hitch(this, this._onClickChart));
        }
    },
}, Core);
