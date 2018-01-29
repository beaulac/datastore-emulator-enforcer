'use strict';
const debug = require('debug')
    , chai = require('chai')
    , expect = chai.expect
    , sinon = require('sinon')
    , randomString = () => Math.random().toString(36).slice(2)
    , emulatorEnvVarKeys = require('../emulator.env.vars.json');

let oldEnv;
before(() => {
    debug.enable('datastore-emulator-enforcer');
    oldEnv = process.env;
    process.env = {};
});
after(() => {
    debug.disable('datastore-emulator-enforcer');
    return process.env = oldEnv;
});

describe('Datastore Emulator Enforcer', function () {
    const emulatorEnforcerPath = require.resolve('../');
    let sandbox;

    function anEnvVarFixture_() {
        const fixture = {};
        emulatorEnvVarKeys.forEach(key => fixture[key] = randomString());
        return fixture;
    }

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        emulatorEnvVarKeys.forEach(key => delete process.env[key]);
        delete require.cache[emulatorEnforcerPath];
        delete require.cache[require.resolve('@google-cloud/datastore')];
        sandbox.restore();
    });


    it('throws an error if datastore module was loaded before it', function () {
        require('@google-cloud/datastore');

        expect(() => require('../')).to.throw('Datastore was loaded before checking for emulator!');
    });


    it('throws an error if env-init does not contain all required env vars', function () {

        sandbox.stub(require('child_process'), 'execSync')
               .withArgs('gcloud beta emulators datastore env-init')
               .returns(`export DATASTORE_EMULATOR_HOST=localhost:8081
export DATASTORE_EMULATOR_HOST_PATH=localhost:8081/datastore`);

        expect(() => require('../')).to.throw('Could not enable datastore emulator!');
    });


    it('does not attempt to enable emulator if it was already enabled', function () {
        Object.assign(process.env, anEnvVarFixture_());

        const spy = sandbox.stub(require('child_process'), 'execSync');

        expect(spy.callCount).to.equal(0);
        expect(require('../').isEmulatorEnabled).to.be.true;
    });


    it('sets process env vars based on env-init output', function () {
        const expected = anEnvVarFixture_();

        sandbox.stub(require('child_process'), 'execSync')
               .withArgs('gcloud beta emulators datastore env-init')
               .returns(`export DATASTORE_DATASET=${expected.DATASTORE_DATASET}
export DATASTORE_EMULATOR_HOST=${expected.DATASTORE_EMULATOR_HOST}
export DATASTORE_EMULATOR_HOST_PATH=${expected.DATASTORE_EMULATOR_HOST_PATH}
export DATASTORE_HOST=${expected.DATASTORE_HOST}
export DATASTORE_PROJECT_ID=${expected.DATASTORE_PROJECT_ID}`);

        expect(require('../').isEmulatorEnabled).to.be.true;
        expect(process.env).to.include(expected);
    });

    it('does not override specified env vars with env-init output', function () {
        const envInitOutput = anEnvVarFixture_();

        const expected = Object.assign({}, envInitOutput);
        expected['DATASTORE_EMULATOR_HOST'] = process.env['DATASTORE_EMULATOR_HOST'] = 'Specified already!';

        sandbox.stub(require('child_process'), 'execSync')
               .withArgs('gcloud beta emulators datastore env-init')
               .returns(`export DATASTORE_DATASET=${envInitOutput.DATASTORE_DATASET}
export DATASTORE_EMULATOR_HOST=${envInitOutput.DATASTORE_EMULATOR_HOST}
export DATASTORE_EMULATOR_HOST_PATH=${envInitOutput.DATASTORE_EMULATOR_HOST_PATH}
export DATASTORE_HOST=${envInitOutput.DATASTORE_HOST}
export DATASTORE_PROJECT_ID=${envInitOutput.DATASTORE_PROJECT_ID}`);


        expect(require('../').isEmulatorEnabled).to.be.true;
        expect(process.env).to.include(expected);
    });


    it('ignores extra values from env-init command', function () {
        const expected = anEnvVarFixture_();

        sandbox.stub(require('child_process'), 'execSync')
               .withArgs('gcloud beta emulators datastore env-init')
               .returns(`a prefix
export DATASTORE_DATASET=${expected.DATASTORE_DATASET}
export DATASTORE_EMULATOR_HOST=${expected.DATASTORE_EMULATOR_HOST}
an infix
export DATASTORE_EMULATOR_HOST_PATH=${expected.DATASTORE_EMULATOR_HOST_PATH}
export DATASTORE_HOST=${expected.DATASTORE_HOST}
export DATASTORE_PROJECT_ID=${expected.DATASTORE_PROJECT_ID}
a suffix`);

        expect(require('../').isEmulatorEnabled).to.be.true;
        expect(process.env).to.include(expected);
    });
});
