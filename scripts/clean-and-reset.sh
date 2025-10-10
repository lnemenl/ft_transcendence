#!/usr/bin/env bash
set -e

echo "Cleaning up everything..."
docker compose down --remove-orphans --volumes --rmi all || true

echo "Removing old local databases..."
rm -rf backend/database/*.db

# Ensure database folder exists
mkdir -p backend/database

echo "Rebuilding migrations..."
cd backend
npx prisma migrate dev --name init
cd ..

echo "Cleanup and migration complete! You can now run:"
echo "   npm run test"
