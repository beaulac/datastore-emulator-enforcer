'use strict';
const debug = require('debug')('datastore-emulator-enforcer')
    , execSync = require('child_process').execSync
    , emulatorEnvVarKeys = require('./emulator.env.vars.json');


exports.isEmulatorEnabled = ensureDsEmulatorIsEnabled();


function ensureDsEmulatorIsEnabled() {
    if (wasDatastoreAlreadyLoaded_()) {
        throw Error('Datastore was loaded before checking for emulator!');
    } else if (isEmulatorEnabled_()) {
        debug('Datastore Emulator was already enabled');
        return true;
    } else {
        debug('Need to enable Datastore Emulator');
        return enableEmulator_();
    }
}

function wasDatastoreAlreadyLoaded_() {
    return require.cache[require.resolve('@google-cloud/datastore')];
}

function isEmulatorEnabled_() {
    return emulatorEnvVarKeys.every(k => process.env[k]);
}

function enableEmulator_() {
    loadDsEmulatorConfig_().forEach(setEmulatorEnvVar);

    return isEmulatorEnabled_() || failedToEnable_();
}

function setEmulatorEnvVar(kvTuple) {
    const key = kvTuple[0], value = kvTuple[1];

    if ((emulatorEnvVarKeys.indexOf(key) >= 0) && value) {
        return process.env[key] = process.env[key] || value;
    }
    debug('Unexpected env-var: %s = %s', key, value);
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
    throw Error('Could not enable datastore emulator!');
}
