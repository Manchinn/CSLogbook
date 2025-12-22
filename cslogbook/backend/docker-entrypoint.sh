#!/bin/sh
set -e

# Run migrations
echo "Running database migrations..."
npx sequelize-cli db:migrate

# Execute the main container command
echo "Starting application..."
exec "$@"
