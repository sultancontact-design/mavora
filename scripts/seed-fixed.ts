/**
 * MAVORA Seed Data via Supabase REST API (Fixed)
 * Uses correct column names from Prisma schema
 */

import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

// ===================================================
// Data (using correct Prisma schema column names)
// ===================================================

const categories = [
  // Main categories
  { name: 'Vehicles', nameAr: 'سيارات ومركبات', nameFr: 'Véhicules', slug: 'vehicles', icon: 'Car', description: 'سيارات جديدة ومستعملة، دراجات نارية، قطع غيار', sortOrder: 1, isActive: true, parentId: null },
  { name: 'Real Estate', nameAr: 'عقارات', nameFr: 'Immobilier', slug: 'real-estate', icon: 'Building2', description: 'شقق، فيلات، أراضي، محلات تجارية للبيع والإيجار', sortOrder: 2, isActive: true, parentId: null },
  { name: 'Electronics', nameAr: 'إلكترونيات', nameFr: 'Électronique', slug: 'electronics', icon: 'Smartphone', description: 'هواتف، حواسيب، تلفزيونات، كاميرات وأجهزة إلكترونية', sortOrder: 3, isActive: true, parentId: null },
  { name: 'Home & Garden', nameAr: 'المنزل والحديقة', nameFr: 'Maison et Jardin', slug: 'home-garden', icon: 'Home', description: 'أثاث، ديكور، معدات منزلية، أدوات حديقة', sortOrder: 4, isActive: true, parentId: null },
  { name: 'Fashion & Beauty', nameAr: 'أزياء وجمال', nameFr: 'Mode et Beauté', slug: 'fashion-beauty', icon: 'Shirt', description: 'ملابس، أحذية، إكسسوارات، مستحضرات تجميل', sortOrder: 5, isActive: true, parentId: null },
  { name: 'Sports & Hobbies', nameAr: 'رياضة وهوايات', nameFr: 'Sports et Loisirs', slug: 'sports-hobbies', icon: 'Dumbbell', description: 'معدات رياضية، دراجات، كتب، آلات موسيقية', sortOrder: 6, isActive: true, parentId: null },
  { name: 'Pets', nameAr: 'حيوانات أليفة', nameFr: 'Animaux', slug: 'pets', icon: 'Heart', description: 'كلاب، قطط، طيور، أسماك، مستلزمات حيوانات', sortOrder: 7, isActive: true, parentId: null },
  { name: 'Jobs & Services', nameAr: 'وظائف وخدمات', nameFr: 'Emplois et Services', slug: 'jobs-services', icon: 'Briefcase', description: 'وظائف شاغرة، خدمات مهنية، خدمات منزلية', sortOrder: 8, isActive: true, parentId: null },
  { name: 'Business & Trade', nameAr: 'أعمال وتجارة', nameFr: 'Affaires et Commerce', slug: 'business-trade', icon: 'Store', description: 'محلات، مطاعم، مشاريع جاهزة، معدات تجارية', sortOrder: 9, isActive: true, parentId: null },
  
  // Vehicles subcategories
  { name: 'Cars', nameAr: 'سيارات', nameFr: 'Voitures', slug: 'cars', sortOrder: 1, isActive: true, parentId: 'vehicles' },
  { name: 'Motorcycles', nameAr: 'دراجات نارية', nameFr: 'Motos', slug: 'motorcycles', sortOrder: 2, isActive: true, parentId: 'vehicles' },
  { name: 'Trucks', nameAr: 'شاحنات', nameFr: 'Camions', slug: 'trucks', sortOrder: 3, isActive: true, parentId: 'vehicles' },
  { name: 'Spare Parts', nameAr: 'قطع غيار', nameFr: 'Pièces détachées', slug: 'spare-parts', sortOrder: 4, isActive: true, parentId: 'vehicles' },
  
  // Real Estate subcategories  
  { name: 'Apartments for Sale', nameAr: 'شقق للبيع', nameFr: 'Appartements à vendre', slug: 'apartments-sale', sortOrder: 1, isActive: true, parentId: 'real-estate' },
  { name: 'Apartments for Rent', nameAr: 'شقق للإيجار', nameFr: 'Appartements à louer', slug: 'apartments-rent', sortOrder: 2, isActive: true, parentId: 'real-estate' },
  { name: 'Villas for Sale', nameAr: 'فيلا للبيع', nameFr: 'Villas à vendre', slug: 'villas-sale', sortOrder: 3, isActive: true, parentId: 'real-estate' },
  { name: 'Land', nameAr: 'أراضي', nameFr: 'Terrains', slug: 'land', sortOrder: 5, isActive: true, parentId: 'real-estate' },
  { name: 'Commercial', nameAr: 'محلات تجارية', nameFr: 'Locaux commerciaux', slug: 'commercial-realestate', sortOrder: 6, isActive: true, parentId: 'real-estate' },
  
  // Electronics subcategories
  { name: 'Smartphones', nameAr: 'هواتف ذكية', nameFr: 'Smartphones', slug: 'smartphones', sortOrder: 1, isActive: true, parentId: 'electronics' },
  { name: 'Computers', nameAr: 'حواسيب', nameFr: 'Ordinateurs', slug: 'computers', sortOrder: 2, isActive: true, parentId: 'electronics' },
  { name: 'TVs', nameAr: 'تلفزيونات', nameFr: 'Téléviseurs', slug: 'tvs', sortOrder: 3, isActive: true, parentId: 'electronics' },
  { name: 'Cameras', nameAr: 'كاميرات', nameFr: 'Appareils photo', slug: 'cameras', sortOrder: 4, isActive: true, parentId: 'electronics' },
  
  // Fashion subcategories
  { name: "Men's Clothing", nameAr: 'ملابس رجالية', nameFr: 'Vêtements homme', slug: 'mens-clothing', sortOrder: 1, isActive: true, parentId: 'fashion-beauty' },
  { name: "Women's Clothing", nameAr: 'ملابس نسائية', nameFr: 'Vêtements femme', slug: 'womens-clothing', sortOrder: 2, isActive: true, parentId: 'fashion-beauty' },
  { name: "Kids' Clothing", nameAr: 'ملابس أطفال', nameFr: 'Vêtements enfants', slug: 'kids-clothing', sortOrder: 3, isActive: true, parentId: 'fashion-beauty' },
  { name: 'Shoes', nameAr: 'أحذية', nameFr: 'Chaussures', slug: 'shoes-fashion', sortOrder: 4, isActive: true, parentId: 'fashion-beauty' },
];

