#!/usr/bin/env bash
curl -s -X POST http://localhost:3592/api/check/resources \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"ret3","principal":{"id":"dir1","roles":["DIRECTOR_LANDS"],"attr":{"districtCode":"ALL"}},"resources":[{"resource":{"kind":"approval","id":"b1","attr":{"status":"PENDING_L3","districtCode":"KRISHNA"}},"actions":["return"]}]}'
echo
