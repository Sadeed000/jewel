const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const express = require('express');
const { once } = require('events');
const cloudinary = require('../services/cloudinaryService');
const { productCreate } = require('../validators/miscValidators');

const configure = (t) => {
  for (const [key, value] of Object.entries({ CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret' })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => previous === undefined ? delete process.env[key] : process.env[key] = previous);
  }
};

test('requires Cloudinary configuration rather than saving files locally', (t) => {
  configure(t);
  delete process.env.CLOUDINARY_CLOUD_NAME;
  assert.throws(cloudinary.getConfig, (error) => error.statusCode === 503);
});

test('signs image and video uploads server-side and returns secure media URLs', async (t) => {
  configure(t);
  t.mock.method(global, 'fetch', async (url, options) => {
    const type = url.includes('/video/') ? 'video' : 'image';
    assert.equal(options.body.get('api_key'), 'test-key');
    assert.equal(options.body.get('api_secret'), null);
    const params = { folder: options.body.get('folder'), public_id: options.body.get('public_id'), timestamp: options.body.get('timestamp') };
    assert.equal(options.body.get('signature'), cloudinary.signature(params, 'test-secret'));
    assert(options.body.get('file').size > 0);
    return Response.json({ secure_url: `https://res.cloudinary.com/test-cloud/${type}/upload/test.${type === 'video' ? 'mp4' : 'png'}`, public_id: 'aurelia/products/test', resource_type: type, bytes: 123, width: 100, height: 100, ...(type === 'video' ? { duration: 2 } : {}) });
  });
  for (const mimetype of ['image/png', 'video/mp4']) {
    const asset = await cloudinary.uploadAsset({ buffer: Buffer.from('test file'), mimetype, originalname: 'test' });
    assert(asset.url.startsWith('https://res.cloudinary.com/'));
    assert.equal(asset.resourceType, mimetype.split('/')[0]);
    assert(!JSON.stringify(asset).includes('test-secret'));
  }
  assert.equal(cloudinary.signature({ timestamp: '100', folder: 'aurelia/products' }, 'test-secret'), crypto.createHash('sha256').update('folder=aurelia/products&timestamp=100test-secret').digest('hex'));
});

test('rolls back newly uploaded batch assets if a later upload fails', async (t) => {
  configure(t);
  let uploads = 0, deletions = 0;
  t.mock.method(global, 'fetch', async (url, options) => {
    if (url.endsWith('/destroy')) {
      deletions++;
      assert.equal(options.body.get('public_id'), 'aurelia/products/new');
      return Response.json({ result: 'ok' });
    }
    uploads++;
    if (uploads === 2) return Response.json({ error: { message: 'Invalid credentials test-secret' } }, { status: 401 });
    return Response.json({ secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/new.png', public_id: 'aurelia/products/new', resource_type: 'image', bytes: 10 });
  });
  const file = { buffer: Buffer.from('test'), mimetype: 'image/png', originalname: 'test.png' };
  await assert.rejects(cloudinary.uploadBatch([file, file]), (error) => error.statusCode === 502 && !error.message.includes('test-secret'));
  assert.equal(deletions, 1);
});

test('product validation accepts up to three secure videos', () => {
  const base = { name: 'Sample ring', category: 'gold', type: 'rings', price: 100, metal: 'Gold-tone', purity: 'Sample', weight: 'TBC', description: 'Sample product', coverImages: ['https://res.cloudinary.com/test-cloud/image/upload/a.png'] };
  assert.equal(productCreate.validate({ ...base, videos: ['https://res.cloudinary.com/test-cloud/video/upload/a.mp4'] }).error, undefined);
  assert(productCreate.validate({ ...base, videos: ['http://example.com/a.mp4'] }).error);
  assert(productCreate.validate({ ...base, videos: Array(4).fill('https://res.cloudinary.com/test-cloud/video/upload/a.mp4') }).error);
});

test('image and video upload routes still require authentication', async (t) => {
  const app = express();
  app.use('/uploads', require('../routes/uploadRoutes'));
  app.use(require('../middlewares/errorHandler'));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  for (const route of ['/uploads', '/uploads/videos']) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${route}`, { method: 'POST' });
    assert.equal(response.status, 401);
  }
});
