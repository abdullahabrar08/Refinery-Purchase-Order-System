#!/usr/bin/env bash
# Reset Auth DB: remove container and volume so Postgres re-initializes with pos_dev / users_dev.
# Run from repo root: ./scripts/reset-auth-db.sh

cd "$(dirname "$0")/.."
echo "Stopping containers and removing volumes..."
docker-compose down -v
for v in $(docker volume ls -q | grep auth-db-data); do
  echo "Removing volume: $v"
  docker volume rm "$v" 2>/dev/null || true
done
echo "Starting fresh..."
docker-compose up -d
echo "Waiting for Postgres to be ready..."
sleep 5
docker-compose exec auth-db pg_isready -U pos_dev -d users_dev
echo "Done. Auth DB is ready (user: pos_dev, db: users_dev)."
