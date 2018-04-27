'use strict';

/**
 * 参考：https://eggjs.org/zh-cn/advanced/cluster-client.html
 */
const QWatcher = require('./lib/qwatcher');

module.exports = app => {
    app.qwatcher = app.cluster(QWatcher).create(app.config.qwatcher);

    // 出现错误，记录到日志
    app.qwatcher.on('error', err => {
        app.coreLogger.error(`[egg-qwatcher] app ${err}`);
    });

    // 清掉缓存
    app.qwatcher.on('clear', () => {
        app.qwatcher.clear();
    });

    app.beforeStart(async function () {
        await app.qwatcher.ready();
    });
};
