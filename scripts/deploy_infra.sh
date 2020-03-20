#!/usr/bin/env bash

set -xe
sceptre --var-file=variables.yaml \
        --var "environment=${ENV}" \
        --var "iam_role=${AWS_ROLE}" \
        --var "key=${S3_KEY}" \
        --var "artefact_bucket=${ARTEFACT_BUCKET}" \
        launch-env automation-test-environment
       