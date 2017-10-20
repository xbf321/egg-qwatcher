'use strict';

const os = require('os');
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
 * //某个指标计数
 * yield app.qwatcher.recordCount('api_perfect')
 * 
 * //某个指标的时间值
 * yield app.qwatcher.recordTime('api_perfect', 120)
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
        this.hostName = (() => {
            const hostname = os.hostname();
            return hostname.replace('.qunar.com', '').replace(/\./g, '_').toLowerCase();
        })();
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
    * init() {
        this.ready(true);
    }

    /**
     * 某个指标计数
     * 
     * @param {tring} metric 指标
     * @return {any} 存在则添加，没有直接返回
     * @memberof QWatcher
     */
    * recordCount(metric) {
        if (!metric) {
            return;
        }
        metric = this.handleMetric(metric, 'count', 'Sum');
        if (this.metrics[metric]) {
            return this.metrics[metric]++;
        }
        this.metrics[metric] = 1;
    }

    /**
     * 某个指标时间值
     * 
     * @param {string} metric 指标
     * @param {int} time 时间
     * @memberof QWatcher
     */
    * recordTime(metric, time) {
        if (!metric) {
            return;
        }
        metric = this.handleMetric(metric, 'time', 'Avg');
        if (!this.timeCache[metric]) {
            this.timeCache[metric] = {
                count: 1,
                time,
            };
        } else {
            this.timeCache[metric].count++;
            this.timeCache[metric].time += time;
        }
        this.metrics[metric] = this.timeCache[metric].time / this.timeCache[metric].count;
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
        metric = metric.replace(/\./g, '_').replace(/\-/g, '_').toLowerCase();
        metric = `${category}.${projectId}.${type}.${metric}`;
        metric = operation ? `${metric}.${operation}`: metric;
        return metric;
    }

    /**
     * 发送到Watcher
     * 
     * @memberof QWatcher
     */
    * send() {
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
    * clear() {
        this.metrics = {};
        this.timeCache = {};
        debug('qwatcher#clear', this.metrics, this.timeCache);
    }
}
module.exports = QWatcher;
