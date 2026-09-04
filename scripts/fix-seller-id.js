#!/usr/bin/env node
/**
 * Fix seller_id → userId across all files
 * The actual database column is 'userId' not 'seller_id'
 */
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/api/conversations/route.ts',
  'src/app/api/conversations/[id]/route.ts',
  'src/app/api/listings/[id]/route.ts',
  'src/app/api/listings/[id]/report/route.ts',
  'src/app/api/listings/[id]/status/route.ts',
  'src/app/api/listings/[id]/reviews/route.ts',
  'src/app/api/listings/[id]/fields/route.ts',
  'src/app/api/admin/reports/route.ts',
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/favorites/route.ts',
  'src/app/api/users/[id]/route.ts',
  'src/app/api/promotions/route.ts',
  'src/components/seller/SellerProfilePage.tsx',
  'src/components/admin/ListingManagement.tsx',
  'src/components/admin/ReportManagement.tsx',
  'src/components/messages/ConversationView.tsx',
  'src/components/listing/ListingDetail.tsx',
  'src/components/profile/ProfilePage.tsx',
  'src/lib/types.ts'
];

const basePath = '/home/z/my-project';
let totalFixes = 0;

console.log('🔧 Fixing seller_id → userId across all files...\n');

filesToFix.forEach(file => {
  const filePath = path.join(basePath, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Replace seller_id with userId in various contexts
  // But be careful not to break foreign key names like "listings_seller_id_fkey"
  
  content = content.replace(/\.select\(['"]seller_id['"]\)/g, ".select('userId')");
  content = content.replace(/listing\.seller_id/g, "listing.userId");
  content = content.replace(/listing\['seller_id'\]/g, "listing['userId']");
  content = content.replace(/existing\.seller_id/g, "existing.userId");
  content = content.replace(/\[?\s*['"]seller_id['"]\s*\]?/g, "['userId']");
  
  // Fix type definitions
  content = content.replace(/seller_id:\s*string;/g, "userId: string;");
  content = content.replace(/seller_id:/g, "userId:");
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    const changes = (content.match(/userId/g) || []).length - (originalContent.match(/userId/g) || []).length;
    console.log(`✅ Fixed ${file} (${changes} changes)`);
    totalFixes += changes;
  } else {
    console.log(`⏭️  No changes needed: ${file}`);
  }
});

console.log(`\n✅ Total fixes applied: ${totalFixes}`);
console.log('\nNote: Foreign key names like "listings_seller_id_fkey" were preserved.');
