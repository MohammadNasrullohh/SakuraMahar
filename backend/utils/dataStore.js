const { constants: fsConstants } = require('fs');
const fs = require('fs/promises');
const path = require('path');
const { bundledDataDirectory, resolveDataDirectory } = require('./runtimePaths');

const dataDirectory = resolveDataDirectory();
const writeQueues = new Map();

const ensureFile = async (filename, defaultData) => {
  await fs.mkdir(dataDirectory, { recursive: true });

  const filePath = path.join(dataDirectory, filename);
  const bundledFilePath = path.join(bundledDataDirectory, filename);

  try {
    await fs.access(filePath, fsConstants.F_OK);
  } catch (error) {
    try {
      const bundledContent = await fs.readFile(bundledFilePath, 'utf8');
      await fs.writeFile(filePath, bundledContent || JSON.stringify(defaultData, null, 2));
    } catch (sourceError) {
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  return filePath;
};

const readJsonFile = async (filename, defaultData) => {
  const filePath = await ensureFile(filename, defaultData);
  const rawContent = await fs.readFile(filePath, 'utf8');

  if (!rawContent.trim()) {
    return defaultData;
  }

  return JSON.parse(rawContent);
};

const writeJsonFile = async (filename, data) => {
  const filePath = await ensureFile(filename, data);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

const runSerialized = async (filename, operation) => {
  const currentQueue = writeQueues.get(filename) || Promise.resolve();
  const nextQueue = currentQueue.then(operation, operation);

  writeQueues.set(
    filename,
    nextQueue.then(
      () => undefined,
      () => undefined
    )
  );

  return nextQueue;
};

module.exports = {
  readJsonFile,
  runSerialized,
  writeJsonFile
};