const cities = [
  { name: 'Casablanca', nameAr: 'الدار البيضاء', nameFr: 'Casablanca', countryId: '', regionId: '', latitude: 33.5731, longitude: -7.5898, sortOrder: 1, isActive: true },
  { name: 'Rabat', nameAr: 'الرباط', nameFr: 'Rabat', countryId: '', regionId: '', latitude: 34.0209, longitude: -6.8416, sortOrder: 2, isActive: true },
  { name: 'Fes', nameAr: 'فاس', nameFr: 'Fès', countryId: '', regionId: '', latitude: 34.0331, longitude: -5.0003, sortOrder: 3, isActive: true },
  { name: 'Marrakech', nameAr: 'مراكش', nameFr: 'Marrakech', countryId: '', regionId: '', latitude: 31.6295, longitude: -7.9811, sortOrder: 4, isActive: true },
  { name: 'Agadir', nameAr: 'أكادير', nameFr: 'Agadir', countryId: '', regionId: '', latitude: 30.4278, longitude: -9.5981, sortOrder: 5, isActive: true },
  { name: 'Tangier', nameAr: 'طنجة', nameFr: 'Tanger', countryId: '', regionId: '', latitude: 35.7595, longitude: -5.8340, sortOrder: 6, isActive: true },
  { name: 'Meknes', nameAr: 'مكناس', nameFr: 'Meknès', countryId: '', regionId: '', latitude: 33.8935, longitude: -5.5547, sortOrder: 7, isActive: true },
  { name: 'Oujda', nameAr: 'وجدة', nameFr: 'Oujda', countryId: '', regionId: '', latitude: 34.6867, longitude: -1.9114, sortOrder: 8, isActive: true },
  { name: 'Kenitra', nameAr: 'كنترة', nameFr: 'Kénitra', countryId: '', regionId: '', latitude: 34.2610, longitude: -6.5802, sortOrder: 9, isActive: true },
  { name: 'Tetouan', nameAr: 'تطوان', nameFr: 'Tétouan', countryId: '', regionId: '', latitude: 35.5889, longitude: -5.3628, sortOrder: 10, isActive: true },
  { name: 'El Jadida', nameAr: 'الجديدة', nameFr: 'El Jadida', countryId: '', regionId: '', latitude: 33.2309, longitude: -8.5075, sortOrder: 11, isActive: true },
  { name: 'Nador', nameAr: 'ناظور', nameFr: 'Nador', countryId: '', regionId: '', latitude: 35.1688, longitude: -2.9316, sortOrder: 12, isActive: true },
  { name: 'Beni Mellal', nameAr: 'بنى ملال', nameFr: 'Béni Mellal', countryId: '', regionId: '', latitude: 32.4972, longitude: -6.7396, sortOrder: 13, isActive: true },
  { name: 'Khenifra', nameAr: 'خنيفرة', nameFr: 'Khenifra', countryId: '', regionId: '', latitude: 32.9378, longitude: -5.6635, sortOrder: 14, isActive: true },
  { name: 'Al Hoceima', nameAr: 'الحسيمة', nameFr: 'Al Hoceïma', countryId: '', regionId: '', latitude: 35.2469, longitude: -3.9366, sortOrder: 15, isActive: true },
  { name: 'Sale', nameAr: 'سلا', nameFr: 'Salé', countryId: '', regionId: '', latitude: 34.0532, longitude: -6.7958, sortOrder: 16, isActive: true },
  { name: 'Settat', nameAr: 'سطات', nameFr: 'Settat', countryId: '', regionId: '', latitude: 32.9770, longitude: -7.6164, sortOrder: 17, isActive: true },
  { name: 'Mohammedia', nameAr: 'المحمدية', nameFr: 'Mohammedia', countryId: '', regionId: '', latitude: 33.6843, longitude: -7.3830, sortOrder: 18, isActive: true },
  { name: 'Khouribga', nameAr: 'خريبكة', nameFr: 'Khouribga', countryId: '', regionId: '', latitude: 32.8814, longitude: -6.9062, sortOrder: 19, isActive: true },
  { name: 'Taza', name_ar: 'تازة', nameFr: 'Taza', countryId: '', regionId: '', latitude: 34.2196, longitude: -4.0095, sortOrder: 20, isActive: true },
  { name: 'Laayoune', nameAr: 'العيون', nameFr: 'Laâyoune', countryId: '', regionId: '', latitude: 27.1538, longitude: -13.2033, sortOrder: 21, isActive: true },
  { name: 'Safi', nameAr: 'آسفي', nameFr: 'Safi', countryId: '', regionId: '', latitude: 32.2995, longitude: -9.2372, sortOrder: 22, isActive: true },
  { name: 'Essaouira', nameAr: 'الصويرة', nameFr: 'Essaouira', countryId: '', regionId: '', latitude: 31.5085, longitude: -9.7595, sortOrder: 23, isActive: true },
  { name: 'Errachidia', nameAr: 'الرشيدية', nameFr: 'Errachidia', countryId: '', regionId: '', latitude: 31.9403, longitude: -4.4334, sortOrder: 24, isActive: true },
  { name: 'Ouarzazate', nameAr: 'ورزازات', nameFr: 'Ouarzazate', countryId: '', regionId: '', latitude: 30.9185, longitude: -6.8935, sortOrder: 25, isActive: true },
  { name: 'Guelmim', nameAr: 'كلميم', nameFr: 'Guelmim', countryId: '', regionId: '', latitude: 28.9841, longitude: -10.0650, sortOrder: 26, isActive: true },
  { name: 'Taroudant', nameAr: 'تارودانت', nameFr: 'Taroudant', countryId: '', regionId: '', latitude: 30.4731, longitude: -8.8748, sortOrder: 27, isActive: true },
  { name: 'Skhirate-Temara', nameAr: 'الصخيرات', nameFr: 'Skhirate-Témara', countryId: '', regionId: '', latitude: 33.8710, longitude: -6.6939, sortOrder: 28, isActive: true },
  { name: 'Sidi Kacem', nameAr: 'سيدي قاسم', nameFr: 'Sidi Kacem', countryId: '', regionId: '', latitude: 34.2673, longitude: -5.7043, sortOrder: 29, isActive: true },
  { name: 'Berkane', nameAr: 'بركان', nameFr: 'Berkane', countryId: '', regionId: '', latitude: 35.0015, longitude: -2.3286, sortOrder: 30, isActive: true },
  { name: 'Chefchaouen', nameAr: 'شفشاون', nameFr: 'Chefchaouen', countryId: '', regionId: '', latitude: 35.1689, longitude: -5.2636, sortOrder: 31, isActive: true },
  { name: 'Larache', nameAr: 'العرائش', nameFr: 'Larache', countryId: '', regionId: '', latitude: 35.1936, longitude: -6.1565, sortOrder: 32, isActive: true },
  { name: 'Mediouna', nameAr: 'مديونة', nameFr: 'Mediouna', countryId: '', regionId: '', latitude: 33.4714, longitude: -7.4617, sortOrder: 33, isActive: true },
  { name: 'Nouaceur', nameAr: 'نواصر', nameFr: 'Nouaceur', countryId: '', regionId: '', latitude: 33.3045, longitude: -7.6505, sortOrder: 34, isActive: true },
  { name: 'Berrechid', nameAr: 'برشيد', nameFr: 'Berrechid', countryId: '', regionId: '', latitude: 32.9970, longitude: -7.6715, sortOrder: 35, isActive: true },
  { name: 'Benslimane', nameAr: 'بنسليمان', nameFr: 'Benslimane', countryId: '', regionId: '', latitude: 33.7000, longitude: -6.7500, sortOrder: 36, isActive: true },
];

