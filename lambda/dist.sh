#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd ${SCRIPT_DIR}
rm lambda.zip
cd dist/
zip -r ../lambda.zip *
cd ..
zip -r lambda.zip node_modules/*