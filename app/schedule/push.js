'use strict';

module.exports = app => {
    return {
        schedule: {
            interval: app.config.qwatcher.interval || '1m',
            type: 'worker',
        },
        async task(ctx) {
            // 上报到服务器
            await ctx.app.qwatcher.send();
        },
    };
};
