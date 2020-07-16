#!/bin/bash
set -ex
npm install

NODE_ENV=production npm run package
# rm -f ./web-ext-artifacts/*.xpi
# ./node_modules/.bin/web-ext sign \
#   --source-dir dist \
#   --api-key $WEB_EXT_API_KEY \
#   --api-secret $WEB_EXT_API_SECRET