const currencies = [
  { code: 'MAD', name: 'Moroccan Dirham', nameAr: 'درهم مغربي', symbol: 'د.م.', decimalPlaces: 2 },
  { code: 'USD', name: 'US Dollar', nameAr: 'دولار أمريكي', symbol: '$', decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', nameAr: 'يورو', symbol: '€', decimalPlaces: 2 },
];

// ===================================================
// Helper Functions
// ===================================================

async function supabaseRequest(table: string, method: string, bodyOrQuery?: any) {
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const options: RequestInit = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  
  if (method === 'GET' && bodyOrQuery) {
    url += `?${bodyOrQuery}`;
  } else if (bodyOrQuery) {
    options.body = JSON.stringify(bodyOrQuery);
  }
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.text();
      return { error: `${response.status}: ${error}` };
    }
    return await response.json();
  } catch (e) {
    return { error: String(e) };
  }
}

async function upsertRecord(table: string, data: any, conflictColumn: string = 'slug') {
  // Check if exists
  const existing = await supabaseRequest(table, 'GET', `${conflictColumn}=eq.${data[conflictColumn]}`);
  
  if (Array.isArray(existing) && existing.length > 0) {
    // Update
    const result = await supabaseRequest(`${table}?${conflictColumn}=eq.${data[conflictColumn]}`, 'PATCH', data);
    return Array.isArray(result) ? result[0] : result;
  } else if (!existing.error || Array.isArray(existing)) {
    // Insert
    const result = await supabaseRequest(table, 'POST', data);
    return Array.isArray(result) ? result[0] : result;
  }
  return null;
}

