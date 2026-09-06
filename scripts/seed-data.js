#!/usr/bin/env node

// ===========================================
// Mavora - Development Data Seeding Script
// Usage: node scripts/seed-data.js [options]
// Options:
//   --users <number>       Number of users to create (default: 10)
//   --listings <number>    Number of listings per user (default: 3)
//   --categories           Seed categories only
//   --clear                Clear all data first
//   --dry-run              Show what would be created without inserting
// ===========================================

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// -------------------------------------------
// Configuration
// -------------------------------------------
const CONFIG = {
  usersCount: 10,
  listingsPerUser: 3,
  categoriesOnly: false,
  clearData: false,
  dryRun: false,
};

// Moroccan cities for realistic data
const MOROCCO_CITIES = [
  { city: 'الدار البيضاء', region: 'Casablanca-Settat', slug: 'casablanca' },
  { city: 'الرباط', region: 'Rabat-Salé-Kénitra', slug: 'rabat' },
  { city: 'فاس', region: 'Fès-Meknès', slug: 'fas' },
  { city: 'مراكش', region: 'Marrakech-Safi', slug: 'marrakech' },
  { city: 'طنجة', region: 'Tanger-Tétouan-Al Hoceïma', slug: 'tangier' },
  { city: 'أغادير', region: 'Souss-Massa', slug: 'agadir' },
  { city: 'مكناس', region: 'Fès-Meknès', slug: 'meknes' },
  { city: 'وجدة', region: 'Oriental', slug: 'oujda' },
  { city: 'الجديدة', region: 'Casablanca-Settat', slug: 'el-jadida' },
  { city: 'خنيفرة', region: 'Béni Mellal-Khénifra', slug: 'khenifra' },
];

// Categories structure
const CATEGORIES = [
  {
    name: 'إلكترونيات',
    slug: 'electronics',
    icon: 'smartphone',
    description: 'هواتف، حواسيب، أجهزة إلكترونية',
    subcategories: [
      { name: 'هواتف ذكية', slug: 'smartphones' },
      { name: 'حواسيب محمولة', slug: 'laptops' },
      { name: 'حواسيب مكتبية', slug: 'desktops' },
      { name: 'تلفزيونات', slug: 'televisions' },
      { name: 'كاميرات', slug: 'cameras' },
      { name: 'إكسسوارات', slug: 'accessories' },
    ],
  },
  {
    name: 'سيارات ومركبات',
    slug: 'vehicles',
    icon: 'car',
    description: 'سيارات، دراجات، شاحنات',
    subcategories: [
      { name: 'سيارات مستعملة', slug: 'used-cars' },
      { name: 'سيارات جديدة', slug: 'new-cars' },
      { name: 'دراجات نارية', slug: 'motorcycles' },
      { name: 'قطع غيار', slug: 'spare-parts' },
    ],
  },
  {
    name: 'عقارات',
    slug: 'real-estate',
    icon: 'home',
    description: 'شقق، فيلات، أراضي، محلات',
    subcategories: [
      { name: 'شقق للبيع', slug: 'apartments-sale' },
      { name: 'شقق للكراء', slug: 'apartments-rent' },
      { name: 'فيلا', slug: 'villas' },
      { name: 'أراضي', slug: 'land' },
      { name: 'محلات تجارية', slug: 'commercial' },
    ],
  },
  {
    name: 'أثاث وديكور',
    slug: 'furniture',
    icon: 'sofa',
    description: 'أثاث منزلي، ديكور، إضاءة',
    subcategories: [
      { name: 'غرف نوم', slug: 'bedrooms' },
      { name: 'صالونات', slug: 'living-rooms' },
      { name: 'مطابخ', slug: 'kitchens' },
      { name: 'ديكور', slug: 'decor' },
    ],
  },
  {
    name: 'ملابس وإكسسوارات',
    slug: 'fashion',
    icon: 'shirt',
    description: 'ملابس رجالية، نسائية، أطفال',
    subcategories: [
      { name: 'ملابس رجالية', slug: 'mens-fashion' },
      { name: 'ملابس نسائية', slug: 'womens-fashion' },
      { name: 'ملابس أطفال', slug: 'kids-fashion' },
      { name: 'أحذية', slug: 'shoes' },
      { name: 'حقائب وإكسسوارات', slug: 'accessories' },
    ],
  },
  {
    name: 'وظائف وخدمات',
    slug: 'jobs-services',
    icon: 'briefcase',
    description: 'وظائف، خدمات منزلية، مهنية',
    subcategories: [
      { name: 'وظائف تقنية', slug: 'tech-jobs' },
      { name: 'وظائف تجارية', slug: 'business-jobs' },
      { name: 'خدمات منزلية', slug: 'home-services' },
      { name: 'خدمات تعليمية', slug: 'education-services' },
    ],
  },
];

