'use strict';

/**
 * 参考：https://eggjs.org/zh-cn/advanced/cluster-client.html
 */
const QWatcher = require('./lib/qwatcher');
module.exports = agent => {
    agent.qwatcher = agent.cluster(QWatcher).create(agent.config.qwatcher);

    agent.beforeStart(function* () {
        yield agent.qwatcher.ready();
    });
};
