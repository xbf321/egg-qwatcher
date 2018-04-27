'use strict';

/**
 * 参考：https://eggjs.org/zh-cn/advanced/cluster-client.html
 */
const QWatcher = require('./lib/qwatcher');

module.exports = agent => {
    agent.qwatcher = agent.cluster(QWatcher).create(agent.config.qwatcher);

    // 出现错误，记录到日志
    agent.qwatcher.on('error', err => {
        agent.coreLogger.error(`[egg-qwatcher] agent ${err}`);
    });

    // 清掉缓存
    agent.qwatcher.on('clear', function () {
        agent.qwatcher.clear();
    });

    agent.beforeStart(async function () {
        await agent.qwatcher.ready();
    });
};
