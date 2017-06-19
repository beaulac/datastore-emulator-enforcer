'use strict';
const debug = require('debug')('datastore-emulator-enforcer')
    , execSync = require('child_process').execSync
    , emulatorEnvVarKeys = require('./emulator.env.vars.json')
    , dsModuleName = '@google-cloud/datastore';


exports.isEmulatorEnabled = ensureDsEmulatorIsEnabled();


function ensureDsEmulatorIsEnabled() {
    if (require.cache[require.resolve(dsModuleName)]) {
        throw new Error('Datastore was loaded before checking for emulator!');

    } else if (isEmulatorEnabled_()) {
        debug('Datastore Emulator was already enabled');
        return true;
    } else {
        debug('Need to enable Datastore Emulator');
        return enableEmulator_();
    }
}

function isEmulatorEnabled_() {
    return emulatorEnvVarKeys.every(k => process.env[k]);
}

function enableEmulator_() {
    loadDsEmulatorConfig_().forEach(kv => {
        const [key, value] = kv;
        if (emulatorEnvVarKeys.includes(key) && value) {
            process.env[key] = process.env[key] || value;
        } else {
            debug(`Unexpected env-var: ${key} = ${value}`);
        }
    });

    return isEmulatorEnabled_() || failedToEnable_();
}

/**
 * env-init returns shell env var exports e.g. `export DATASTORE_HOST=localhost`
 * @returns {string[][]} Array of key/value tuples.
 */
function loadDsEmulatorConfig_() {
    return execSync('gcloud beta emulators datastore env-init')
        .toString()
        .trim()
        .replace(/export\s+/g, '')
        .split(/\n+/)
        .map(declaration => declaration.split('='));
}

function failedToEnable_() {
    throw new Error('Could not enable datastore emulator!');
}
