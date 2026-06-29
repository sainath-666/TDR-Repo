#!/usr/bin/env bash
curl -s -X POST http://localhost:3592/api/check/resources \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"test","principal":{"id":"deo1","roles":["DEO"],"attr":{"districtCode":"KRISHNA"}},"resources":[{"resource":{"kind":"bond","id":"new","attr":{}},"actions":["create"]}]}'
echo
