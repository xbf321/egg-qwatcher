# egg-qwatcher

qunar watcher for egg

## Install

```bash
$ npm i egg-qwatcher --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.qwatcher = {
  enable: true,
  package: 'egg-qwatcher',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.qwatcher = {
    // 项目
    projectId: 'event_node',
    host: 'host',
    port: 2013,
    // 类别
    category: 't.fe.beta'
};
```
> 如果出现错误，会往 common-error.log 中记录，而不会抛出异常。

see [config/config.default.js](config/config.default.js) for more detail.

## Example

记录某个指标次数
```
// 单指标
yield app.qwatcher.recordCount('api_perfect')

// 多指标同时记录
yield app.qwatcher.recordCount('api_perfect', 'api_entrence')
```

记录某个指标的时间值
```
// 单指标
yield app.qwatcher.recordTime('api_perfect', 120)

// 多指标同时记录，比如记录页面加载时间等
yield app.qwatcher.recordTime({
  dns: 10,
  ready: 20
})
```

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)

## Version
2.0.0版本以上为egg2版本插件