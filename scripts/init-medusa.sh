#!/bin/bash
set -e

EMAIL="${MEDUSA_ADMIN_EMAIL:-admin@influenced.local}"
PASSWORD="${MEDUSA_ADMIN_PASSWORD:-medusa_admin123}"

echo "Creating admin user: $EMAIL"

# Get database connection info
DB_HOST="${DB_HOST:-postgres}"
DB_USER="${DB_USER:-medusa}"
DB_PASS="${DB_PASS:-medusa_pass}"
DB_NAME="${DB_NAME:-medusa}"

export PGPASSWORD="$DB_PASS"

# Generate password hash using medusa-store's node_modules
cd /app/medusa-store
PASSWORD_HASH=$(node -e "
const scrypt = require('scrypt-kdf');
scrypt.kdf('$PASSWORD', {logN: 15, r: 8, p: 1}).then(hash => console.log(hash.toString('base64')));
")

# Check if user exists
USER_ID=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT id FROM \"user\" WHERE email = '$EMAIL';" 2>/dev/null | tr -d ' ' | xargs)

if [ -n "$USER_ID" ]; then
    echo "User exists, ID: $USER_ID"
    # Delete old identities
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM provider_identity WHERE entity_id = '$EMAIL';" 2>/dev/null || true
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM auth_identity WHERE app_metadata->>'user_id' = '$USER_ID';" 2>/dev/null || true
else
    # Create new user
    USER_ID="user_$(date +%s)_$$"
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO \"user\" (id, email, created_at, updated_at) VALUES ('$USER_ID', '$EMAIL', NOW(), NOW());" 2>/dev/null
    echo "Created new user, ID: $USER_ID"
fi

# Create auth identity
AUTH_ID="authid_$(date +%s)_$$"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO auth_identity (id, app_metadata, created_at, updated_at) VALUES ('$AUTH_ID', '{\"user_id\": \"$USER_ID\"}', NOW(), NOW());" 2>/dev/null

# Create provider identity
PROV_ID="provid_$(date +%s)_$$"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO provider_identity (id, entity_id, provider, auth_identity_id, provider_metadata, created_at, updated_at) VALUES ('$PROV_ID', '$EMAIL', 'emailpass', '$AUTH_ID', '{\"password\": \"$PASSWORD_HASH\"}', NOW(), NOW());" 2>/dev/null

echo "Admin user $EMAIL created successfully!"

# Optionally seed the database
if [ "$SEED_DATABASE" = "true" ]; then
    echo "Seeding database..."
    cd /app/medusa-store
    npx medusa exec ./src/scripts/seed.ts 2>/dev/null || echo "Seeding skipped (may already be seeded)"
fi
