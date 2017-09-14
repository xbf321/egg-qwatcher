'use strict';

/**
 * 参考：https://eggjs.org/zh-cn/advanced/cluster-client.html
 */
const QWatcher = require('./lib/qwatcher');
module.exports = app => {
    app.qwatcher = app.cluster(QWatcher).create(app.config.qwatcher);

    app.beforeStart(function* () {
        yield app.qwatcher.ready();
    });
    app.messenger.on('qwatcher_clear', () => {
        const ctx = app.createAnonymousContext();
        ctx.runInBackground(function* () {
            yield app.qwatcher.clear();
        });
    });
};
