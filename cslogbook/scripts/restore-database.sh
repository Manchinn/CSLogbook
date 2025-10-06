#!/bin/bash

# Database Restore Script for CS Logbook
# Usage: ./restore-database.sh <backup-file>

if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <backup-file>"
    echo "💡 Example: $0 ./database/backups/backup-20240101-120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1
CONTAINER_NAME="cslogbook-mysql"

# Load environment variables
if [ -f .env.docker ]; then
    export $(cat .env.docker | grep -v '#' | xargs)
fi

echo "🔄 Starting database restore..."
echo "📄 Backup file: $BACKUP_FILE"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ MySQL container is not running!"
    echo "💡 Start it with: docker-compose up -d mysql"
    exit 1
fi

# Confirm restore
echo "⚠️  WARNING: This will replace all data in database '$DB_NAME'"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Determine if file is compressed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "🗜️  Decompressing backup file..."
    RESTORE_COMMAND="zcat $BACKUP_FILE"
else
    RESTORE_COMMAND="cat $BACKUP_FILE"
fi

# Restore database
echo "🔄 Restoring database..."
$RESTORE_COMMAND | docker exec -i $CONTAINER_NAME mysql \
    -u root \
    -p$MYSQL_ROOT_PASSWORD \
    $DB_NAME

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
    echo "🔄 Restarting backend to refresh connections..."
    docker-compose restart backend
else
    echo "❌ Restore failed!"
    exit 1
fi