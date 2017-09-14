'use strict';

const request = require('supertest');
const mm = require('egg-mock');

describe('test/egg-qwatcher.test.js', () => {
  let app;
  before(() => {
    app = mm.app({
      baseDir: 'apps/egg-qwatcher-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mm.restore);

  it('should GET /', () => {
    return request(app.callback())
      .get('/')
      .expect('hi, eggQwatcher')
      .expect(200);
  });
});