// Sample listing titles by category
const LISTING_TEMPLATES = {
  electronics: {
    smartphones: [
      'iPhone 15 Pro Max {condition} - {storage}GB - {color}',
      'Samsung Galaxy S24 Ultra {condition}',
      'Google Pixel 8 Pro - {condition}',
      'Xiaomi 14 Pro - {storage}GB',
      'OnePlus 12 - Like New',
    ],
    laptops: [
      'MacBook Pro M3 - {condition}',
      'Dell XPS 15 - {condition}',
      'Lenovo ThinkPad X1 Carbon',
      'ASUS ROG Strix Gaming Laptop',
      'HP Spectre x360 2-in-1',
    ],
  },
  vehicles: {
    'used-cars': [
      'Dacia Logan {year} - {condition}',
      'Renault Clio {year} - {km} km',
      'Peugeot 208 {year}',
      'Volkswagen Golf {year} - {condition}',
      'Hyundai Tucson {year} - Full Options',
    ],
  },
  'real-estate': {
    'apartments-sale': [
      'شقة للبيع في {city} - {rooms} غرف - {size}م²',
      'شقة فاخرة بـ{city} - طابق {floor}',
      'استوديو عصري في قلب {city}',
      'شقة بعمارة جديدة - {city}',
    ],
    'apartments-rent': [
      'شقة للكراء في {city} - {rooms} غرف',
      'استوديو للكراء - {city} - سعر مغري',
      'شقة مفروشة للكراء - {city}',
    ],
  },
};

// Sample Arabic names
const ARABIC_NAMES = [
  'أحمد محمد', 'محمد علي', 'عبد الرحمن', 'يوسف', 'أمين',
  'سارة أحمد', 'فاطمة الزهراء', 'خديجة', 'مريم', 'نور',
  'عمر بن الخطاب', 'حمزة', 'إدريس', 'أنس', 'بلال',
  'زينب', 'عائشة', 'حفصة', 'ريم', 'لينا',
];

// Sample descriptions
const DESCRIPTIONS = [
  'بحالة ممتازة، يستخدم بحذر شديد. السعر قابل للتفاوض قليلاً.',
  'جديد لم يستخدم إلا قليلاً. يضم جميع الإكسسوارات الأصلية والعلبة.',
  'من مالك واحد، تم الشراء من الوكالة الرسمية. صيانة دورية منتظمة.',
  'فرصة لا تُفوت! سبب البيع: السفر أو الترقية لجهاز أحدث.',
  'متاح للاختبار قبل الشراء. الضمان باقي حتى {warranty} أشهر.',
  'يُباع بسبب عدم الحاجة. كل شيء يعمل بشكل مثالي.',
  'سعر مناسب جداً مقارنة بالسوق. جاهز للتسليم فوراً.',
];

// Conditions
const CONDITIONS = ['new', 'used', 'refurbished'];
const CONDITION_LABELS = { new: 'جديد', used: 'مستعمل', refurbished: 'مجدّد' };

// Colors (for electronics)
const COLORS = ['أسود', 'أبيض', 'ذهبي', 'فضي', 'أزرق', 'أخضر', 'أحمر'];

// -------------------------------------------
// Utility Functions
// -------------------------------------------

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(min, max) {
  return Math.round((Math.random() * (max - min) + min) / 10) * 10; // Round to nearest 10
}

function generatePhone() {
  const prefixes = ['0661', '0662', '0663', '0677', '0660', '0610'];
  return '+212' + randomItem(prefixes) + randomNumber(100000, 999999).toString();
}

function generateEmail(name) {
  const providers = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const cleanName = name.replace(/\s/g, '.').toLowerCase();
  return `${cleanName}${randomNumber(1, 999)}@${randomItem(providers)}`;
}

