#!/usr/bin/env bash
# Send one test event to Hardal from a terminal and print the response.
# This creates a real (test) event in the source. Use a test source or label it clearly.
# Usage: HRD_URL=https://analytics.example.com HRD_TENANT_ID=... HRD_SOURCE_ID=... ./verify-collect.sh
set -euo pipefail
: "${HRD_URL:?set HRD_URL to the collection URL from Setup}"
: "${HRD_TENANT_ID:?set HRD_TENANT_ID}"
: "${HRD_SOURCE_ID:?set HRD_SOURCE_ID}"
NOW_MS=$(($(date +%s) * 1000))
curl -sS -w '\nHTTP %{http_code}\n' -X POST "${HRD_URL%/}/collect" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" \
  -H "x-hrd-consent: denied" \
  --data-binary @- <<JSON
{
  "tenantId": "${HRD_TENANT_ID}",
  "type": "event",
  "eventName": "hardal_setup_test",
  "payload": {
    "sourceId": "${HRD_SOURCE_ID}",
    "url": "https://example.com/hardal-setup-test",
    "timestamp": ${NOW_MS},
    "data": { "test": true }
  }
}
JSON
# Expect HTTP 202 and "accepted": 1. "skipped": true comes with a reason.
