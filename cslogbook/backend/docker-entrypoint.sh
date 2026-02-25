#!/bin/sh
set -e

# Run migrations
echo "Running database migrations..."
npm run migrate:prod

# Execute the main container command
echo "Starting application..."
exec "$@"
