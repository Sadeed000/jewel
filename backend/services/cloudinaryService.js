const crypto = require('crypto');
const AppError = require('../utils/AppError');

const getConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError('Cloudinary uploads are not configured. Set the cloud name, API key and API secret on the server.', 503);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) throw new AppError('Invalid Cloudinary cloud name.', 503);
  return { cloudName, apiKey, apiSecret };
};

const signature = (params, secret) => crypto.createHash('sha256')
  .update(Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&') + secret).digest('hex');

const cloudRequest = async (resourceType, action, params, file) => {
  const { cloudName, apiKey, apiSecret } = getConfig();
  const fields = { ...params, timestamp: String(Math.floor(Date.now() / 1000)) };
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  form.append('api_key', apiKey);
  form.append('signature', signature(fields, apiSecret));
  if (file) form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'media');
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/${action}`, {
      method: 'POST', body: form, signal: AbortSignal.timeout(resourceType === 'video' ? 120000 : 60000),
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new AppError('Cloudinary could not process the upload. Check the server credentials and account limits.', 502);
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Cloudinary could not be reached. Please try uploading again.', 502);
  }
};

const uploadAsset = async (file) => {
  const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
  const result = await cloudRequest(resourceType, 'upload', {
    folder: 'aurelia/products', public_id: crypto.randomUUID(),
  }, file);
  if (!result.secure_url?.startsWith('https://res.cloudinary.com/')) {
    throw new AppError('Cloudinary did not return a secure media URL.', 502);
  }
  return {
    url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type,
    filename: file.originalname, size: result.bytes, mimetype: file.mimetype,
    width: result.width, height: result.height, ...(result.duration != null ? { duration: result.duration } : {}),
  };
};

const deleteAsset = (asset) => cloudRequest(asset.resourceType, 'destroy', { public_id: asset.publicId });

const uploadBatch = async (files) => {
  const uploaded = [];
  try {
    for (const file of files) uploaded.push(await uploadAsset(file));
    return uploaded;
  } catch (error) {
    // Roll back only assets created by this request; existing media is untouched.
    await Promise.allSettled(uploaded.map(deleteAsset));
    throw error;
  }
};

module.exports = { getConfig, uploadAsset, uploadBatch, deleteAsset, signature };
