'use strict';

module.exports = app => {
    return {
        schedule: {
            interval: app.config.qwatcher.interval || '1m',
            type: 'worker',
        },
        * task(ctx) {
            // 上报到服务器
            yield ctx.app.qwatcher.send();
        },
    };
};
