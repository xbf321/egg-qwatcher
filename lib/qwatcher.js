'use strict';

const assert = require('assert');
const graphite = require('graphite');
const debug = require('debug')('qwatcher');
const Base = require('sdk-base');
/**
 * 
 * QWatcher 喂数
 * 使用说明
 * 
 * ```
 * // 某个指标计数
 * 
 * # 单指标
 * yield app.qwatcher.recordCount('api_perfect')
 * 
 * # 多指标
 * yield app.qwatcher.recordCount('api_perfect', 'api_entrence')
 * 
 * // 某个指标的时间值
 * 
 * # 单指标
 * yield app.qwatcher.recordTime('api_perfect', 120)
 * # 多指标
 * yield app.qwatcher.recordTime({
 *      dns: 120,
 *      ready: 130
 * })
 * ```
 * 注意: 指标值，不能含有中横线(-)和点(.)，可以含有下划线
 * @class QWatcher
 */
class QWatcher extends Base {
    constructor(options) {
        super({
            // 指定异步启动的方法
            initMethod: 'init',
        });
        this.options = options;
        this.metrics = {};
        this.timeCache = {};
        assert(this.options.projectId, 'should pass options.projectId');
        assert(this.options.host, 'should pass config.host');
        assert(this.options.port, 'should pass config.port');
        assert(this.options.category, 'should pass config.category');
        debug('qwatcher#constructor');
    }

    /**
     * 初始化
     * 
     * @memberof QWatcher
     */
    async init() {
        this.ready(true);
    }

    /**
     * 1分钟内取打点的个数
     * 
     * # 单指标
     * recordCount('error')
     * 
     * # 多指标
     * recordCount('error', 'error2')
     * 
     * @param {string} metric 指标，支持多指标，以 , 号分割
     * @return {any} 存在则添加，没有直接返回
     * @memberof QWatcher
     */
    async recordCount(metric) {
        const arr = metric.split(',');

        if(arr.length === 0){
            return;
        }

        arr.forEach(item => {
            const key = this.handleMetric(item, 'count', 'Sum');
            if (this.metrics[key]) {
                this.metrics[key]++;
            } else {
                this.metrics[key] = 1;
            }
        });
    }

    /**
     * 某个指标时间值
     * 
     * # 单指标
     * recordTime('xx', 120)
     * 
     * # 多指标
     * recordTime({
     *      dns: 10,
     *      ready: 20
     * })
     * 
     * @param {string} metric 指标，支持多指标，多指标用对象表示，时间字段为空
     * @param {int} time 时间
     * @memberof QWatcher
     */
    async recordTime(metric, time) {

        let metricObj = {};
        // time 存在的话，则记录单条数据
        if (time) {
            metricObj[metric] = time;
        } else {
            // 记录多条
            metricObj = Object.assign({}, metric);
        }

        for(let key in metricObj){
            time = parseFloat(metricObj[key]);
            key = this.handleMetric(key, 'time', 'Avg');

            if (!this.timeCache[key]) {
                this.timeCache[key] = {
                    count: 1,
                    time: time,
                };
            } else {
                this.timeCache[key].count++;
                this.timeCache[key].time += time;
            }
            this.metrics[key] = this.timeCache[key].time / this.timeCache[key].count;
        }
    }

    /**
     * 判断对象是否为空对象
     * 
     * @param {object} obj 待检测
     * @return {boolean} true / false
     * @memberof QWatcher
     */
    isEmptyObject(obj) {
        let t;
        for (t in obj) {
            return !1;
        }
        return !0;
    }

    /**
     * 组装 metric 
     * 
     * @param {string} metric 节点
     * @param {string} type 类型
     * @param {string} operation 操作，求和/平均
     * @return {string} metric 组合后的节点
     * @memberof QWatcher
     */
    handleMetric(metric = '', type = '', operation = '') {
        const { category = '', projectId = '' } = this.options;
        metric = metric.replace(' ', '_')
            .replace(/\:/g, '_')
            .replace(/\//g, '_')
            .replace(/\__/g, '_')
            .replace(/^\_/g, '')
            .replace(/\_$/g, '')
            .replace(/\"/g, '')
            .replace(/\'$/g, '')
            .toLowerCase();
        metric = `${category}.${projectId}.${type}.${metric}`;
        metric = operation ? `${metric}.${operation}`: metric;
        return metric;
    }

    /**
     * 发送到Watcher
     * 
     * @memberof QWatcher
     */
    async send() {
        const { host, port } = this.options,
            url = `plaintext://${host}:${port}/`; 
        debug(`qwatcher#send metrics, ${url}, ${JSON.stringify(this.metrics)}`);

        // 如果为空直接返回
        if (this.isEmptyObject(this.metrics)) {
            return;
        }
        const client = graphite.createClient(url);
        client.write(this.metrics, err => {
            if (err) {
                return this.emit('error', err);
            }
            client.end();
            this.emit('clear');
        });
    }

    /**
     * 清除缓存
     * 
     * @memberof QWatcher
     */
    async clear() {
        this.metrics = {};
        this.timeCache = {};
        debug('qwatcher#clear', this.metrics, this.timeCache);
    }
}
module.exports = QWatcher;
