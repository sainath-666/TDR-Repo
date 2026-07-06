#!/bin/sh
set -e

PRISMA="node ./node_modules/prisma/build/index.js"

echo "Running database schema sync..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  $PRISMA migrate deploy || echo "WARN: migrate deploy skipped — using existing schema"
else
  $PRISMA db push --skip-generate || echo "WARN: db push skipped"
fi

echo "Starting Next.js server..."
exec node server.js
