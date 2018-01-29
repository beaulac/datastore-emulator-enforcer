## datastore-emulator-enforcer

Dead simple tool to make sure [@google-cloud/datastore](https://www.npmjs.com/package/@google-cloud/datastore) will target an emulator, so that tests/development won't pollute your production datastore.

To use it, simply `require` it before @google-cloud/datastore, e.g.
```
if (process.env.NODE_ENV !== 'production') {
  require('datastore-emulator-enforcer');
}

var myDatastore = require('@google-cloud/datastore')(/* init options */);
```

The enforcer throws an error if:
* `@google-cloud-datastore` was `require`d before the enforcer (i.e. datastore might already be pointing to production)
* The emulator environment variables were not already present, and they could not be automatically determined & set.

If `process.env` does not already contain all emulator env vars, the enforcer will try to set them by running `gcloud beta emulators datastore env-init`. However, it won't override already-specified values. 

* Auto-determining emulator env vars only works if you're running a local emulator. You need to have installed the [Google Cloud SDK](https://cloud.google.com/sdk/downloads)
* This functionality won't work if you're using the emulator on another host (, docker image, etc) – in that case, env vars must be specified ahead of time.


### License
ISC
