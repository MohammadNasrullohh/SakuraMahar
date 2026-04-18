#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configHome = path.join(__dirname, '..', '.firebase-config');

fs.mkdirSync(configHome, { recursive: true });
process.env.XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || configHome;
process.env.CONFIGSTORE_DISABLE_GLOBAL = 'true';

require(require.resolve('firebase-tools/lib/bin/firebase.js'));
