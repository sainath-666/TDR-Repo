#!/usr/bin/env bash
curl -s -X POST http://localhost:3592/api/check/resources \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"upload-test","principal":{"id":"deo1","roles":["DEO"],"attr":{"districtCode":"KRISHNA"}},"resources":[{"resource":{"kind":"bond","id":"b1","attr":{"status":"DRAFT","districtCode":"Annamaya"}},"actions":["upload_document"]}]}'
echo
