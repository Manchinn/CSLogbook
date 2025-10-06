#!/bin/bash

# Database Backup Script for CS Logbook
# Usage: ./backup-database.sh [backup-name]

# Load environment variables
if [ -f .env.docker ]; then
    export $(cat .env.docker | grep -v '#' | xargs)
fi

# Set default values
BACKUP_NAME=${1:-"backup-$(date +%Y%m%d-%H%M%S)"}
BACKUP_DIR="./database/backups"
CONTAINER_NAME="cslogbook-mysql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "🔄 Starting database backup..."
echo "📁 Backup name: $BACKUP_NAME"
echo "📂 Backup directory: $BACKUP_DIR"

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ MySQL container is not running!"
    echo "💡 Start it with: docker-compose up -d mysql"
    exit 1
fi

# Create backup
docker exec $CONTAINER_NAME mysqldump \
    -u root \
    -p$MYSQL_ROOT_PASSWORD \
    --single-transaction \
    --routines \
    --triggers \
    $DB_NAME > "$BACKUP_DIR/$BACKUP_NAME.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "📄 File: $BACKUP_DIR/$BACKUP_NAME.sql"
    
    # Show file size
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.sql" | cut -f1)
    echo "📊 Size: $SIZE"
    
    # Compress backup
    gzip "$BACKUP_DIR/$BACKUP_NAME.sql"
    echo "🗜️  Compressed: $BACKUP_DIR/$BACKUP_NAME.sql.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups (keep last 10)
echo "🧹 Cleaning up old backups..."
cd $BACKUP_DIR
ls -t *.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm
echo "✅ Cleanup completed!"