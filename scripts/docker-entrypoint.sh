#!/bin/sh
set -e

PRISMA="node ./node_modules/prisma/build/index.js"

echo "Running database schema sync..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  $PRISMA migrate deploy
else
  $PRISMA db push --skip-generate
fi

echo "Starting Next.js server..."
exec node server.js
