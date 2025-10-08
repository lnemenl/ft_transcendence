#!/usr/bin/env bash
set -e

echo "🧹 Cleaning up everything..."

# Stop all running containers and remove volumes
docker compose down -v --remove-orphans

# Remove any dangling images, containers, and cache
docker system prune -af

# Remove any leftover local SQLite databases and Prisma migrations
echo "🗑️ Removing old local databases and migrations..."
rm -rf backend/database/*.db
rm -rf backend/prisma/migrations
rm -rf backend/node_modules

echo "✅ Cleanup complete!"
