#!/usr/bin/env bash
# Vercel deployment script - runs prisma db push before build

echo "🚀 Running Prisma database push..."
npx prisma db push --accept-data-loss

echo "✅ Database schema synced!"
