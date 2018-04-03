/*
    Core file

    Have multiple widgets that share code? Use the Core.js file in your widgets by using `import Core from 'Core'`

    Switch this on and off by configuring widget.core : true/false in package.json
*/

import {
    defineWidget,
    log,
    runCallback,
    executePromise,
    execute,
    getData,
} from 'widget-base-helpers';

import { clone, hitch, mixin } from 'dojo/_base/lang';
import { set as styleSet } from 'dojo/dom-style';
import { position } from 'dojo/dom-geometry';
import { set as attrSet } from 'dojo/dom-attr';
import {
    remove as classRemove,
    add as classAdd,
    contains,
} from 'dojo/dom-class';
import { destroy } from 'dojo/dom-construct';
import domQuery from 'dojo/query';

import 'dojo/NodeList-traverse';

import ChartJS from 'chart.js/dist/Chart.bundle.min.js';

import template from './ChartJS.template.html';

export default defineWidget('Core', template, {

    // Set in the modeler
    responsiveRatio: 0,

    // Internal variables
    _chartJS: null,
    _chart: null,
    _ctx: null,
    _dataset: null,
    _datasetCounter: 0,
    _data: null,
    _chartData: null,
    _activeDatasets: null,
    _legendNode: null,
    _mxObj: null,
    _handle: null,
    _dataURL: '',

    _chartType: null,

    _resizeTimer: null,

    _currentContext: null,
    _addedToBody: false,

    _tooltipNode: null,

    constructor() {
        this.log = log.bind(this);
        this._executeCallback = runCallback.bind(this);
        this._execute = execute.bind(this);
        this._executePromise = executePromise.bind(this);
    },

    startup() {
        this.log('startup');

        // Activate chartJS (and clone it, making sure globals are not overwritten for other instances).
        this._chartJS = clone(ChartJS);

        // Fonts
        this._font = this.labelFont || 'Helvetica Neue';

        // Hack to fix the tooltip event, also added 'mouseover'
        this._chartJS.defaults.global.tooltipEvents = [
            'mouseover', 'mouseup', 'mousedown', 'mousemove', 'touchstart', 'touchmove', 'mouseout',
        ];
        this._chartJS.defaults.global.tooltipXOffset = 0;

        // Set object , dataset and datapoint.
        this._dataset = this.datasetentity.split('/')[ 0 ];
        this._datapoint = this.datapointentity && this.datapointentity.split('/')[ 0 ];
        this._data = {};
        this._documentReady = false;

        this._createCtx();

        this._chartData = {
            contextObj: null,
            datasets: [],
        };

        this._activeDatasets = [];

        this.connect(this.mxform, 'resize', () => {
            this._resize();
        });

        if (this.addOnDestroy) {
            this.addOnDestroy(this.cleanup.bind(this));
        } else {
            this.unitialize = this.cleanup.bind(this);
        }
    },

    datasetAdd(dataset, datapoints) {
        this.log('datasetAdd');

        const set = {
            dataset: dataset,
            sorting: +(dataset.get(this.datasetsorting)), //eslint-disable-line no-extra-parens
        };

        if (1 === datapoints.length) {
            set.point = datapoints[ 0 ];
            set.points = datapoints;
        } else {
            set.points = datapoints;
        }

        this._data.datasets.push(set);

        this._datasetCounter--;

        if (0 === this._datasetCounter && !this._destroyed) {
            this._processData();
        }
    },

    update(obj, callback) {
        this.log('update');
        this._mxObj = obj;

        if (null !== this._handle) {
            this.unsubscribe(this._handle);
            this._handle = null;
        }

        if (this._mxObj) {
            logger.debug(this.id + '.update obj ' + this._mxObj.getGuid());

            this._handle = this.subscribe({
                guid: this._mxObj.getGuid(),
                callback: this._loadData.bind(this),
            });

            // Load data again.
            this._loadData();
            styleSet(this.domNode, 'display', '');
        } else {
            styleSet(this.domNode, 'display', 'none');
        }

        this._executeCallback(callback, 'update');
    },

    async _loadData() {
        this.log('_loadData');

        this._data = {
            object: this._mxObj,
            datasets: [],
        };

        try {
            const objs = await this._executePromise(this.datasourcemf, this._mxObj.getGuid());

            if (objs && 0 < objs.length) {
                const obj = objs[ 0 ];
                const guids = obj.get(this._dataset);

                this._data.object = obj;
                this._data.datasets = [];

                if (!guids) {
                    logger.warn(this.id + '._loadData failed, no _dataset. Not rendering Chart');
                    return;
                }

                // Retrieve datasets
                const datasets = await getData({ guids });

                this._datasetCounter = datasets.length;
                this._data.datasets = [];

                for (let j = 0; j < datasets.length; j++) {
                    const dataset = datasets[ j ];
                    let pointguids = dataset.get(this._datapoint);
                    if ('string' === typeof pointguids && '' !== pointguids) {
                        pointguids = [pointguids];
                    }
                    if ('string' !== typeof pointguids) {
                        mx.data.get({
                            guids: pointguids,
                            callback: hitch(this, this.datasetAdd, dataset),
                        });
                    } else {
                        this.datasetAdd(dataset, []);
                    }
                }

            } else {
                console.warn(this.id + '._loadData execution of microflow:' + this.datasourcemf + ' has not returned any objects.');
            }

        } catch (error) {
            console.error(this.id, error);
        }
    },

    async _loadDataSingleSet() {
        this.log('_loadDataSingleSet');

        try {
            const objs = await this._executePromise(this.datasourcemf, this._mxObj.getGuid());

            if (objs && 0 < objs.length) {
                const obj = objs[ 0 ];
                let dataset = null;

                this._data.object = obj;

                const datasets = await getData({ guids: obj.get(this._dataset) });

                this._data.datasets = [];

                for (let j = 0; j < datasets.length; j++) {
                    dataset = datasets[ j ];

                    const set = {
                        dataset: dataset,
                        sorting: +dataset.get(this.datasetsorting),
                    };
                    this._data.datasets.push(set);
                }

                this._processData();
            } else {
                console.warn(this.id +
                    '._loadDataSingleSet execution of microflow:' +
                    this.datasourcemf + ' has not returned any objects.');
            }

        } catch (error) {
            console.error(this.id, error);
        }
    },

    async cleanup() {
        this.log('uninitialize');

        if (null !== this._handle) {
            this.unsubscribe(this._handle);
        }

        if (this._tooltipNode) {
            destroy(this._tooltipNode);
        }

        if (mx.data.release && !mx.version || mx.version && 7 > parseInt(mx.version.split('.')[ 0 ], 10)) {
            // mx.data.release is deprecated in MX7, so this is for MX5 & MX6
            if (this._data && this._data.datasets && 0 < this._data.datasets.length) {
                logger.debug(this.id + '.uninitialize release datasets');
                for (let i = 0; i < this._data.datasets.length; i++) {
                    const data = this._data.datasets[ i ];
                    if (data.dataset && data.dataset.getGuid) {
                        logger.debug(this.id + '.uninitialize release dataset obj ' + data.dataset.getGuid());
                        mx.data.release(data.dataset);
                    }
                    if (data.points && 0 < data.points.length) {
                        for (let j = 0; j < data.points.length; j++) {
                            const point = data.points[ j ];
                            if (point && point.getGuid) {
                                logger.debug(this.id + '.uninitialize release datapoint ' + point.getGuid());
                                mx.data.release(point);
                            }
                        }
                    }
                }
            }

            if (this._data.object && this._data.object.getGuid) {
                if (this.onDestroyMf) {
                    try {
                        await this._executePromise(this.onDestroyMf, this._data.object && this._data.object.getGuid());
                        logger.debug(this.id + '.uninitialize release obj ' + this._data.object.getGuid());
                        mx.data.release(this._data.object);
                    } catch (error) {
                        console.error(this.id, error);
                    }
                } else {
                    logger.debug(this.id + '.uninitialize release obj ' + this._data.object.getGuid());
                    mx.data.release(this._data.object);
                }
            }
        }
    },

    _createCtx() {
        this.log('_createCtx');

        const pos = position(this.domNode.parentElement, false);

        attrSet(this.canvasNode, 'id', 'canvasid_' + this.id);

        if (0 < pos.w && this.responsive) {
            this.canvasNode.width = pos.w;
        } else {
            this.canvasNode.width = this.width;
        }

        if (this.responsive) {
            if (0 < this.responsiveRatio) {
                this.canvasNode.height = Math.round(this.canvasNode.width * (this.responsiveRatio / 100));
            } else if (0 < pos.h) {
                this.canvasNode.height = pos.h;
            } else {
                this.canvasNode.height = this.height;
            }
        } else {
            this.canvasNode.height = this.height;
        }

        this._ctx = this.canvasNode.getContext('2d');
    },

    _processData() {
        this.log('_processData needs to be replaced');
    },

    _createChart() {
        this.log('_createChart needs to be replaced');
    },

    async _onClickChart(evt) {
        this.log('_onClickChart');

        const elements = this._chart.getElementAtEvent(evt);
        if (elements.length) {
            const el = elements[ 0 ];
            const datasetIndex = el._datasetIndex;
            const pointIndex = el._index;
            const dataset = this._data.datasets[ datasetIndex ];
            let datasetObject = dataset ? dataset.dataset : null;
            const dataPointObject = dataset && dataset.points ? dataset.points[ pointIndex ] : null;

            if (this.onclickDataSetMf && datasetObject) {
                if ('pie' === this._chartType || 'doughnut' === this._chartType || 'polarArea' === this._chartType) {
                    // These chartTypes use a single series data set, so the datasetobject is different
                    datasetObject = this._activeDatasets[ pointIndex ].obj;
                }

                this._execute(this.onclickDataSetMf, datasetObject && datasetObject.getGuid());
            }

            if (this.onclickDataPointMf && dataPointObject) {
                this._execute(this.onclickDataPointMf, dataPointObject && dataPointObject.getGuid());
            }
        }

        if (this.onclickmf) {
            this._execute(this.onclickmf, this._mxObj && this._mxObj.getGuid());
        }
    },

    _createLegend(isSingleSeries) {
        this.log('_createLegend');

        if (this.showLegendCustom) {
            this._legendNode.innerHTML = this._chart.generateLegend();

            const listNodes = domQuery('li', this._legendNode);

            if (0 < listNodes.length) {
                for (let k = 0; k < listNodes.length; k++) {
                    this.connect(listNodes[ k ], 'click', hitch(this, this._onClickLegend, k, isSingleSeries));
                }
            }
        }
    },

    _legendCallback(chart) {
        this.log('_legendCallback');

        const text = [];

        text.push('<ul class=\'' + chart.id + '-legend chart-legend\'>');

        if (chart.data.datasets.length) {
            for (let i = 0; i < chart.data.datasets.length; i++) {
                text.push(
                    '<li class=\'chart-legend_item\'><span class=\'chart-legend_bullet\' style=\'background-color:' +
                    chart.data.datasets[ i ].backgroundColor + '\'></span>'
                );
                if (chart.data.datasets[ i ].label) {
                    text.push(chart.data.datasets[ i ].label);
                }
                text.push('</li>');
            }
        }

        text.push('</ul>');

        return text.join('');
    },

    _legendAlternateCallback(chart) {
        this.log('_legendAlternateCallback');

        const text = [];

        text.push('<ul class=\'' + chart.id + '-legend chart-legend\'>');

        if (chart.data.datasets.length) {
            for (let i = 0; i < chart.data.datasets[ 0 ].data.length; ++i) {
                text.push(
                    '<li class=\'chart-legend_item\'><span class=\'chart-legend_bullet\' style=\'background-color:' +
                    chart.data.datasets[ 0 ].backgroundColor[ i ] + '\'></span>'
                );

                if (chart.data.labels[ i ]) {
                    text.push(chart.data.labels[ i ]);
                }
                text.push('</li>');
            }
        }

        text.push('</ul>');
        return text.join('');
    },

    _onClickLegend(idx, isSingleSeries) {
        this.log('_onClickLegend');

        let activeSet = null;
        let activeSetLegend = null;
        const newDatasets = {
            datasets: [],
            labels: this._chartData.labels,
        };

        this._activeDatasets[ idx ].active = !this._activeDatasets[ idx ].active;

        for (let i = 0; i < this._activeDatasets.length; i++) {
            activeSet = this._activeDatasets[ i ];
            activeSetLegend = domQuery('li', this._legendNode)[ activeSet.idx ];

            if (activeSet.active) {
                if (contains(activeSetLegend, 'legend-inactive')) {
                    classRemove(activeSetLegend, 'legend-inactive');
                }

                newDatasets.datasets.push(activeSet.dataset);
            } else if (!contains(activeSetLegend, 'legend-inactive')) {
                classAdd(activeSetLegend, 'legend-inactive');
            }
        }
        if (isSingleSeries) {
            this._createChart(newDatasets.datasets);
        } else {
            this._createChart(newDatasets);
        }
    },

    _createDataSets(data) {
        this.log('_createDataSets');

        const _chartData = {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                hoverBackgroundColor: [],
            }],
        };

        for (let j = 0; j < data.length; j++) {
            _chartData.labels.push(data[ j ].label);
            _chartData.datasets[ 0 ].data.push(data[ j ].value);
            _chartData.datasets[ 0 ].backgroundColor.push(data[ j ].backgroundColor);
            _chartData.datasets[ 0 ].hoverBackgroundColor.push(data[ j ].hoverBackgroundColor);
        }

        return _chartData;
    },

    _sortArrayObj(values) {
        this.log('_sortArrayObj');

        return values.sort((a, b) => {
            const aa = +(a.sorting); //eslint-disable-line no-extra-parens
            const bb = +(b.sorting); //eslint-disable-line no-extra-parens
            if (aa > bb) {
                return 1;
            }
            if (aa < bb) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
    },

    _isNumber(n, attr) {
        return 'function' === typeof n.isNumeric ? n.isNumeric(attr) : n.isNumber(attr);
    },

    _sortArrayMx(values, sortAttr) {
        this.log('_sortArrayMx');

        return values.sort((a, b) => {
            let aa = +(a.get(sortAttr)); //eslint-disable-line no-extra-parens
            let bb = +(b.get(sortAttr)); //eslint-disable-line no-extra-parens
            //if the attribute is numeric
            aa = this._isNumber(a, sortAttr) ? parseFloat(aa) : aa;
            bb = this._isNumber(b, sortAttr) ? parseFloat(bb) : bb;
            if (aa > bb) {
                return 1;
            }
            if (aa < bb) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
    },

    _addChartClass(className) {
        this.log('_addChartClass');
        classRemove(this.domNode, className);
        classAdd(this.domNode, className);
    },

    _resize() {
        this.log('_resize');

        const pos = position(this.domNode.parentElement, false);

        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(() => {
            //Only resize when chart is set to responsive and width and height of parent element > 0
            if (this._chart && this.responsive && 0 < pos.w && 0 < pos.h) {
                this._chart.resize();
            }
        }, 50);
    },

    _hexToRgb(hex, alpha) {
        this.log('_hexToRgb');
        let h = hex;

        if (null !== hex) {
            // From Stackoverflow here: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
            // Expand shorthand form (e.g. '03F') to full form (e.g. '0033FF')
            const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            h = h.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

            const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
            if (regex) {
                const result = {
                    r: parseInt(regex[ 1 ], 16),
                    g: parseInt(regex[ 2 ], 16),
                    b: parseInt(regex[ 3 ], 16),
                };
                return 'rgba(' + result.r + ',' + result.g + ',' + result.b + ',' + alpha + ')';
            }
        } else {
            logger.warn('Empty hex color!');
        }
        return 'rgba(220,220,220,' + alpha + ')';
    },

    _chartOptions(options) {
        this.log('_chartOptions');

        const defaultOptions = {
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
                labels: { fontFamily: this._font },
            },
            maintainAspectRatio: this.maintainAspectRatio,
            showTooltips: this.showTooltips,
            animation: this.chartAnimation ? {
                duration: this.chartAnimation ? this.animationDuration : 0,
                easing: this.animationEasing,
            } : false,
        };

        const opts = mixin(clone(defaultOptions), options);

        return opts;
    },

    _animationComplete() {
        if (this.base64Attr) {
            const base64String = this._getBase64StringFromCanvasWithBackground('white');
            if (base64String) {
                this._mxObj.set(this.base64Attr, base64String);
            }
        }
    },

    /**
         * Get Base64 String From Canvas Node with Background
         * ---
         * @since Dec 7, 2017
         * + returns null if the canvasNode is undefined
         * @author Conner Charlebois
         * @since  10 Nov, 2017
         * @param   {String} backgroundColor - CSS color for the background fill
         * @returns {String} - the base64 String with the background fill applied.
         * @see https://stackoverflow.com/a/44174406/1513051
         *
         */
    _getBase64StringFromCanvasWithBackground(backgroundColor) {
        this.log('_getBase64StringFromCanvasWithBackground');

        if (!this.canvasNode) {
            return null;
        }
        const context = this.canvasNode.getContext('2d');
        const canvas = context.canvas;
        //cache height and width
        const w = canvas.width;
        const h = canvas.height;
        //get the current ImageData for the canvas.
        const data = context.getImageData(0, 0, w, h);
        //store the current globalCompositeOperation
        const compositeOperation = context.globalCompositeOperation;
        //set to draw behind current content
        context.globalCompositeOperation = 'destination-over';
        //set background color
        context.fillStyle = backgroundColor;
        //draw background / rect on entire canvas
        context.fillRect(0, 0, w, h);
        //get the image data from the canvas
        const imageData = canvas.toDataURL('image/jpeg');
        //clear the canvas
        context.clearRect(0, 0, w, h);
        //restore it with original / cached ImageData
        context.putImageData(data, 0, 0);
        //reset the globalCompositeOperation to what it was
        context.globalCompositeOperation = compositeOperation;

        return imageData;
    },

    _restartChart(data) {
        this._chart.stop();
        this._chart.data.datasets = data.datasets;
        this._chart.data.labels = data.labels;
        this._chart.update(1000);
        this._chart.bindEvents(); // tooltips otherwise won't work
    },

});
