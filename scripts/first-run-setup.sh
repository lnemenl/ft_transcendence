#!/usr/bin/env bash
set -e

echo "🚀 Starting full setup and tests..."

# Ensure a clean slate
docker compose down -v --remove-orphans

# Rebuild everything fresh
docker compose up --build -d

# Give Prisma a moment to migrate inside container
echo "⏳ Waiting for container startup..."
sleep 5

# Run tests inside the backend container
docker compose exec backend npm run test:coverage

echo "✅ All tests finished. Your app and DB are ready."