// ===================================================
// Main Seed Function
// ===================================================

async function main() {
  console.log('🌱 بدء زراعة البيانات الأولية لـ MAVORA...\n');
  
  let stats = { countries: 0, cities: 0, categories: 0, currencies: 0 };
  
  try {
    // 1. Create Country
    console.log('🇲🇦 إنشاء دولة المغرب...');
    const countryResult = await upsertRecord('countries', {
      code: 'MA',
      name: 'Morocco',
      nameAr: 'المغرب',
      nameFr: 'Maroc',
      phoneCode: '+212',
      isActive: true
    }, 'code');
    
    if (countryResult && !countryResult.error) {
      stats.countries = 1;
      console.log('   ✅ تم إنشاء المغرب\n');
      
      // Update cities with country ID
      for (const city of cities) {
        city.countryId = countryResult.id;
      }
    } else {
      console.log('   ⚠️ لم يتم إنشاء المغرب، استخدام معرف افتراضي\n');
      // Try to get existing country
      const existingCountries = await supabaseRequest('countries', 'GET', 'code=eq.MA');
      if (Array.isArray(existingCountries) && existingCountries.length > 0) {
        for (const city of cities) {
          city.countryId = existingCountries[0].id;
        }
        stats.countries = 1;
      }
    }

    // 2. Create Currencies
    console.log('💰 إنشاء العملات...');
    for (const currency of currencies) {
      const result = await upsertRecord('currencies', currency, 'code');
      if (result && !result.error) {
        stats.currencies++;
        console.log(`   ✅ ${currency.nameAr} (${currency.code})`);
      } else {
        console.log(`   ⚠️ ${currency.code}: ${result?.error}`);
      }
    }
    console.log('');

    // 3. Create Cities
    console.log('🏙️ إنشاء المدن المغربية...');
    for (const city of cities) {
      // Use name as unique identifier since there's no slug
      const existing = await supabaseRequest('cities', 'GET', `name=eq.${city.name}&countryId=eq.${city.countryId}`);
      
      let result;
      if (Array.isArray(existing) && existing.length > 0) {
        result = await supabaseRequest(`cities?id=eq.${existing[0].id}`, 'PATCH', city);
      } else {
        result = await supabaseRequest('cities', 'POST', city);
      }
      
      if (result && !result.error) {
        stats.cities++;
      }
    }
    console.log(`   ✅ تم إنشاء/تحديث ${stats.cities} مدينة\n`);

    // 4. Create Categories (handle parent references)
    console.log('📁 إنشاء الفئات...');
    const categoryMap: Record<string, string> = {};
    
    // First pass: create parent categories
    for (const cat of categories) {
      if (!cat.parentId) {
        const catData = { ...cat };
        delete catData.parentId;
        
        const result = await upsertRecord('categories', catData, 'slug');
        if (result && !result.error && result.id) {
          categoryMap[cat.slug] = result.id;
          stats.categories++;
          console.log(`   ✅ ${cat.nameAr || cat.name}`);
        }
      }
    }
    
    // Second pass: create child categories
    for (const cat of categories) {
      if (cat.parentId && categoryMap[cat.parentId]) {
        const catData = { 
          ...cat, 
          parentId: categoryMap[cat.parentId] 
        };
        
        const result = await upsertRecord('categories', catData, 'slug');
        if (result && !result.error && result.id) {
          categoryMap[cat.slug] = result.id;
          stats.categories++;
          console.log(`   ✅ ${cat.nameAr || cat.name}`);
        }
      }
    }
    console.log(`\n   📊 المجموع: ${stats.categories} فئة\n`);

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('✅ تمت زراعة البيانات بنجاح!');
    console.log('═══════════════════════════════════════════');
    console.log(`
📊 ملخص البيانات:
   • دول: ${stats.countries}
   • مدن: ${stats.cities}
   • فئات: ${stats.categories}
   • عملات: ${stats.currencies}

🌐 الموقع جاهز للاستخدام!
    `);

  } catch (error) {
    console.error('❌ خطأ في زراعة البيانات:', error);
  }
}

main();
