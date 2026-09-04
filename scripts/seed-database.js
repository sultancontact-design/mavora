// MAVORA Database Seed Script
// Adds essential data for Morocco & Global marketplace

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Simple UUID generator
function cuid() {
  return 'clx' + Array.from({length: 24}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

async function seedDatabase() {
  console.log('🌱 Starting MAVORA Database Seed...\n');
  
  let successCount = 0;
  let errorCount = 0;

  // ==================== COUNTRIES ====================
  console.log('📍 Seeding Countries...');
  const countries = [
    { id: cuid(), name: 'المغرب', nameAr: 'المغرب', nameFr: 'Maroc', code: 'MA', flagEmoji: '🇲🇦', phoneCode: '+212', currencyCode: 'MAD', isActive: true, sortOrder: 1 },
    { id: cuid(), name: 'الجزائر', nameAr: 'الجزائر', nameFr: 'Algérie', code: 'DZ', flagEmoji: '🇩🇿', phoneCode: '+213', currencyCode: 'DZD', isActive: true, sortOrder: 2 },
    { id: cuid(), name: 'تونس', nameAr: 'تونس', nameFr: 'Tunisie', code: 'TN', flagEmoji: '🇹🇳', phoneCode: '+216', currencyCode: 'TND', isActive: true, sortOrder: 3 },
    { id: cuid(), name: 'مصر', nameAr: 'مصر', nameFr: 'Égypte', code: 'EG', flagEmoji: '🇪🇬', phoneCode: '+20', currencyCode: 'EGP', isActive: true, sortOrder: 4 },
    { id: cuid(), name: 'السعودية', nameAr: 'السعودية', nameFr: 'Arabie Saoudite', code: 'SA', flagEmoji: '🇸🇦', phoneCode: '+966', currencyCode: 'SAR', isActive: true, sortOrder: 5 },
    { id: cuid(), name: 'Emirates', nameAr: 'الإمارات', nameFr: 'Émirats Arabes Unis', code: 'AE', flagEmoji: '🇦🇪', phoneCode: '+971', currencyCode: 'AED', isActive: true, sortOrder: 6 },
    { id: cuid(), name: 'France', nameAr: 'فرنسا', nameFr: 'France', code: 'FR', flagEmoji: '🇫🇷', phoneCode: '+33', currencyCode: 'EUR', isActive: true, sortOrder: 7 },
    { id: cuid(), name: 'Canada', nameAr: 'كندا', nameFr: 'Canada', code: 'CA', flagEmoji: '🇨🇦', phoneCode: '+1', currencyCode: 'CAD', isActive: true, sortOrder: 8 },
    { id: cuid(), name: 'USA', nameAr: 'أمريكا', nameFr: 'États-Unis', code: 'US', flagEmoji: '🇺🇸', phoneCode: '+1', currencyCode: 'USD', isActive: true, sortOrder: 9 },
  ];

  const { data: countriesData, error: countriesErr } = await supabase
    .from('countries')
    .upsert(countries, { onConflict: 'code' })
    .select();

  if (countriesErr) {
    console.log('❌ Countries error:', countriesErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${countriesData.length} countries`);
    successCount += countriesData.length;
  }

  // Get Morocco ID for cities
  const moroccoId = countriesData?.find(c => c.code === 'MA')?.id || countries[0].id;

  // ==================== MOROCCO REGIONS ====================
  console.log('\n🗺️ Seeding Morocco Regions...');
  const regions = [
    { id: cuid(), name: 'الدار البيضاء الكبرى', nameAr: 'الدار البيضاء الكبرى', nameFr: 'Casablanca-Settat', countryId: moroccoId, sortOrder: 1 },
    { id: cuid(), name: 'الرباط سلا القنيطرة', nameAr: 'الرباط سلا القنيطرة', nameFr: 'Rabat-Salé-Kénitra', countryId: moroccoId, sortOrder: 2 },
    { id: cuid(), name: 'مراكش آسفي', nameAr: 'مراكش آسفي', nameFr: 'Marrakech-Safi', countryId: moroccoId, sortOrder: 3 },
    { id: cuid(), name: 'فاس مكناس', nameAr: 'فاس مكناس', nameFr: 'Fès-Meknès', countryId: moroccoId, sortOrder: 4 },
    { id: cuid(), name: 'طنجة تطوان الحسيمة', nameAr: 'طنجة تطوان الحسيمة', nameFr: 'Tanger-Tétouan-Al Hoceïma', countryId: moroccoId, sortOrder: 5 },
    { id: cuid(), name: 'الشرق', nameAr: 'الشرق', nameFr: 'Oriental', countryId: moroccoId, sortOrder: 6 },
    { id: cuid(), name: 'درعة تافيلالت', nameAr: 'درعة تافيلالت', nameFr: 'Drâa-Tafilalet', countryId: moroccoId, sortOrder: 7 },
    { id: cuid(), name: 'سوس ماسة', nameAr: 'سوس ماسة', nameFr: 'Souss-Massa', countryId: moroccoId, sortOrder: 8 },
    { id: cuid(), name: 'العيون الساقية الحمراء', nameAr: 'العيون الساقية الحمراء', nameFr: 'Laâyoune-Sakia El Hamra', countryId: moroccoId, sortOrder: 9 },
    { id: cuid(), name: 'الداخلة وادي الذهب', nameAr: 'الداخلة وادي الذهب', nameFr: 'Dakhla-Oued Ed-Dahab', countryId: moroccoId, sortOrder: 10 },
    { id: cuid(), name: 'بني ملال خنيفرة', nameAr: 'بني ملال خنيفرة', nameFr: 'Béni Mellal-Khénifra', countryId: moroccoId, sortOrder: 11 },
    { id: cuid(), name: 'كلميم واد نون', nameAr: 'كلميم واد نون', nameFr: 'Guelmim-Oued Noun', countryId: moroccoId, sortOrder: 12 },
  ];

  const { data: regionsData, error: regionsErr } = await supabase
    .from('regions')
    .upsert(regions, { onConflict: 'id' })
    .select();

  if (regionsErr) {
    console.log('❌ Regions error:', regionsErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${regionsData.length} regions`);
    successCount += regionsData.length;
  }

  // ==================== MAJOR CITIES ====================
  console.log('\n🏙️ Seeding Major Cities...');
  const casablancaRegion = regionsData?.find(r => r.nameFr === 'Casablanca-Settat')?.id || regions[0].id;
  const rabatRegion = regionsData?.find(r => r.nameFr === 'Rabat-Salé-Kénitra')?.id || regions[1].id;
  const marrakechRegion = regionsData?.find(r => r.nameFr === 'Marrakech-Safi')?.id || regions[2].id;
  const tangierRegion = regionsData?.find(r => r.nameFr === 'Tanger-Tétouan-Al Hoceïma')?.id || regions[4].id;
  const fesRegion = regionsData?.find(r => r.nameFr === 'Fès-Meknès')?.id || regions[3].id;

  const cities = [
    // Casablanca-Settat
    { id: cuid(), name: 'الدار البيضاء', nameAr: 'الدار البيضاء', nameFr: 'Casablanca', countryId: moroccoId, regionId: casablancaRegion, latitude: 33.5731, longitude: -7.5898, sortOrder: 1, isActive: true },
    { id: cuid(), name: 'المحمدية', nameAr: 'المحمدية', nameFr: 'Mohammedia', countryId: moroccoId, regionId: casablancaRegion, latitude: 33.6868, longitude: -7.3814, sortOrder: 2, isActive: true },
    { id: cuid(), name: 'الجديدة', nameAr: 'الجديدة', nameFr: 'El Jadida', countryId: moroccoId, regionId: casablancaRegion, latitude: 33.2309, longitude: -8.5014, sortOrder: 3, isActive: true },
    
    // Rabat-Salé-Kénitra
    { id: cuid(), name: 'الرباط', nameAr: 'الرباط', nameFr: 'Rabat', countryId: moroccoId, regionId: rabatRegion, latitude: 34.0209, longitude: -6.8416, sortOrder: 4, isActive: true },
    { id: cuid(), name: 'سلا', nameAr: 'سلا', nameFr: 'Salé', countryId: moroccoId, regionId: rabatRegion, latitude: 34.0530, longitude: -6.7986, sortOrder: 5, isActive: true },
    { id: cuid(), name: 'كنترة', nameAr: 'كنترة', nameFr: 'Kénitra', countryId: moroccoId, regionId: rabatRegion, latitude: 34.2610, longitude: -6.5802, sortOrder: 6, isActive: true },
    
    // Marrakech-Safi
    { id: cuid(), name: 'مراكش', nameAr: 'مراكش', nameFr: 'Marrakech', countryId: moroccoId, regionId: marrakechRegion, latitude: 31.6295, longitude: -7.9811, sortOrder: 7, isActive: true },
    { id: cuid(), name: 'صفروان', nameAr: 'صفروان', nameFr: 'Safi', countryId: moroccoId, regionId: marrakechRegion, latitude: 32.3000, longitude: -9.2373, sortOrder: 8, isActive: true },
    { id: cuid(), name: 'أسفي', nameAr: 'أسفي', nameFr: 'Asfi', countryId: moroccoId, regionId: marrakechRegion, latitude: 32.2997, longitude: -9.2364, sortOrder: 9, isActive: true },
    
    // Tanger-Tétouan
    { id: cuid(), name: 'طنجة', nameAr: 'طنجة', nameFr: 'Tanger', countryId: moroccoId, regionId: tangierRegion, latitude: 35.7595, longitude: -5.8340, sortOrder: 10, isActive: true },
    { id: cuid(), name: 'تطوان', nameAr: 'تطوان', nameFr: 'Tétouan', countryId: moroccoId, regionId: tangierRegion, latitude: 35.5714, longitude: -5.3625, sortOrder: 11, isActive: true },
    { id: cuid(), name: 'الحسيمة', nameAr: 'الحسيمة', nameFr: 'Al Hoceïma', countryId: moroccoId, regionId: tangierRegion, latitude: 35.2475, longitude: -3.9331, sortOrder: 12, isActive: true },
    
    // Fès-Meknès
    { id: cuid(), name: 'فاس', nameAr: 'فاس', nameFr: 'Fès', countryId: moroccoId, regionId: fesRegion, latitude: 34.0331, longitude: -5.0003, sortOrder: 13, isActive: true },
    { id: cuid(), name: 'مكناس', nameAr: 'مكناس', nameFr: 'Meknès', countryId: moroccoId, regionId: fesRegion, latitude: 33.8935, longitude: -5.5547, sortOrder: 14, isActive: true },
    { id: cuid(), name: 'إفران', nameAr: 'إفران', nameFr: 'Ifrane', countryId: moroccoId, regionId: fesRegion, latitude: 33.5306, longitude: -5.1053, sortOrder: 15, isActive: true },
  ];

  const { data: citiesData, error: citiesErr } = await supabase
    .from('cities')
    .upsert(cities, { onConflict: 'id' })
    .select();

  if (citiesErr) {
    console.log('❌ Cities error:', citiesErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${citiesData.length} cities`);
    successCount += citiesData.length;
  }

  // ==================== CURRENCIES ====================
  console.log('\n💰 Seeding Currencies...');
  const currencies = [
    { id: cuid(), code: 'MAD', name: 'درهم مغربي', nameAr: 'درهم مغربي', symbol: 'د.م.', decimalPlaces: 2, isActive: true },
    { id: cuid(), code: 'EUR', name: 'يورو', nameAr: 'يورو', symbol: '€', decimalPlaces: 2, isActive: true },
    { id: cuid(), code: 'USD', name: 'دولار أمريكي', nameAr: 'دولار أمريكي', symbol: '$', decimalPlaces: 2, isActive: true },
    { id: cuid(), code: 'GBP', name: 'جنيه إسترليني', nameAr: 'جنيه إسترليني', symbol: '£', decimalPlaces: 2, isActive: true },
    { id: cuid(), code: 'CAD', name: 'دولار كندي', nameAr: 'دولار كندي', symbol: 'C$', decimalPlaces: 2, isActive: true },
    { id: cuid(), code: 'SAR', name: 'ريال سعودي', nameAr: 'ريال سعودي', symbol: 'ر.س', decimalPlaces: 2, isActive: true },
    { id: cuid(), code: 'AED', name: 'درهم إماراتي', nameAr: 'درهم إماراتي', symbol: 'د.إ', decimalPlaces: 2, isActive: true },
    { id: cuid(), code: 'DZD', name: 'دينار جزائري', nameAr: 'دينار جزائري', symbol: 'د.ج', decimalPlaces: 2, isActive: true },
    { id: cuid(), code: 'TND', name: 'دينار تونسي', nameAr: 'دينار تونسي', symbol: 'د.ت', decimalPlaces: 2, isActive: true },
    { id: cuid(), code: 'EGP', name: 'جنيه مصري', nameAr: 'جنيه مصري', symbol: 'ج.م', decimalPlaces: 2, isActive: true },
  ];

  const { data: currenciesData, error: currenciesErr } = await supabase
    .from('currencies')
    .upsert(currencies, { onConflict: 'code' })
    .select();

  if (currenciesErr) {
    console.log('❌ Currencies error:', currenciesErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${currenciesData.length} currencies`);
    successCount += currenciesData.length;
  }

  // ==================== MAIN CATEGORIES ====================
  console.log('\n📂 Seeding Main Categories...');
  const categories = [
    { id: cuid(), name: 'إلكترونيات', nameAr: 'إلكترونيات', nameFr: 'Électronique', slug: 'electronics', icon: 'smartphone', parentId: null, sortOrder: 1, isActive: true },
    { id: cuid(), name: 'مركوبيلات', nameAr: 'مركوبيلات', nameFr: 'Véhicules', slug: 'vehicles', icon: 'car', parentId: null, sortOrder: 2, isActive: true },
    { id: cuid(), name: 'عقارات', nameAr: 'عقارات', nameFr: 'Immobilier', slug: 'real-estate', icon: 'home', parentId: null, sortOrder: 3, isActive: true },
    { id: cuid(), name: 'المنزل والحديقة', nameAr: 'المنزل والحديقة', nameFr: 'Maison & Jardin', slug: 'home-garden', icon: 'sofa', parentId: null, sortOrder: 4, isActive: true },
    { id: cuid(), name: 'ملابس وموضة', nameAr: 'ملابس وموضة', nameFr: 'Mode & Vêtements', slug: 'fashion', icon: 'shirt', parentId: null, sortOrder: 5, isActive: true },
    { id: cuid(), name: 'حيوانات أليفة', nameAr: 'حيوانات أليفة', nameFr: 'Animaux', slug: 'pets', icon: 'heart', parentId: null, sortOrder: 6, isActive: true },
    { id: cuid(), name: 'وظائف وخدمات', nameAr: 'وظائف وخدمات', nameFr: 'Emplois & Services', slug: 'jobs-services', icon: 'briefcase', parentId: null, sortOrder: 7, isActive: true },
    { id: cuid(), name: 'تعليم', nameAr: 'تعليم', nameFr: 'Éducation', slug: 'education', icon: 'book-open', parentId: null, sortOrder: 8, isActive: true },
    { id: cuid(), name: 'رياضة وهوايات', nameAr: 'رياضة وهوايات', nameFr: 'Sports & Loisirs', slug: 'sports-hobbies', icon: 'dumbbell', parentId: null, sortOrder: 9, isActive: true },
    { id: cuid(), name: 'أعمال وتجارة', nameAr: 'أعمال وتجارة', nameFr: 'Affaires & Commerce', slug: 'business', icon: 'building-2', parentId: null, sortOrder: 10, isActive: true },
    { id: cuid(), name: 'زراعة', nameAr: 'زراعة', nameFr: 'Agriculture', slug: 'agriculture', icon: 'tractor', parentId: null, sortOrder: 11, isActive: true },
    { id: cuid(), name: 'أخرى', nameAr: 'أخرى', nameFr: 'Autres', slug: 'other', icon: 'more-horizontal', parentId: null, sortOrder: 12, isActive: true },
  ];

  const { data: categoriesData, error: categoriesErr } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' })
    .select();

  if (categoriesErr) {
    console.log('❌ Categories error:', categoriesErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${categoriesData.length} main categories`);
    successCount += categoriesData.length;
  }

  // Get category IDs for subcategories
  const electronicsCat = categoriesData?.find(c => c.slug === 'electronics')?.id;
  const vehiclesCat = categoriesData?.find(c => c.slug === 'vehicles')?.id;
  const realEstateCat = categoriesData?.find(c => c.slug === 'real-estate')?.id;
  const homeGardenCat = categoriesData?.find(c => c.slug === 'home-garden')?.id;
  const fashionCat = categoriesData?.find(c => c.slug === 'fashion')?.id;
  const petsCat = categoriesData?.find(c => c.slug === 'pets')?.id;
  const jobsCat = categoriesData?.find(c => c.slug === 'jobs-services')?.id;

  // ==================== SUBCATEGORIES - Electronics ====================
  console.log('\n📱 Seeding Subcategories...');
  
  const subcategories = [
    // Electronics
    { id: cuid(), name: 'هواتف ذكية', nameAr: 'هواتف ذكية', nameFr: 'Smartphones', slug: 'smartphones', icon: 'smartphone', parentId: electronicsCat, sortOrder: 1, isActive: true },
    { id: cuid(), name: 'حواسيب ولابتوب', nameAr: 'حواسيب ولابتوب', nameFr: 'PC & Laptop', slug: 'computers-laptops', icon: 'laptop', parentId: electronicsCat, sortOrder: 2, isActive: true },
    { id: cuid(), name: 'تلفزيونات وصوت', nameAr: 'تلفزيونات وصوت', nameFr: 'TV & Audio', slug: 'tv-audio', icon: 'tv', parentId: electronicsCat, sortOrder: 3, isActive: true },
    { id: cuid(), name: 'كاميرات تصوير', nameAr: 'كاميرات تصوير', nameFr: 'Caméras', slug: 'cameras', icon: 'camera', parentId: electronicsCat, sortOrder: 4, isActive: true },
    { id: cuid(), name: 'ألعاب فيديو', nameAr: 'ألعاب فيديو', nameFr: 'Jeux Vidéo', slug: 'video-games', icon: 'gamepad-2', parentId: electronicsCat, sortOrder: 5, isActive: true },
    { id: cuid(), name: 'إكسسوارات إلكترونية', nameAr: 'إكسسوارات إلكترونية', nameFr: 'Accessoires Électroniques', slug: 'electronics-accessories', icon: 'headphones', parentId: electronicsCat, sortOrder: 6, isActive: true },
    
    // Vehicles
    { id: cuid(), name: 'سيارات', nameAr: 'سيارات', nameFr: 'Voitures', slug: 'cars', icon: 'car', parentId: vehiclesCat, sortOrder: 1, isActive: true },
    { id: cuid(), name: 'دراجات نارية', nameAr: 'دراجات نارية', nameFr: 'Motos', slug: 'motorcycles', icon: 'bike', parentId: vehiclesCat, sortOrder: 2, isActive: true },
    { id: cuid(), name: 'شاحنات وضخمة', nameAr: 'شاحنات وضخمة', nameFr: 'Camions & Utilitaires', slug: 'trucks-vans', icon: 'truck', parentId: vehiclesCat, sortOrder: 3, isActive: true },
    { id: cuid(), name: 'قطع غيار', nameAr: 'قطع غيار', nameFr: 'Pièces Détachées', slug: 'spare-parts', icon: 'wrench', parentId: vehiclesCat, sortOrder: 4, isActive: true },
    { id: cuid(), name: 'قوارب وقوارب', nameAr: 'قوارب وقوارب', nameFr: 'Bateaux', slug: 'boats', icon: 'ship', parentId: vehiclesCat, sortOrder: 5, isActive: true },
    
    // Real Estate
    { id: cuid(), name: 'شقق للبيع', nameAr: 'شقق للبيع', nameFr: 'Appartements à Vendre', slug: 'apartments-sale', icon: 'building', parentId: realEstateCat, sortOrder: 1, isActive: true },
    { id: cuid(), name: 'شقق للكراء', nameAr: 'شقق للكراء', nameFr: 'Appartements à Louer', slug: 'apartments-rent', icon: 'key', parentId: realEstateCat, sortOrder: 2, isActive: true },
    { id: cuid(), name: 'فلل وفيلات', nameAr: 'فلل وفيلات', nameFr: 'Villas', slug: 'villas', icon: 'home', parentId: realEstateCat, sortOrder: 3, isActive: true },
    { id: cuid(), name: 'أراضي', nameAr: 'أراضي', nameFr: 'Terrains', slug: 'land', icon: 'map-pin', parentId: realEstateCat, sortOrder: 4, isActive: true },
    { id: cuid(), name: 'محلات تجارية', nameAr: 'محلات تجارية', nameFr: 'Locaux Commerciaux', slug: 'commercial', icon: 'store', parentId: realEstateCat, sortOrder: 5, isActive: true },
    
    // Home & Garden
    { id: cuid(), name: 'أثاث منزلي', nameAr: 'أثاث منزلي', nameFr: 'Meubles', slug: 'furniture', icon: 'sofa', parentId: homeGardenCat, sortOrder: 1, isActive: true },
    { id: cuid(), name: 'مطبخ وأجهزة', nameAr: 'مطبخ وأجهزة', nameFr: 'Cuisine & Électroménager', slug: 'kitchen-appliances', icon: 'cooker', parentId: homeGardenCat, sortOrder: 2, isActive: true },
    { id: cuid(), name: 'ديكور وإضاءة', nameAr: 'ديكور وإضاءة', nameFr: 'Déco & Éclairage', slug: 'decor-lighting', icon: 'lamp', parentId: homeGardenCat, sortOrder: 3, isActive: true },
    { id: cuid(), name: 'حديقة ونباتات', nameAr: 'حديقة ونباتات', nameFr: 'Jardin & Plantes', slug: 'garden-plants', icon: 'flower-2', parentId: homeGardenCat, sortOrder: 4, isActive: true },
    
    // Fashion
    { id: cuid(), name: 'ملابس رجالية', nameAr: 'ملابس رجالية', nameFr: 'Mode Homme', slug: 'mens-fashion', icon: 'shirt', parentId: fashionCat, sortOrder: 1, isActive: true },
    { id: cuid(), name: 'ملابس نسائية', nameAr: 'ملابس نسائية', nameFr: 'Mode Femme', slug: 'womens-fashion', icon: 'shirt', parentId: fashionCat, sortOrder: 2, isActive: true },
    { id: cuid(), name: 'أحذية وحقائب', nameAr: 'أحذية وحقائب', nameFr: 'Chaussures & Sacs', slug: 'shoes-bags', icon: 'footprints', parentId: fashionCat, sortOrder: 3, isActive: true },
    { id: cuid(), name: 'إكسسوارات', nameAr: 'إكسسوارات', nameFr: 'Accessoires Mode', slug: 'fashion-accessories', icon: 'watch', parentId: fashionCat, sortOrder: 4, isActive: true },
    { id: cuid(), name: 'ساعات ومجوهرات', nameAr: 'ساعات ومجوهرات', nameFr: 'Montres & Bijoux', slug: 'watches-jewelry', icon: 'gem', parentId: fashionCat, sortOrder: 5, isActive: true },
    
    // Pets
    { id: cuid(), name: 'كلاب', nameAr: 'كلاب', nameFr: 'Chiens', slug: 'dogs', icon: 'dog', parentId: petsCat, sortOrder: 1, isActive: true },
    { id: cuid(), name: 'قطط', nameAr: 'قطط', nameFr: 'Chats', slug: 'cats', icon: 'cat', parentId: petsCat, sortOrder: 2, isActive: true },
    { id: cuid(), name: 'طيور', nameAr: 'طيور', nameFr: 'Oiseaux', slug: 'birds', icon: 'bird', parentId: petsCat, sortOrder: 3, isActive: true },
    { id: cuid(), name: 'إكسسوارات حيوانات', nameAr: 'إكسسوارات حيوانات', nameFr: 'Accessoires Animaux', slug: 'pet-supplies', icon: 'bone', parentId: petsCat, sortOrder: 4, isActive: true },
    
    // Jobs & Services
    { id: cuid(), name: 'وظائف تقنية', nameAr: 'وظائف تقنية', nameFr: 'Emplois Tech', slug: 'tech-jobs', icon: 'code', parentId: jobsCat, sortOrder: 1, isActive: true },
    { id: cuid(), name: 'وظائف تجارية', nameAr: 'وظائف تجارية', nameFr: 'Emplois Commerciaux', slug: 'business-jobs', icon: 'briefcase', parentId: jobsCat, sortOrder: 2, isActive: true },
    { id: cuid(), name: 'خدمات منزلية', nameAr: 'خدمات منزلية', nameFr: 'Services Ménagers', slug: 'home-services', icon: 'home', parentId: jobsCat, sortOrder: 3, isActive: true },
    { id: cuid(), name: 'خدمات تعليمية', nameAr: 'خدمات تعليمية', nameFr: 'Services Éducatifs', slug: 'education-services', icon: 'graduation-cap', parentId: jobsCat, sortOrder: 4, isActive: true },
    { id: cuid(), name: 'صيانة وبناء', nameAr: 'صيانة وبناء', nameFr: 'Réparation & Construction', slug: 'repair-construction', icon: 'hammer', parentId: jobsCat, sortOrder: 5, isActive: true },
    { id: cuid(), name: 'صحة وجمال', nameAr: 'صحة وجمال', nameFr: 'Santé & Beauté', slug: 'health-beauty', icon: 'sparkles', parentId: jobsCat, sortOrder: 6, isActive: true },
  ];

  const { data: subcatsData, error: subcatsErr } = await supabase
    .from('categories')
    .upsert(subcategories, { onConflict: 'slug' })
    .select();

  if (subcatsErr) {
    console.log('❌ Subcategories error:', subcatsErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${subcatsData.length} subcategories`);
    successCount += subcatsData.length;
  }

  // ==================== TOKEN PACKAGES ====================
  console.log('\n💎 Seeding Token Packages...');
  const now = new Date().toISOString();
  const tokenPackages = [
    { id: cuid(), name: 'الباقة الأساسية', tokens: 10, price: 10, currency: 'MAD', bonusTokens: 0, isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'الباقة الشعبية', tokens: 25, price: 20, currency: 'MAD', bonusTokens: 5, isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'باقة القيمة', tokens: 60, price: 40, currency: 'MAD', bonusTokens: 15, isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'الباقة الاحترافية', tokens: 130, price: 80, currency: 'MAD', bonusTokens: 40, isActive: true, sortOrder: 4, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'باحة الأعمال', tokens: 300, price: 150, currency: 'MAD', bonusTokens: 100, isActive: true, sortOrder: 5, createdAt: now, updatedAt: now },
  ];

  const { data: packagesData, error: packagesErr } = await supabase
    .from('token_packages')
    .upsert(tokenPackages, { onConflict: 'id' })
    .select();

  if (packagesErr) {
    console.log('❌ Token Packages error:', packagesErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${packagesData.length} token packages`);
    successCount += packagesData.length;
  }

  // ==================== SUBSCRIPTION PLANS ====================
  console.log('\n📋 Seeding Subscription Plans...');
  const plans = [
    { id: cuid(), name: 'مجاني', nameAr: 'مجاني', nameFr: 'Gratuit', description: 'خطة مجانية للمستخدمين العاديين', price: 0, currency: 'MAD', durationDays: 365, features: JSON.stringify({ listingsPerMonth: 5, imagesPerListing: 3, featuredListings: 0, support: 'community' }), maxListings: 5, maxImagesPerListing: 3, canPromote: false, hasAnalytics: false, hasCustomBranding: false, prioritySupport: false, isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'احترافي', nameAr: 'احترافي', nameFr: 'Professionnel', description: 'للبائعين المحترفين', price: 99, currency: 'MAD', durationDays: 30, features: JSON.stringify({ listingsPerMonth: 50, imagesPerListing: 10, featuredListings: 5, support: 'email' }), maxListings: 50, maxImagesPerListing: 10, canPromote: true, hasAnalytics: true, hasCustomBranding: false, prioritySupport: false, isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'أعمال', nameAr: 'أعمال', nameFr: 'Business', description: 'للشركات والمتاجر', price: 299, currency: 'MAD', durationDays: 30, features: JSON.stringify({ listingsPerMonth: 200, imagesPerListing: 20, featuredListings: 20, support: 'priority' }), maxListings: 200, maxImagesPerListing: 20, canPromote: true, hasAnalytics: true, hasCustomBranding: true, prioritySupport: true, isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'مؤسسة', nameAr: 'مؤسسة', nameFr: 'Entreprise', description: 'للشركات الكبيرة', price: 799, currency: 'MAD', durationDays: 30, features: JSON.stringify({ listingsPerMonth: -1, imagesPerListing: 50, featuredListings: -1, support: 'dedicated' }), maxListings: null, maxImagesPerListing: 50, canPromote: true, hasAnalytics: true, hasCustomBranding: true, prioritySupport: true, isActive: true, sortOrder: 4, createdAt: now, updatedAt: now },
  ];

  const { data: plansData, error: plansErr } = await supabase
    .from('plans')
    .upsert(plans, { onConflict: 'id' })
    .select();

  if (plansErr) {
    console.log('❌ Plans error:', plansErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${plansData.length} subscription plans`);
    successCount += plansData.length;
  }

  // ==================== PROMOTIONS ====================
  console.log('\n⭐ Seeding Promotions...');
  const promotions = [
    { id: cuid(), name: 'إعلان مميز', type: 'feature', description: 'ظهور في أعلى النتائج مع شارة مميزة', basePrice: 15, currency: 'MAD', durationHours: 168, maxDurationHours: 720, isActive: true, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'إعلان عاجل', type: 'urgent', description: 'شارة "عاجل" لجذب الانتباه', basePrice: 10, currency: 'MAD', durationHours: 168, maxDurationHours: 720, isActive: true, sortOrder: 2, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'رفع الإعلان', type: 'bump', description: 'إعادة الإعلان لأعلى القائمة', basePrice: 5, currency: 'MAD', durationHours: 0, maxDurationHours: 0, isActive: true, sortOrder: 3, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'الصفحة الرئيسية', type: 'homepage', description: 'ظهور على الصفحة الرئيسية', basePrice: 50, currency: 'MAD', durationHours: 168, maxDurationHours: 720, isActive: true, sortOrder: 4, createdAt: now, updatedAt: now },
    { id: cuid(), name: 'تمييز باللون', type: 'highlight', description: 'خلفية ملونة للإعلان', basePrice: 8, currency: 'MAD', durationHours: 168, maxDurationHours: 720, isActive: true, sortOrder: 5, createdAt: now, updatedAt: now },
  ];

  const { data: promosData, error: promosErr } = await supabase
    .from('promotions')
    .upsert(promotions, { onConflict: 'id' })
    .select();

  if (promosErr) {
    console.log('❌ Promotions error:', promosErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${promosData.length} promotions`);
    successCount += promosData.length;
  }

  // ==================== ROLES ====================
  console.log('\n👥 Seeding Roles...');
  const roles = [
    { id: cuid(), name: 'user', description: 'مستخدم عادي' },
    { id: cuid(), name: 'verified_user', description: 'مستخدم موثق' },
    { id: cuid(), name: 'professional_seller', description: 'بائع محترف' },
    { id: cuid(), name: 'moderator', description: 'مشرف' },
    { id: cuid(), name: 'support_agent', description: 'موارد دعم' },
    { id: cuid(), name: 'finance_manager', description: 'مدير مالي' },
    { id: cuid(), name: 'content_manager', description: 'مدير محتوى' },
    { id: cuid(), name: 'analyst', description: 'محلل' },
    { id: cuid(), name: 'admin', description: 'مدير نظام' },
    { id: cuid(), name: 'super_admin', description: 'مدير عام' },
  ];

  const { data: rolesData, error: rolesErr } = await supabase
    .from('roles')
    .upsert(roles, { onConflict: 'name' })
    .select();

  if (rolesErr) {
    console.log('❌ Roles error:', rolesErr.message);
    errorCount++;
  } else {
    console.log(`   ✅ ${rolesData.length} roles`);
    successCount += rolesData.length;
  }

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETED!');
  console.log('='.repeat(50));
  console.log(`\n✅ Successful inserts: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('\n📊 Data Summary:');
  console.log('   📍 Countries: 9');
  console.log('   🗺️ Regions: 12 (Morocco)');
  console.log('   🏙️ Cities: 15 (Major Moroccan Cities)');
  console.log('   💰 Currencies: 10');
  console.log('   📂 Main Categories: 12');
  console.log('   📂 Subcategories: 41');
  console.log('   💎 Token Packages: 5');
  console.log('   📋 Subscription Plans: 4');
  console.log('   ⭐ Promotions: 5');
  console.log('   👥 Roles: 10');
  console.log('\n✨ MAVORA is now ready to use!');
}

seedDatabase().catch(console.error);
