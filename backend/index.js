const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const app = require('./app');

setGlobalOptions({
  region: process.env.FUNCTION_REGION || 'asia-southeast2',
  memory: '512MiB',
  timeoutSeconds: 60,
  maxInstances: 10
});

exports.api = onRequest(app);
