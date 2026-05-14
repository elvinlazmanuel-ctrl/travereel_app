#!/bin/bash

# Database Migration Helper Script
# Prepares project for PostgreSQL migration

echo "🗄️  Travereel Database Migration Helper"
echo "========================================"
echo ""

# Check current database
if grep -q "sqlite" prisma/schema.prisma; then
  echo "📍 Current database: SQLite"
else
  echo "✅ Already using PostgreSQL"
  exit 0
fi

echo ""
echo "This script will:"
echo "1. Create a backup of current SQLite database"
echo "2. Show you the changes needed for PostgreSQL"
echo "3. Generate migration commands"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration cancelled"
  exit 1
fi

# Step 1: Backup
echo ""
echo "📦 Step 1: Creating backup..."
BACKUP_FILE="db/travel-backup-$(date +%Y%m%d-%H%M%S).db"
cp db/travel.db "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Step 2: Show changes needed
echo ""
echo "📝 Step 2: Changes needed for PostgreSQL"
echo ""
echo "File: prisma/schema.prisma"
echo "Change line 6:"
echo "  FROM: provider = \"sqlite\""
echo "  TO:   provider = \"postgresql\""
echo ""
echo "File: .env"
echo "Change:"
echo "  FROM: DATABASE_URL=file:./db/travel.db"
echo "  TO:   DATABASE_URL=postgresql://user:password@host:5432/travereel"
echo ""

# Step 3: Generate commands
echo "🔧 Step 3: Run these commands after setting up PostgreSQL:"
echo ""
echo "  # 1. Update .env with your PostgreSQL URL"
echo "  nano .env"
echo ""
echo "  # 2. Update Prisma schema"
echo "  # Change provider to postgresql in prisma/schema.prisma"
echo ""
echo "  # 3. Generate Prisma Client"
echo "  bun run db:generate"
echo ""
echo "  # 4. Push schema to PostgreSQL"
echo "  bun run db:push"
echo ""

# Step 4: Provider recommendations
echo "💡 PostgreSQL Providers:"
echo ""
echo "  1. Supabase (Free) - supabase.com"
echo "     • 500MB database"
echo "     • Built-in auth & storage"
echo ""
echo "  2. Neon (Free) - neon.tech"
echo "     • 512MB storage"
echo "     • Serverless PostgreSQL"
echo ""
echo "  3. Railway (\$5/mo) - railway.app"
echo "     • 1GB storage"
echo "     • Easy deployment"
echo ""

echo "========================================"
echo "✅ Migration preparation complete!"
echo ""
echo "Next steps:"
echo "1. Choose a PostgreSQL provider"
echo "2. Create database and get connection URL"
echo "3. Update .env and schema.prisma"
echo "4. Run the commands above"
echo ""
echo "📖 See MIGRATION_GUIDE.md for detailed instructions"