function formatListingTitle(template, vars = {}) {
  let title = template
    .replace('{condition}', randomItem(Object.values(CONDITION_LABELS)))
    .replace('{storage}', randomNumber(64, 512))
    .replace('{color}', randomItem(COLORS))
    .replace('{year}', randomNumber(2018, 2024))
    .replace('{km}', randomNumber(10000, 150000))
    .replace('{rooms}', randomNumber(2, 5))
    .replace('{size}', randomNumber(50, 300))
    .replace('{floor}', randomNumber(0, 10))
    .replace('{city}', randomItem(MOROCCO_CITIES).city);
  
  return title;
}

function generateDescription() {
  return randomItem(DESCRIPTIONS).replace('{warranty}', randomNumber(3, 12));
}

// -------------------------------------------
// Supabase Client
// -------------------------------------------

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
  }

  return createClient(supabaseUrl, supabaseKey);
}

// -------------------------------------------
// Seeding Functions
// -------------------------------------------

async function seedCategories(supabase) {
  console.log('\n📁 Seeding categories...');
  
  const categories = [];
  
  for (const category of CATEGORIES) {
    // Insert main category
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        description: category.description,
        parent_id: null,
      })
      .select()
      .single();

    if (catError && !catError.message.includes('duplicate')) {
      console.error(`  ❌ Error creating category ${category.name}:`, catError.message);
      continue;
    }

    const categoryId = catData?.id;
    
    // Insert subcategories
    if (category.subcategories && categoryId) {
      for (const sub of category.subcategories) {
        const { data: subData, error: subError } = await supabase
          .from('categories')
          .insert({
            name: sub.name,
            slug: sub.slug,
            parent_id: categoryId,
          })
          .select()
          .single();

        if (subError && !subError.message.includes('duplicate')) {
          console.error(`    ❌ Error creating subcategory ${sub.name}:`, subError.message);
        }
        
        categories.push({ ...sub, parentId: categoryId, id: subData?.id });
      }
    }

    categories.push({ ...category, id: categoryId });
    console.log(`  ✅ Created category: ${category.name}`);
  }

  return categories;
}

async function seedUsers(supabase, count) {
  console.log(`\n👥 Seeding ${count} users...`);
  
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const name = ARABIC_NAMES[i % ARABIC_NAMES.length];
    const email = generateEmail(name);
    const city = randomItem(MOROCCO_CITIES);
    
    const userData = {
      email: email,
      name: i === 0 ? 'مدير النظام' : `${name} ${randomNumber(1, 99)}`,
      phone: generatePhone(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: i === 0 ? 'admin' : (i < 3 ? 'seller' : 'user'),
      is_verified: Math.random() > 0.3,
      location: city.city,
      region: city.region,
    };

    if (CONFIG.dryRun) {
      users.push({ ...userData, id: `user_${i}` });
      console.log(`  📝 Would create user: ${userData.name}`);
      continue;
    }

    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error && !error.message.includes('duplicate')) {
      console.error(`  ❌ Error creating user ${name}:`, error.message);
      continue;
    }

    users.push(data || { ...userData, id: `user_${i}` });
    
    if (i % 5 === 0) {
      console.log(`  ✅ Created ${i + 1}/${count} users...`);
    }
  }

  console.log(`  ✅ Created ${users.length} users total`);
  return users;
}

async function seedListings(supabase, users, categories, perUser) {
  console.log(`\n🛍️ Seeding listings (${perUser} per user)...`);
  
  const listings = [];
  let listingId = 1;

  for (const user of users) {
    if (user.role === 'admin') continue;

    const userListings = Math.min(perUser, randomNumber(1, perUser + 2));
    
    for (let i = 0; i < userListings; i++) {
      const category = randomItem(categories.filter(c => c.subcategories));
      const subcategory = randomItem(category.subcategories || [{}]);
      const city = randomItem(MOROCCO_CITIES);
      
      // Get templates for this subcategory
      const templates = LISTING_TEMPLATES[category.slug]?.[subcategory.slug] || 
        [`منتج مميز من {category} - {condition}`];
      
      const listingData = {
        title: formatListingTitle(randomItem(templates), { 
          category: category.name, 
          city: city.city 
        }),
        description: generateDescription(),
        price: randomPrice(50, 50000),
        currency: 'MAD',
        category_id: category.id,
        user_id: user.id,
        condition: randomItem(CONDITIONS),
        negotiable: Math.random() > 0.5,
        location: city.city,
        region: city.region,
        status: Math.random() > 0.1 ? 'active' : 'draft',
        views_count: randomNumber(0, 500),
        favorites_count: randomNumber(0, 50),
        is_featured: Math.random() > 0.9,
      };

      if (CONFIG.dryRun) {
        listings.push({ ...listingData, id: `listing_${listingId++}` });
        continue;
      }

      const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select()
        .single();

      if (error) {
        console.error(`    ❌ Error creating listing:`, error.message);
        continue;
      }

      listings.push(data);
    }
  }

  console.log(`  ✅ Created ${listings.length} listings total`);
  return listings;
}

