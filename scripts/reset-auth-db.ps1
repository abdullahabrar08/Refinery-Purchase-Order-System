# Reset Auth DB: remove container and volume so Postgres re-initializes with pos_dev / users_dev.
# Run from repo root: .\scripts\reset-auth-db.ps1

Set-Location $PSScriptRoot\..
Write-Host "Stopping containers and removing volumes..."
docker-compose down -v
$volumes = docker volume ls -q | Where-Object { $_ -match "auth-db-data" }
foreach ($v in $volumes) {
    Write-Host "Removing volume: $v"
    docker volume rm $v 2>$null
}
Write-Host "Starting fresh..."
docker-compose up -d
Write-Host "Waiting for Postgres to be ready..."
Start-Sleep -Seconds 5
docker-compose exec auth-db pg_isready -U pos_dev -d users_dev
Write-Host "Done. Auth DB is ready (user: pos_dev, db: users_dev)."
