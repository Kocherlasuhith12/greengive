#!/bin/bash

# Fix all files that use createClient() or createAdminClient() without await
# Run from the root of your project: bash fix-supabase-await.sh

FILES=(
  "src/app/charities/[id]/page.tsx"
  "src/app/auth/callback/route.ts"
  "src/app/admin/layout.tsx"
  "src/app/admin/stats/page.tsx"
  "src/app/subscribe/page.tsx"
  "src/app/api/charities/route.ts"
  "src/app/api/charities/[id]/route.ts"
  "src/app/api/winners/proof/route.ts"
  "src/app/api/winners/list/route.ts"
  "src/app/api/winners/my/route.ts"
  "src/app/api/winners/[id]/route.ts"
  "src/app/api/draws/simulate/route.ts"
  "src/app/api/draws/publish/route.ts"
  "src/app/api/draws/list/route.ts"
  "src/app/api/donations/route.ts"
  "src/app/api/auth/logout/route.ts"
  "src/app/api/admin/charities/route.ts"
  "src/app/api/admin/charities/[id]/route.ts"
  "src/app/api/admin/scores/route.ts"
  "src/app/api/admin/users/route.ts"
  "src/app/api/admin/users/[id]/route.ts"
  "src/app/api/subscriptions/route.ts"
  "src/app/api/stripe/webhook/route.ts"
  "src/app/api/stripe/portal/route.ts"
  "src/app/api/stripe/checkout/route.ts"
  "src/app/(dashboard)/draws/page.tsx"
  "src/app/(dashboard)/scores/page.tsx"
  "src/app/(dashboard)/dashboard/page.tsx"
  "src/app/(dashboard)/layout.tsx"
  "src/app/(dashboard)/charity/page.tsx"
  "src/components/layout/Sidebar.tsx"
)

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    # Replace: const supabase = createClient() → const supabase = await createClient()
    sed -i '' 's/= createClient()/= await createClient()/g' "$FILE"
    sed -i '' 's/= createAdminClient()/= await createAdminClient()/g' "$FILE"
    echo "✅ Fixed: $FILE"
  else
    echo "⚠️  Not found: $FILE"
  fi
done

echo ""
echo "Done! Now check for any functions that need 'async' added."
echo "Run: grep -r \"await createClient\|await createAdminClient\" src --include=\"*.ts\" --include=\"*.tsx\" -l"