# Database Backup Script for CS Logbook (PowerShell)
# Usage: .\backup-database.ps1 [backup-name]

param(
    [string]$BackupName = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
)

# Load environment variables from .env.docker
if (Test-Path ".env.docker") {
    Get-Content ".env.docker" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

$BackupDir = "./database/backups"
$ContainerName = "cslogbook-mysql"

# Create backup directory if it doesn't exist
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Host "🔄 Starting database backup..." -ForegroundColor Yellow
Write-Host "📁 Backup name: $BackupName" -ForegroundColor Cyan
Write-Host "📂 Backup directory: $BackupDir" -ForegroundColor Cyan

# Check if container is running
$containerRunning = docker ps --format "table {{.Names}}" | Select-String $ContainerName
if (!$containerRunning) {
    Write-Host "❌ MySQL container is not running!" -ForegroundColor Red
    Write-Host "💡 Start it with: docker-compose up -d mysql" -ForegroundColor Yellow
    exit 1
}

# Get environment variables
$DbName = $env:DB_NAME
$RootPassword = $env:MYSQL_ROOT_PASSWORD

if (!$DbName -or !$RootPassword) {
    Write-Host "❌ Missing environment variables DB_NAME or MYSQL_ROOT_PASSWORD" -ForegroundColor Red
    exit 1
}

# Create backup
$BackupFile = "$BackupDir/$BackupName.sql"
Write-Host "🔄 Creating backup..." -ForegroundColor Yellow

$dockerCmd = "docker exec $ContainerName mysqldump -u root -p$RootPassword --single-transaction --routines --triggers $DbName"
Invoke-Expression $dockerCmd | Out-File -FilePath $BackupFile -Encoding UTF8

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
    Write-Host "📄 File: $BackupFile" -ForegroundColor Cyan
    
    # Show file size
    $Size = (Get-Item $BackupFile).Length / 1MB
    Write-Host "📊 Size: $([math]::Round($Size, 2)) MB" -ForegroundColor Cyan
    
    # Compress backup
    Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force
    Remove-Item $BackupFile
    Write-Host "🗜️  Compressed: $BackupFile.zip" -ForegroundColor Green
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
    exit 1
}

# Clean up old backups (keep last 10)
Write-Host "🧹 Cleaning up old backups..." -ForegroundColor Yellow
$OldBackups = Get-ChildItem "$BackupDir/*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 10
if ($OldBackups) {
    $OldBackups | Remove-Item -Force
    Write-Host "🗑️  Removed $($OldBackups.Count) old backup(s)" -ForegroundColor Green
}
Write-Host "✅ Cleanup completed!" -ForegroundColor Green