const os = require('os');
const path = require('path');

const backendRoot = path.join(__dirname, '..');
const bundledDataDirectory = path.join(backendRoot, 'data');
const bundledUploadsDirectory = path.join(backendRoot, 'uploads');

const isServerlessRuntime = () =>
  Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

const resolveWritableRoot = () =>
  process.env.SAKURA_RUNTIME_ROOT ||
  (isServerlessRuntime() ? path.join(os.tmpdir(), 'sakura-mahar-runtime') : backendRoot);

const resolveDataDirectory = () =>
  process.env.SAKURA_DATA_DIR || path.join(resolveWritableRoot(), 'data');

const resolveUploadsDirectory = () =>
  process.env.SAKURA_UPLOADS_DIR || path.join(resolveWritableRoot(), 'uploads');

module.exports = {
  bundledDataDirectory,
  bundledUploadsDirectory,
  isServerlessRuntime,
  resolveDataDirectory,
  resolveUploadsDirectory
};
