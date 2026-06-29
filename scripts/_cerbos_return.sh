#!/usr/bin/env bash
curl -s -X POST http://localhost:3592/api/check/resources \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"ret","principal":{"id":"tah1","roles":["DY_TAHSILDAR"],"attr":{"districtCode":"KRISHNA"}},"resources":[{"resource":{"kind":"approval","id":"b1","attr":{"status":"PENDING_L1","districtCode":"KRISHNA"}},"actions":["return","approve"]}]}'
echo
