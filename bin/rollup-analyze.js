#!/usr/bin/env babel-node
/* eslint-disable */

import rollupConfig from '../rollup.config.js';
import { rollup } from 'rollup';
import * as rollupAnalyzer from 'rollup-analyzer';

const processBundles = (err, bundlePaths) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  let rollupCache;
  Promise.all(bundlePaths.map(bundlePath => {
    const bundleDest = bundlePath.replace('src', 'dist');
    return rollup({
      ...rollupConfig,
      entry: bundlePath,
      cache: rollupCache
    }).then(bundle => rollupAnalyzer.formatted(bundle).then(result => {
      console.log(result);
      return bundle;
    })).then(bundle => bundle.write({
      format: rollupConfig.format,
      dest: bundleDest
    }));
  })).then(result => {
   console.log(`Built ${result.length} bundles`);
  }).catch(err => {
   console.error('err', err);
  })
};

if (process.argv.length > 2) {
  processBundles(null, process.argv.slice(2));
}