async function seedReviews(supabase, users, listings) {
  console.log('\n⭐ Seeding reviews...');
  
  let reviewCount = 0;
  
  for (const listing of listings.slice(0, 20)) {
    const numReviews = randomNumber(0, 5);
    
    for (let i = 0; i < numReviews; i++) {
      const reviewer = randomItem(users.filter(u => u.id !== listing.user_id));
      
      const reviewData = {
        listing_id: listing.id,
        reviewer_id: reviewer.id,
        seller_id: listing.user_id,
        rating: randomNumber(3, 5),
        comment: Math.random() > 0.3 ? 'تجربة رائعة! البائع محترم والمنتج مطابق للوصف.' : null,
        is_verified_purchase: Math.random() > 0.3,
      };

      if (!CONFIG.dryRun) {
        const { error } = await supabase
          .from('reviews')
          .insert(reviewData);

        if (error && !error.message.includes('duplicate')) {
          console.error(`    ❌ Error creating review:`, error.message);
          continue;
        }
      }
      
      reviewCount++;
    }
  }

  console.log(`  ✅ Created ${reviewCount} reviews`);
}

async function clearAllData(supabase) {
  console.log('\n🗑️  Clearing all data...');
  
  const tables = ['reviews', 'messages', 'conversations', 'listings', 'users', 'categories'];
  
  for (const table of tables) {
    if (CONFIG.dryRun) {
      console.log(`  🗑️ Would clear table: ${table}`);
      continue;
    }

    const { error } = await supabase.from(table).delete().neq('id', 'nonexistent');
    
    if (error) {
      console.error(`  ⚠️ Error clearing ${table}:`, error.message);
    } else {
      console.log(`  ✅ Cleared table: ${table}`);
    }
  }
}

// -------------------------------------------
// Main Execution
// -------------------------------------------

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     Mavora Data Seeding Script          ║');
  console.log('╚══════════════════════════════════════════╝');

  // Parse arguments
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--users':
        CONFIG.usersCount = parseInt(args[++i]) || 10;
        break;
      case '--listings':
        CONFIG.listingsPerUser = parseInt(args[++i]) || 3;
        break;
      case '--categories':
        CONFIG.categoriesOnly = true;
        break;
      case '--clear':
        CONFIG.clearData = true;
        break;
      case '--dry-run':
        CONFIG.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node scripts/seed-data.js [options]

Options:
  --users <number>       Number of users to create (default: 10)
  --listings <number>    Number of listings per user (default: 3)
  --categories           Seed categories only
  --clear                Clear all data before seeding
  --dry-run              Show what would be created without inserting
  --help                 Show this help message
        `);
        return;
    }
  }

  if (CONFIG.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No data will be inserted\n');
  }

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Clear data if requested
    if (CONFIG.clearData) {
      await clearAllData(supabase);
    }

    // Seed categories (always)
    const categories = await seedCategories(supabase);

    // If categories only, stop here
    if (CONFIG.categoriesOnly) {
      console.log('\n✅ Categories seeded successfully!');
      return;
    }

    // Seed other data
    const users = await seedUsers(supabase, CONFIG.usersCount);
    const listings = await seedListings(supabase, users, categories, CONFIG.listingsPerUser);
    await seedReviews(supabase, users, listings);

    // Summary
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║           SEEDING COMPLETE               ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Users:     ${CONFIG.usersCount.toString().padEnd(28)}║`);
    console.log(`║  Listings:  ${(users.length * CONFIG.listingsPerUser).toString().padEnd(28)}║`);
    console.log(`║  Categories: ${CATEGORIES.length.toString().padEnd(27)}║`);
    console.log('╚══════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
