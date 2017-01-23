#!/bin/bash
set -ex
npm install
npm run build

if [[ -z $TESTPILOT_AMO_USER || -z $TESTPILOT_AMO_SECRET ]]; then
  npm run package
else
  rm -f ./web-ext-artifacts/*.xpi
  ./node_modules/.bin/web-ext sign \
    --source-dir dist \
    --api-key $TESTPILOT_AMO_USER \
    --api-secret $TESTPILOT_AMO_SECRET
  mv ./web-ext-artifacts/*.xpi ./signed-addon.xpi
fi
