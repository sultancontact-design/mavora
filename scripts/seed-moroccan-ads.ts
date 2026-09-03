/**
 * Moroccan Classified Ads Seeder - سكريبت الإعلانات المغربية
 * 
 * Creates 50 realistic Moroccan classified ads with:
 * - Real Moroccan phone numbers (+212 6XX XXX XXX / +212 7XX XXX XXX)
 * - Prices in MAD (Moroccan Dirham)
 * - Moroccan cities and neighborhoods
 * - Realistic descriptions in Arabic/French
 * - Multiple categories (Vehicles, Real Estate, Electronics, Services, etc.)
 * 
 * Run: npx tsx scripts/seed-moroccan-ads.ts
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// Configuration
// ============================================================

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ============================================================
// Moroccan Data References
// ============================================================

const moroccanCities = [
  { id: 'casablanca', name_ar: 'الدار البيضاء', name_fr: 'Casablanca', name_en: 'Casablanca' },
  { id: 'rabat', name_ar: 'الرباط', name_fr: 'Rabat', name_en: 'Rabat' },
  { id: 'marrakech', name_ar: 'مراكش', name_fr: 'Marrakech', name_en: 'Marrakech' },
  { id: 'fes', name_ar: 'فاس', name_fr: 'Fès', name_en: 'Fes' },
  { id: 'tangier', name_ar: 'طنجة', name_fr: 'Tanger', name_en: 'Tangier' },
  { id: 'agadir', name_ar: 'أكادير', name_fr: 'Agadir', name_en: 'Agadir' },
  { id: 'meknes', name_ar: 'مكناس', name_fr: 'Meknès', name_en: 'Meknes' },
  { id: 'oujda', name_ar: 'وجدة', name_fr: 'Oujda', name_en: 'Oujda' },
  { id: 'kenitra', name_ar: 'القنطرة', name_fr: 'Kénitra', name_en: 'Kenitra' },
  { id: 'tetouan', name_ar: 'تطوان', name_fr: 'Tétouan', name_en: 'Tetouan' },
  { id: 'safi', name_ar: 'الصفيرة', name_fr: 'Safi', name_en: 'Safi' },
  { id: 'el-jadida', name_ar: 'الجديدة', name_fr: 'El Jadida', name_en: 'El Jadida' },
  { id: 'nador', name_ar: 'Nador', name_fr: 'Nador', name_en: 'Nador' },
  { id: 'beni-mellal', name_ar: 'بني ملال', name_fr: 'Béni Mellal', name_en: 'Beni Mellal' },
];

const neighborhoods: Record<string, string[]> = {
  casablanca: ['المحمدية', 'عين الشقق', 'المعاريف', 'الأنورة', 'الفايدة', 'سدري', 'الحي المحمدي', 'بوشعير'],
  rabat: ['الأغدال', 'الحي الياباني', 'الوسطى', 'الحسن', 'توارة', 'يعقوب المنصور'],
  marrakech: ['الجيزة', 'الد الحوز', 'المنارة', 'ميلي', 'سيدي يوسف'],
  fes: ['الأطلس', 'جنان الورد', 'الماريست', 'زواغ'],
  tangier: ['المندس', 'ابن بطوطة', 'البريدق'],
  agadir: ['الهدى', 'سالي', 'الدشيرة', 'إيليغ'],
};

// Generate realistic Moroccan phone numbers
function generateMoroccanPhone(cityId: string): string {
  const prefixes = ['6', '7']; // Mobile prefixes
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const secondDigit = Math.floor(Math.random() * 4) + 6; // 6-9 for mobile
  return `+212 ${prefix}${secondDigit} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`;
}

// Generate random price in MAD
function generatePrice(min: number, max: number): number {
  return Math.floor((Math.random() * (max - min) + min) / 100) * 100; // Round to nearest 100
}

// ============================================================
// 50 Realistic Moroccan Classified Ads
// ============================================================

const listings = [
  // ==================== VEHICLES (10 ads) ====================
  {
    title_ar: 'رينو كليو 2020 بحالة ممتازة',
    title_fr: 'Renault Clio 2020 Excellent état',
    title_en: 'Renault Clio 2020 Excellent Condition',
    description_ar: 'رينو كليو موديل 2020، لون أبيض، ماشية 45,000 كم فقط. سيارة نظيفة جداً وبحالة ممتازة. مكيف يعمل بشكل ممتاز، كهرباء كاملة. ورقة صالحة حتى نهاية السنة.',
    description_fr: 'Renault Clio modèle 2020, couleur blanche, seulement 45 000 km. Voiture très propre en excellent état. Climatisation parfaite, plein d\'options. Carte grise valide.',
    description_en: 'Renault Clio 2020 model, white color, only 45,000 km. Very clean car in excellent condition. Perfect AC, full options. Valid registration.',
    category_slug: 'vehicles',
    subcategory_slug: 'cars',
    city_id: 'casablanca',
    price: 145000,
    currency: 'MAD',
    phone: '+212 6 61 234 567',
    seller_name: 'محمد العلوي',
    seller_email: 'mohammed.a@mavora.ma',
    images_count: 4,
    is_negotiable: true,
    condition: 'used',
  },
  {
    title_ar: 'بيجو 206 للبيع - حالة جيدة',
    title_fr: 'Peugeot 206 à vendre - Bon état',
    title_en: 'Peugeot 206 for Sale - Good Condition',
    description_ar: 'بيجو 206 موديل 2018، لون رمادي، ماشية 78,000 كم. محرك قوي واستهلاك اقتصادي. مناسب للعمل اليومي. فحص جديد.',
    description_fr: 'Peugeot 206 modèle 2018, couleur grise, 78 000 km. Moteur puissant, consommation économique. Idéale au quotidien. Contrôle technique récent.',
    description_en: 'Peugeot 206 2018 model, gray color, 78,000 km. Powerful engine, economical consumption. Suitable for daily use. Recent inspection.',
    category_slug: 'vehicles',
    subcategory_slug: 'cars',
    city_id: 'casablanca',
    price: 85000,
    currency: 'MAD',
    phone: '+212 6 72 345 678',
    seller_name: 'فاطمة الزهراء',
    seller_email: 'fatima.z@mavora.ma',
    images_count: 5,
    is_negotiable: true,
    condition: 'used',
  },
  {
    title_ar: 'دراجة نارية هوندا 125 جديدة',
    title_fr: 'Moto Honda 125 Neuve',
    title_en: 'Honda 125 Motorcycle New',
    description_ar: 'دراجة نارية هوندا CG 125 موديل 2024، لون أسود. جديدة تماماً من الوكالة. ضمان سنتين. استهلاك وقود قليل جداً.',
    description_fr: 'Moto Honda CG 125 modèle 2024, couleur noire. Toute neuve de concessionnaire. Garantie 2 ans. Très faible consommation.',
    description_en: 'Honda CG 125 motorcycle 2024 model, black color. Brand new from dealership. 2-year warranty. Very low fuel consumption.',
    category_slug: 'vehicles',
    subcategory_slug: 'motorcycles',
    city_id: 'marrakech',
    price: 32000,
    currency: 'MAD',
    phone: '+212 6 65 456 789',
    seller_name: 'عبد الرحيم المنصوري',
    seller_email: 'abderrahim.m@mavora.ma',
    images_count: 6,
    is_negotiable: false,
    condition: 'new',
  },
  {
    title_ar: 'دياتس تيريو 2021 - عروض خاصة',
    title_fr: 'Daihatsu Terios 2021 - Offre spéciale',
    title_en: 'Daihatsu Terios 2021 - Special Offer',
    description_ar: 'دياتس تيريو 2021، لون أحمر، دفع رباعي، ماشية 35,000 كم. سيارة عائلية مثالية. ضوء نهاري، كاميرا خلفية، بلوتوث.',
    description_fr: 'Daihatsu Terios 2021, couleur rouge, 4x4, 35 000 km. Voiture familiale idéale. Feux de jour, caméra de recul, Bluetooth.',
    description_en: 'Daihatsu Terios 2021, red color, 4WD, 35,000 km. Ideal family car. Daytime lights, rear camera, Bluetooth.',
    category_slug: 'vehicles',
    subcategory_slug: 'cars',
    city_id: 'tangier',
    price: 195000,
    currency: 'MAD',
    phone: '+212 6 67 567 890',
    seller_name: 'يوسف البكري',
    seller_email: 'youssef.b@mavora.ma',
    images_count: 8,
    is_negotiable: true,
    condition: 'used',
  },
  {
    title_ar: 'فولكس فاغن غولف 7 موديل 2019',
    title_fr: 'Volkswagen Golf 7 Modèle 2019',
    title_en: 'Volkswagen Golf 7 Model 2019',
    description_ar: 'فولكس فاغن غولف 7، لون أزرق، ديزل، ماشية 62,000 كم. قوية ومريحة. نوافذ كهربائية، مقاعد جلد، نظام صوتي فاخر.',
    description_fr: 'VW Golf 7, bleue, diesel, 62 000 km. Puissante et confortable. Vitres électriques, sièges cuir, sonorité haut de gamme.',
    description_en: 'VW Golf 7, blue color, diesel, 62,000 km. Powerful and comfortable. Electric windows, leather seats, premium sound system.',
    category_slug: 'vehicles',
    subcategory_slug: 'cars',
    city_id: 'rabat',
    price: 220000,
    currency: 'MAD',
    phone: '+212 6 70 678 901',
    seller_name: 'سارة الحسني',
    seller_email: 'sara.h@mavora.ma',
    images_count: 7,
    is_negotiable: true,
    condition: 'used',
  },
  {
    title_ar: 'شاحنة نقل صغيرة - إيسوزو',
    title_fr: 'Camionnette de transport - Isuzu',
    title_en: 'Small Transport Truck - Isuzu',
    description_ar: 'شاحنة إيسوزو نبر 2020، حالة ممتازة، مهيئة لنقل البضائع. حاملة 3 طن. فحص ساري. مناسبة للمقاولات.',
    description_fr: 'Camion Isuzu NBR 2020, excellent état, aménagée pour le transport de marchandises. Charge utile 3 tonnes. CT en cours. Idéale pour entrepreneurs.',
    description_en: 'Isuzu NBR truck 2020, excellent condition, equipped for goods transport. 3-ton capacity. Valid inspection. Great for contractors.',
    category_slug: 'vehicles',
    subcategory_slug: 'trucks',
    city_id: 'casablanca',
    price: 280000,
    currency: 'MAD',
    phone: '+212 6 61 789 012',
    seller_name: 'كريم الفاسي',
    seller_email: 'karim.f@mavora.ma',
    images_count: 5,
    is_negotiable: true,
    condition: 'used',
  },
  {
    title_ar: 'دراجة ياماها R15 بحالة جديدة',
    title_fr: 'Moto Yamaha R15 Comme neuve',
    title_en: 'Yamaha R15 Motorcycle Like New',
    description_ar: 'ياماها R15 موديل 2022، لون أخضر/أسود، ماشية 8,000 كم فقط. سرعة وقوة استثنائية. قطع أصلية بالكامل.',
    description_fr: 'Yamaha R15 2022, vert/noir, seulement 8 000 km. Vitesse et puissance exceptionnelles. Pièces 100% originales.',
    description_en: 'Yamaha R15 2022, green/black, only 8,000 km. Exceptional speed and power. 100% original parts.',
    category_slug: 'vehicles',
    subcategory_slug: 'motorcycles',
    city_id: 'agadir',
    price: 45000,
    currency: 'MAD',
    phone: '+212 6 68 890 123',
    seller_name: 'أيمن التازي',
    seller_email: 'aymen.t@mavora.ma',
    images_count: 9,
    is_negotiable: false,
    condition: 'like_new',
  },
  {
    title_ar: 'Dacia Logan 2022 - أول مالك',
    title_fr: 'Dacia Logan 2022 - Premier propriétaire',
    title_en: 'Dacia 2022 - First Owner',
    description_ar: 'داسيا لوغان 2022، لون فضي، غازوالين، 28,000 كم. سيارة عملية واقتصادية. مكيف، بلوتوث، USB. ضمان الوكالة باقي.',
    description_fr: 'Dacia Logan 2022, argentée, essence, 28 000 km. Voiture pratique et économique. Clim, Bluetooth, USB. Garantie constructeur restante.',
    description_en: 'Dacia Logan 2022, silver, gasoline, 28,000 km. Practical and economical car. AC, Bluetooth, USB. Remaining dealer warranty.',
    category_slug: 'vehicles',
    subcategory_slug: 'cars',
    city_id: 'fes',
    price: 165000,
    currency: 'MAD',
    phone: '+212 6 76 901 234',
    seller_name: 'نادية العمراني',
    seller_email: 'nadia.a@mavora.ma',
    images_count: 6,
    is_negotiable: true,
    condition: 'like_new',
  },
  {
    title_ar: 'قطع غيار أصلية - بيوجو وسيتروين',
    title_fr: 'Pièces détachées originales - Peugeot & Citroën',
    title_en: 'Original Spare Parts - Peugeot & Citroen',
    description_ar: 'قطع غيار أصلية لسيارات بيجو وسيتروين. متوفرة: فرامل، فلتر، بلورين، جنوط، مصابيح. أسعار منافسة مع ضمان الجودة.',
    description_fr: 'Pièces détachées originales Peugeot et Citroën. Disponibles: freins, filtres, phares, jantes, ampoules. Prix compétitifs, qualité garantie.',
    description_en: 'Original spare parts for Peugeot & Citroen cars. Available: brakes, filters, headlights, rims, bulbs. Competitive prices, quality guaranteed.',
    category_slug: 'vehicles',
    subcategory_slug: 'spare-parts',
    city_id: 'casablanca',
    price: 500,
    currency: 'MAD',
    phone: '+212 6 62 012 345',
    seller_name: 'رضا القطعي',
    seller_email: 'reda.k@mavora.ma',
    images_count: 12,
    is_negotiable: true,
    condition: 'new',
  },
  {
    title_ar: 'هيونداي إلنترا 2020 - عرض مستعجل',
    title_fr: 'Hyundai Elantra 2020 - Vente urgente',
    title_en: 'Hyundai Elantra 2020 - Urgent Sale',
    description_ar: 'هيونداي إلنترا 2020، لون أبيض، أوتوماتيك، 55,000 км. سيارة أنيقة وعملية. شاشة لمس، كاميرا 360، حساسات ركن. سبب البيع: السفر.',
    description_fr: 'Hyundai Elantra 2020, blanche, automatique, 55 000 km. Voiture élégante et pratique. Écran tactile, caméra 360°, capteurs de stationnement. Raison: départ à l\'étranger.',
    description_en: 'Hyundai Elantra 2020, white, automatic, 55,000 km. Elegant and practical car. Touch screen, 360 camera, parking sensors. Reason: traveling abroad.',
    category_slug: 'vehicles',
    subcategory_slug: 'cars',
    city_id: 'marrakech',
    price: 235000,
    currency: 'MAD',
    phone: '+212 6 74 123 456',
    seller_name: 'لمياء الرشيدي',
    seller_email: 'lamia.r@mavora.ma',
    images_count: 10,
    is_negotiable: true,
    condition: 'used',
  },

  // ==================== REAL ESTATE (10 ads) ====================
  {
    title_ar: 'شقة للبيع بالمحمدية - الدار البيضاء',
    title_fr: 'Appartement à vendre à Mohammed V - Casablanca',
    title_en: 'Apartment for Sale in Mohammed V - Casablanca',
    description_ar: 'شقة مساحتها 95 م² في الطابق الثالث مع مصعد. 3 غرف نوم، صالون واسع، مطبخ مجهز، حمامان. موقع ممتاز قريب من جميع الخدمات.',
    description_fr: 'Appartement de 95 m² au 3ème étage avec ascenseur. 3 chambres, grand salon, cuisine équipée, 2 SDB. Emplacement idéal près de toutes commodités.',
    description_en: '95 sqm apartment on 3rd floor with elevator. 3 bedrooms, large living room, equipped kitchen, 2 bathrooms. Prime location near all amenities.',
    category_slug: 'real-estate',
    subcategory_slug: 'apartments',
    city_id: 'casablanca',
    price: 850000,
    currency: 'MAD',
    phone: '+212 6 63 234 567',
    seller_name: 'عبد الله الكريمي',
    seller_email: 'abdallah.k@mavora.ma',
    images_count: 8,
    is_negotiable: true,
    property_type: 'apartment',
    area_sqm: 95,
    rooms: 3,
  },
  {
    title_ar: 'فيلا فاخرة للبيع بمراكش - Palmeraie',
    title_fr: 'Villa de luxe à vendre à Marrakech - Palmeraie',
    title_en: 'Luxury Villa for Sale in Marrakech - Palmeraie',
    description_ar: 'فيلا فاخرة مساحتها 450 م² مع حديقة 800 م². 5 غرف نوم رئيسية، pool، صالون كبير بمدفأة، مطبخ مفتوح. أمن على مدار الساعة.',
    description_fr: 'Villa de luxe de 450 m² avec jardin de 800 m². 5 chambres principales, piscine, grand salon avec cheminée, cuisine ouverte. Sécurité 24/24.',
    description_en: 'Luxury villa 450 sqm with 800 sqm garden. 5 master bedrooms, pool, large living room with fireplace, open kitchen. 24/7 security.',
    category_slug: 'real-estate',
    subcategory_slug: 'villas',
    city_id: 'marrakech',
    price: 8500000,
    currency: 'MAD',
    phone: '+212 6 66 345 678',
    seller_name: 'أنس الصغير',
    seller_email: 'anas.s@mavora.ma',
    images_count: 15,
    is_negotiable: false,
    property_type: 'villa',
    area_sqm: 450,
    rooms: 5,
  },
  {
    title_ar: 'استوديو للكراء - الأغال Rabat',
    title_fr: 'Studio à louer - Agdal Rabat',
    title_en: 'Studio for Rent - Agdal Rabat',
    description_ar: 'استوديو عصري مساحته 45 م²، الطابق الأول. مجهز بالكامل: مطبخ، خزانة، مكيف. قريب من المترو والمحلات التجارية. إيجار شهري.',
    description_fr: 'Studio moderne de 45 m², 1er étage. Entièrement équipé: cuisine, placards, clim. Proche du tramway et commerces. Loyer mensuel.',
    description_en: 'Modern studio 45 sqm, 1st floor. Fully equipped: kitchen, closets, AC. Near tram and shops. Monthly rent.',
    category_slug: 'real-estate',
    subcategory_slug: 'studios',
    city_id: 'rabat',
    price: 3500,
    currency: 'MAD',
    phone: '+212 6 71 456 789',
    seller_name: 'منال البناي',
    seller_email: 'manal.b@mavora.ma',
    images_count: 6,
    is_negotiable: false,
    property_type: 'studio',
    area_sqm: 45,
    rooms: 1,
  },
  {
    title_ar: 'أرض بناء للبيع - سطات',
    title_fr: 'Terrain à bâtir à vendre - Settat',
    title_en: 'Building Land for Sale - Settat',
    description_ar: 'أرضية مساحتها 300 م² في حي سكني هادئ. مرخصة للبناء S+2. قريبة من المدارس والمستشفيات. فرصة استثمارية ممتازة.',
    description_fr: 'Terrain de 300 m² dans quartier résidentiel calme. Autorisation S+2. Proche écoles et hôpitaux. Excellente opportunité d\'investissement.',
    description_en: '300 sqm land in quiet residential area. Building permit S+2. Near schools and hospitals. Excellent investment opportunity.',
    category_slug: 'real-estate',
    subcategory_slug: 'land',
    city_id: 'beni-mellal',
    price: 1200000,
    currency: 'MAD',
    phone: '+212 6 77 567 890',
    seller_name: 'حمزة الهاشمي',
    seller_email: 'hamza.h@mavora.ma',
    images_count: 4,
    is_negotiable: true,
    property_type: 'land',
    area_sqm: 300,
    rooms: 0,
  },
  {
    title_ar: 'محل تجاري للكراء - المركز التجاري ANFA',
    title_fr: 'Local commercial à louer - Centre commercial ANFA',
    title_en: 'Commercial Space for Rent - ANFA Shopping Center',
    description_ar: 'محل تجاري مساحته 120 م² في مركز تجاري حيوي. واجهة كبيرة، مواقف سيارات، دورات مياه. مناسب لجميع الأنشطة التجارية.',
    description_fr: 'Local commercial de 120 m² dans centre commercial dynamique. Grande vitrine, parking, sanitaires. Convient à toutes activités commerciales.',
    description_en: 'Commercial space 120 sqm in busy shopping center. Large display window, parking, bathrooms. Suitable for all business activities.',
    category_slug: 'real-estate',
    subcategory_slug: 'commercial',
    city_id: 'casablanca',
    price: 15000,
    currency: 'MAD',
    phone: '+212 6 69 678 901',
    seller_name: 'سمير المعشي',
    seller_email: 'samir.m@mavora.ma',
    images_count: 7,
    is_negotiable: true,
    property_type: 'commercial',
    area_sqm: 120,
    rooms: 0,
  },
  {
    title_ar: 'شقة إيجار مفروش - عين الشقق',
    title_fr: 'Appartement meublé à louer - Ain Chock',
    title_en: 'Furnished Apartment for Rent - Ain Chock',
    description_ar: 'شقة مفروشة بأناقة، 75 م²، 2 غرف نوم. أثاث عصري، تلفزيون، إنترنت، غسالة. مجمع سكني مع حارس وأمن.',
    description_fr: 'Appartement meublé élégamment, 75 m², 2 chambres. Mobilier moderne, TV, internet, lave-linge. Résidence avec gardien et sécurité.',
    description_en: 'Elegantly furnished apartment, 75 sqm, 2 bedrooms. Modern furniture, TV, internet, washing machine. Residential complex with guard and security.',
    category_slug: 'real-estate',
    subcategory_slug: 'apartments',
    city_id: 'casablanca',
    price: 6000,
    currency: 'MAD',
    phone: '+212 6 64 789 012',
    seller_name: 'إكرام الناظور',
    seller_email: 'ikram.n@mavora.ma',
    images_count: 9,
    is_negotiable: false,
    property_type: 'apartment',
    area_sqm: 75,
    rooms: 2,
  },
  {
    title_ar: 'ريف فاخر بإقبالط - فاس',
    title_fr: 'Riad luxueux à Iqbal - Fès',
    title_en: 'Luxury Riad in Iqbal - Fes',
    description_ar: 'ريف تقليدي مجدد بفخامة، 6 غرف نوم، 4 حمامات، patio داخلي، تراس بسطح. مناسب للسكن أو الاستثمار السياحي.',
    description_fr: 'Riad traditionnel rénové avec luxe, 6 chambres, 4 SDB, patio interne, terrasse toit. Idéal habitation ou investissement touristique.',
    description_en: 'Traditional riad luxuriously renovated, 6 bedrooms, 4 bathrooms, internal patio, roof terrace. Suitable for residence or tourism investment.',
    category_slug: 'real-estate',
    subcategory_slug: 'riads',
    city_id: 'fes',
    price: 3500000,
    currency: 'MAD',
    phone: '+212 6 73 890 123',
    seller_name: 'خديجة الفهري',
    seller_email: 'khadija.f@mavora.ma',
    images_count: 18,
    is_negotiable: true,
    property_type: 'riad',
    area_sqm: 280,
    rooms: 6,
  },
  {
    title_ar: 'مكتب للكراء - طنجة المدينة',
    title_fr: 'Bureau à louer - Tanger Ville',
    title_en: 'Office for Rent - Tanger City',
    description_ar: 'مساحة مكتبية 60 م² في برج حديث. مكيف مركزي، إنترنت فائق السرعة، غرفة اجتماعات. إطلالة على البحر. يشمل الخدمات.',
    description_fr: 'Espace bureaux 60 m² dans tour moderne. clim centrale, internet très haut débit, salle de réunion. Vue sur mer. Charges comprises.',
    description_en: 'Office space 60 sqm in modern building. Central AC, ultra-high speed internet, meeting room. Sea view. Utilities included.',
    category_slug: 'real-estate',
    subcategory_slug: 'offices',
    city_id: 'tangier',
    price: 8000,
    currency: 'MAD',
    phone: '+212 6 76 901 234',
    seller_name: 'نبيل البكري',
    seller_email: 'nabil.b@mavora.ma',
    images_count: 5,
    is_negotiable: true,
    property_type: 'office',
    area_sqm: 60,
    rooms: 0,
  },
  {
    title_ar: 'شقة صغيرة للبيع - أكادير',
    title_fr: 'Petit appartement à vendre - Agadir',
    title_en: 'Small Apartment for Sale - Agadir',
    description_ar: 'شقة 55 م²، غرفة نوم واحدة، صالون، مطبخ، حمام. الطابق الأخير مع تراس صغير. قريبة من الشاطئ. مثالية للأزواج أو الاستثمار.',
    description_fr: 'Appartement 55 m², 1 chambre, salon, cuisine, SDB. Dernier étage avec petite terrasse. Proche de la plage. Idéal couple ou investissement.',
    description_en: '55 sqm apartment, 1 bedroom, living room, kitchen, bathroom. Top floor with small terrace. Near beach. Perfect for couples or investment.',
    category_slug: 'real-estate',
    subcategory_slug: 'apartments',
    city_id: 'agadir',
    price: 420000,
    currency: 'MAD',
    phone: '+212 6 78 012 345',
    seller_name: 'سعاد الصحراوي',
    seller_email: 'souad.s@mavora.ma',
    images_count: 7,
    is_negotiable: true,
    property_type: 'apartment',
    area_sqm: 55,
    rooms: 1,
  },
  {
    title_ar: 'جراج+mخزن للكراء - الدار البيضاء',
    title_fr: 'Garage+Entrepôt à louer - Casablanca',
    title_en: 'Garage+Warehouse for Rent - Casablanca',
    description_ar: 'مساحة 200 م² شاملة جراج ومخزن. مدخل واسع للشاحنات، كهرباء ثلاثي الطور، مياه. مناسب للمقاولات والتخزين.',
    description_fr: 'Espace 200 m² comprenant garage et entrepôt. Large accès pour camions, électricité triphasée, eau. Idéal artisans et stockage.',
    description_en: '200 sqm space including garage and warehouse. Wide truck access, three-phase electricity, water. Great for contractors and storage.',
    category_slug: 'real-estate',
    subcategory_slug: 'warehouses',
    city_id: 'casablanca',
    price: 5000,
    currency: 'MAD',
    phone: '+212 6 62 123 456',
    seller_name: 'عزيز المراكشي',
    seller_email: 'aziz.m@mavora.ma',
    images_count: 4,
    is_negotiable: true,
    property_type: 'warehouse',
    area_sqm: 200,
    rooms: 0,
  },

  // ==================== ELECTRONICS (8 ads) ====================
  {
    title_ar: 'آيفون 14 برو ماكس - 256GB',
    title_fr: 'iPhone 14 Pro Max - 256GB',
    title_en: 'iPhone 14 Pro Max - 256GB',
    description_ar: 'آيفون 14 برو ماكس، لون عميق، 256GB. الحالة ممتازة بدون أي خدش. شاحن وصندوق أصلي. ضمان باقي 6 أشهر.',
    description_fr: 'iPhone 14 Pro Max, Deep Purple, 256GB. État impeccable sans aucune rayure. Chargeur et boîte originaux. Garantie 6 mois restants.',
    description_en: 'iPhone 14 Pro Max, Deep Purple, 256GB. Immaculate condition without any scratches. Original charger and box. 6 months warranty remaining.',
    category_slug: 'electronics',
    subcategory_slug: 'phones',
    city_id: 'casablanca',
    price: 11000,
    currency: 'MAD',
    phone: '+212 6 65 234 567',
    seller_name: 'أمين الحسني',
    seller_email: 'amine.h@mavora.ma',
    images_count: 6,
    is_negotiable: true,
    condition: 'like_new',
  },
  {
    title_ar: 'لابتوب MacBook Air M2 - جديد',
    title_fr: 'MacBook Air M2 - Neuf',
    title_en: 'MacBook Air M2 - New',
    description_ar: 'ماك بوك إير M2، 8GB RAM، 256GB SSD، شاشة 13 بوصة. لون فضي. جديد في الصندوق. ضمان أبل سنة كاملة.',
    description_fr: 'MacBook Air M2, 8Go RAM, 256Go SSD, écran 13 pouces. Argent. Neuf sous blister. Garantie Apple 1 an complète.',
    description_en: 'MacBook Air M2, 8GB RAM, 256GB SSD, 13-inch screen. Silver color. New in box. Full 1-year Apple warranty.',
    category_slug: 'electronics',
    subcategory_slug: 'laptops',
    city_id: 'rabat',
    price: 14500,
    currency: 'MAD',
    phone: '+212 6 70 345 678',
    seller_name: 'ليلى المنوري',
    seller_email: 'layla.m@mavora.ma',
    images_count: 8,
    is_negotiable: false,
    condition: 'new',
  },
  {
    title_ar: 'تلفزيون سامسونج 55 بوصة 4K Smart',
    title_fr: 'TV Samsung 55 pouces 4K Smart',
    title_en: 'Samsung 55 inch 4K Smart TV',
    description_ar: 'تلفزيون سامسونج Crystal UHD 55 بوصة، 4K، Smart TV. صورة واضحة وصوت رائع. يعمل بشكل مثالي. مع Remote.',
    description_fr: 'TV Samsung Crystal UHD 55", 4K, Smart TV. Image nette, son superbe. Fonctionne parfaitement. Télécommande incluse.',
    description_en: 'Samsung Crystal UHD TV 55", 4K, Smart TV. Clear picture, great sound. Works perfectly. Remote included.',
    category_slug: 'electronics',
    subcategory_slug: 'tv-audio',
    city_id: 'casablanca',
    price: 5500,
    currency: 'MAD',
    phone: '+212 6 67 456 789',
    seller_name: 'ياسين الجمالي',
    seller_email: 'yassine.j@mavora.ma',
    images_count: 5,
    is_negotiable: true,
    condition: 'used',
  },
  {
    title_ar: 'كاميرا كانون EOS R6 - للاحترافيين',
    title_fr: 'Appareil photo Canon EOS R6 - Pro',
    title_en: 'Canon EOS R6 Camera - Professional',
    description_ar: 'كانون EOS R6 مع عدسة RF 24-105mm. حالة جديدة، استخدمت قليلاً. بطاريتان، شاحن، حقيبة. مناسبة للمصورين المحترفين.',
    description_fr: 'Canon EOS R6 avec objectif RF 24-105mm. Comme neuf, peu utilisé. 2 batteries, chargeur, sac. Idéal photographes pros.',
    description_en: 'Canon EOS R6 with RF 24-105mm lens. Like new, barely used. 2 batteries, charger, bag. Perfect for professional photographers.',
    category_slug: 'electronics',
    subcategory_slug: 'cameras',
    city_id: 'marrakech',
    price: 32000,
    currency: 'MAD',
    phone: '+212 6 74 567 890',
    seller_name: 'سلمى المصري',
    seller_email: 'salma.m@mavora.ma',
    images_count: 10,
    is_negotiable: true,
    condition: 'like_new',
  },
  {
    title_ar: 'بلايستيشن 5 مع ألعاب وإكسسوارات',
    title_fr: 'PlayStation 5 avec jeux et accessoires',
    title_en: 'PlayStation 5 with Games and Accessories',
    description_ar: 'بلايستيشن 5 نسخة ديجيتال، وحدتين تحكم، 5 ألعاب أصلية (FIFA 24، GTA VI، God of War...). headset سوني. كل شيء يعمل بشكل ممتاز.',
    description_fr: 'PS5 édition digitale, 2 manettes, 5 jeux originaux (FIFA 24, GTA VI, God of War...). Casque Sony. Tout fonctionne parfaitement.',
    description_en: 'PS5 Digital Edition, 2 controllers, 5 original games (FIFA 24, GTA VI, God of War...). Sony headset. Everything works perfectly.',
    category_slug: 'electronics',
    subcategory_slug: 'gaming',
    city_id: 'casablanca',
    price: 6500,
    currency: 'MAD',
    phone: '+212 6 68 678 901',
    seller_name: 'أدهم التازي',
    seller_email: 'adhem.t@mavora.ma',
    images_count: 7,
    is_negotiable: true,
    condition: 'used',
  },
  {
    title_ar: 'آيباد برو 11 بوصة - M1 chip',
    title_fr: 'iPad Pro 11 pouces - puce M1',
    title_en: 'iPad Pro 11 inch - M1 chip',
    description_ar: 'آيباد برو 11 بوصة، معالج M1، 256GB، WiFi+Cellular. لون فضي. مع Apple Pencil 2 و Magic Keyboard. حالة ممتازة.',
    description_fr: 'iPad Pro 11", puce M1, 256Go, WiFi+Cellulaire. Argent. Avec Apple Pencil 2 et Magic Keyboard. État excellent.',
    description_en: 'iPad Pro 11", M1 chip, 256GB, WiFi+Cellular. Silver. With Apple Pencil 2 and Magic Keyboard. Excellent condition.',
    category_slug: 'electronics',
    subcategory_slug: 'tablets',
    city_id: 'tangier',
    price: 9000,
    currency: 'MAD',
    phone: '+212 6 71 789 012',
    seller_name: 'رنا العواد',
    seller_email: 'rana.a@mavora.ma',
    images_count: 6,
    is_negotiable: false,
    condition: 'like_new',
  },
  {
    title_ar: 'سماعات Sony WH-1000XM5 - جديدة',
    title_fr: 'Casque Sony WH-1000XM5 - Neuf',
    title_en: 'Sony WH-1000XM5 Headphones - New',
    description_ar: 'سماعات سوني WH-1000XM5، لون أسود. إلغاء ضوضاء استثنائي، عمر بطارية 30 ساعة. جديدة في الصندوق مع جميع الملحقات.',
    description_fr: 'Casque Sony WH-1000XM5, noir. Réduction de bruit exceptionnelle, autonomie 30h. Neuf en boîte avec tous accessoires.',
    description_en: 'Sony WH-1000XM5 headphones, black. Exceptional noise cancellation, 30-hour battery. New in box with all accessories.',
    category_slug: 'electronics',
    subcategory_slug: 'audio',
    city_id: 'agadir',
    price: 2800,
    currency: 'MAD',
    phone: '+212 6 76 890 123',
    seller_name: 'محمد الشاوي',
    seller_email: 'mohammed.s@mavora.ma',
    images_count: 4,
    is_negotiable: false,
    condition: 'new',
  },
  {
    title_ar: 'ساعة ذكية Apple Watch Series 9',
    title_fr: 'Montre connectée Apple Watch Series 9',
    title_en: 'Apple Watch Series 9 Smartwatch',
    description_ar: 'آبل واتش Series 9، 45mm، Aluminum، لون منتصف الليل. مع Apple Care+. حالة ممتازة، تعمل مع iOS.',
    description_fr: 'Apple Watch Series 9, 45mm, Aluminium, Minuit. Avec Apple Care+. Excellent état, compatible iOS.',
    description_en: 'Apple Watch Series 9, 45mm, Aluminum, Midnight color. With Apple Care+. Excellent condition, iOS compatible.',
    category_slug: 'electronics',
    subcategory_slug: 'wearables',
    city_id: 'fes',
    price: 4200,
    currency: 'MAD',
    phone: '+212 6 79 012 345',
    seller_name: 'نور الدين الكطبي',
    seller_email: 'nourddine.k@mavora.ma',
    images_count: 5,
    is_negotiable: true,
    condition: 'like_new',
  },

  // ==================== HOME & GARDEN (5 ads) ====================
  {
    title_ar: 'أريكة مودرن - جلد طبيعي',
    title_fr: 'Canapé moderne - Cuir véritable',
    title_en: 'Modern Sofa - Genuine Leather',
    description_ar: 'أريكة 3 مقاعد + 2 كرسي، جلد طبيعي إيطالي، لون بني. تصميم عصري أنيق. شراؤها قبل 6 أشهر. سبب البيع: الانتقال.',
    description_fr: 'Canapé 3 places + 2 fauteuils, cuir véritable italien, marron. Design moderne élégant. Acheté il y a 6 mois. Raison: déménagement.',
    description_en: '3-seat sofa + 2 armchairs, genuine Italian leather, brown color. Elegant modern design. Bought 6 months ago. Reason: moving.',
    category_slug: 'home-garden',
    subcategory_slug: 'furniture',
    city_id: 'casablanca',
    price: 18000,
    currency: 'MAD',
    phone: '+212 6 63 234 567',
    seller_name: 'فاطمة البكري',
    seller_email: 'fatima.b@mavora.ma',
    images_count: 8,
    is_negotiable: true,
    condition: 'like_new',
  },
  {
    title_ar: 'غرفة نوم كاملة - خشب زان',
    title_fr: 'Chambre à coucher complète - Bois de hêtre',
    title_en: 'Complete Bedroom Set - Beech Wood',
    description_ar: 'غرفة نوم كاملة: سرير queen size، 2 طاولة جانبية، دولاب كبير، تسريحة. خشب زان طبيعي. تصنيع مغربي عالي الجودة.',
    description_fr: 'Chambre complète: lit queen size, 2 tables de chevet, grande armoire, coiffeuse. bois de hêtre naturel. Fabrication marocaine haute qualité.',
    description_en: 'Complete bedroom: queen size bed, 2 nightstands, large wardrobe, vanity. Natural beech wood. High-quality Moroccan craftsmanship.',
    category_slug: 'home-garden',
    subcategory_slug: 'furniture',
    city_id: 'marrakech',
    price: 25000,
    currency: 'MAD',
    phone: '+212 6 67 345 678',
    seller_name: 'حسن الفاسي',
    seller_email: 'hassan.f@mavora.ma',
    images_count: 10,
    is_negotiable: true,
    condition: 'new',
  },
  {
    title_ar: 'ثلاجة سامسونج Digital Inverter - جديدة',
    title_fr: 'Réfrigérateur Samsung Digital Inverter - Neuf',
    title_en: 'Samsung Digital Inverter Refrigerator - New',
    description_ar: 'ثلاجة سامسونج 18 قدم، Digital Inverter، No Frost، لون فضي. موفرة للطاقة. جديدة في الصندوق مع ضمان 5 سنوات.',
    description_fr: 'Réfrigérateur Samsung 18 pieds, Digital Inverter, No Frost, argent. Économe en énergie. Neuf avec garantie 5 ans.',
    description_en: 'Samsung refrigerator 18 cu ft, Digital Inverter, No Frost, silver. Energy efficient. New in box with 5-year warranty.',
    category_slug: 'home-garden',
    subcategory_slug: 'appliances',
    city_id: 'casablanca',
    price: 7500,
    currency: 'MAD',
    phone: '+212 6 70 456 789',
    seller_name: 'خديجة العمراني',
    seller_email: 'khadija.a@mavora.ma',
    images_count: 4,
    is_negotiable: false,
    condition: 'new',
  },
  {
    title_ar: 'مكنسة روبوت iRobot Roomba i7+',
    title_fr: 'Aspirateur robot iRobot Roomba i7+',
    title_en: 'iRobot Roomba i7+ Robot Vacuum',
    description_ar: 'مكنسة روبوت iRobot i7+، تفريغ تلقائي، خرائط ذكية، تحكم عبر التطبيق. تستخدم شهر واحد فقط. مع جميع الملحقات.',
    description_fr: 'Aspirateur robot iRobot i7+, vidage automatique, cartes intelligentes, contrôle app. Utilisé 1 mois seulement. Tous accessoires inclus.',
    description_en: 'iRobot i7+ robot vacuum, automatic emptying, smart maps, app control. Used for only 1 month. All accessories included.',
    category_slug: 'home-garden',
    subcategory_slug: 'appliances',
    city_id: 'rabat',
    price: 8500,
    currency: 'MAD',
    phone: '+212 6 74 567 890',
    seller_name: 'أمين الذوادي',
    seller_email: 'amine.z@mavora.ma',
    images_count: 6,
    is_negotiable: true,
    condition: 'like_new',
  },
  {
    title_ar: 'طاولة طعام 6 كراسي - خشب زيتون',
    title_fr: 'Table à manger 6 chaises - Bois d\'olivier',
    title_en: 'Dining Table 6 Chairs - Olive Wood',
    description_ar: 'طاولة طعام مستطيلة مع 6 كراسي مبطنة، خشب زيتون مغربي أصلي. يدوية الصنع. قطعة فنية عملية. طول 180 سم.',
    description_fr: 'Table rectangulaire 6 chaises rembourrées, bois d\'olivier marocain authentique. Fait main. Piece fonctionnelle d\'art. Longueur 180cm.',
    description_en: 'Rectangular dining table with 6 upholstered chairs, authentic Moroccan olive wood. Handcrafted. Functional art piece. Length 180cm.',
    category_slug: 'home-garden',
    subcategory_slug: 'furniture',
    city_id: 'fes',
    price: 15000,
    currency: 'MAD',
    phone: '+212 6 77 678 901',
    seller_name: 'نادية الغالي',
    seller_email: 'nadia.g@mavora.ma',
    images_count: 7,
    is_negotiable: true,
    condition: 'used',
  },

  // ==================== JOBS & SERVICES (7 ads) ====================
  {
    title_ar: 'مطور ويب مبتدئ مطلوب - عمل عن بعد',
    title_fr: 'Développeur web junior recherché - Télétravail',
    title_en: 'Junior Web Developer Wanted - Remote Work',
    description_ar: 'نبحث عن مطور ويب مبتدئ لديه معرفة بـ HTML/CSS/JavaScript وReact أو Vue.js. العمل عن بعد بدوام جزئي. راتب جذاب.',
    description_fr: 'Recherche développeur web junior connaissant HTML/CSS/JS et React ou Vue.js. Télétravail temps partiel. Salaire attractif.',
    description_en: 'Looking for junior web developer with HTML/CSS/JavaScript and React or Vue.js knowledge. Part-time remote work. Attractive salary.',
    category_slug: 'jobs-services',
    subcategory_slug: 'jobs',
    city_id: 'casablanca',
    price: 6000,
    currency: 'MAD',
    phone: '+212 6 62 345 678',
    seller_name: 'شركة التقنية المتقدمة',
    seller_email: 'hr@techma.ma',
    images_count: 1,
    is_negotiable: false,
    job_type: 'part_time',
    experience_level: 'junior',
  },
  {
    title_ar: 'دروس خصوصية في الرياضيات والفيزياء',
    title_fr: 'Cours particuliers Mathématiques et Physique',
    title_en: 'Private Math and Physics Tutoring',
    description_ar: 'أستاذ جامعي متخصص في الرياضيات والفيزياء. دروس لجميع المستويات (ابتدائي، ثانوي، جامعي). نتائج مضمونة. الدرس في المنزل أو أونلاين.',
    description_fr: 'Professeur universitaire spécialisé en maths et physique. Cours tous niveaux (primaire, lycée, supérieur). Résultats garantis. À domicile ou en ligne.',
    description_en: 'University professor specializing in math and physics. All levels (primary, high school, university). Guaranteed results. Home or online tutoring.',
    category_slug: 'jobs-services',
    subcategory_slug: 'tutoring',
    city_id: 'rabat',
    price: 200,
    currency: 'MAD',
    phone: '+212 6 66 456 789',
    seller_name: 'د. عبد الإله العلمي',
    seller_email: 'prof.abdelilah@mavora.ma',
    images_count: 2,
    is_negotiable: false,
    subject: 'math-physics',
  },
  {
    title_ar: 'خدمات التنظيف المنزلي الاحترافية',
    title_fr: 'Services de ménage professionnel',
    title_en: 'Professional House Cleaning Services',
    description_ar: 'فريق محترف لتنظيف المنازل والشقق. تنظيف عام، تنظيف زجاج، تنظيف بعد البناء. منتجات آمنة وفعالة. أسعار تنافسية.',
    description_fr: 'Équipe professionnelle pour nettoyage maisons et appartements. Nettoyage général, vitres, post-construction. Produits sûrs et efficaces. Prix compétitifs.',
    description_en: 'Professional team for house and apartment cleaning. General cleaning, glass cleaning, post-construction cleaning. Safe and effective products. Competitive prices.',
    category_slug: 'jobs-services',
    subcategory_slug: 'cleaning',
    city_id: 'casablanca',
    price: 400,
    currency: 'MAD',
    phone: '+212 6 69 567 890',
    seller_name: 'خدمات نظافة البيت',
    seller_email: 'clean@homema.ma',
    images_count: 5,
    is_negotiable: true,
    service_type: 'cleaning',
  },
  {
    title_ar: 'تصميم مواقع وشعارات - مصمم محترف',
    title_fr: 'Création sites web et logos - Designer pro',
    title_en: 'Website & Logo Design - Professional Designer',
    description_ar: 'مصمم محترف بخبرة 8 سنوات. تصميم هوية بصرية كاملة، مواقع إلكترونية، تطبيقات. أسعار معقولة وجودة عالية. portfolio متاح.',
    description_fr: 'Designer pro 8 ans d\'expérience. Identité visuelle complète, sites web, applications. Prix abordables, haute qualité. Portfolio disponible.',
    description_en: 'Professional designer with 8 years experience. Complete visual identity, websites, applications. Affordable prices, high quality. Portfolio available.',
    category_slug: 'jobs-services',
    subcategory_slug: 'design',
    city_id: 'marrakech',
    price: 2500,
    currency: 'MAD',
    phone: '+olicited 6 72 678 901',
    seller_name: 'استوديو الإبداع الرقمي',
    seller_email: 'design@creativestudio.ma',
    images_count: 12,
    is_negotiable: true,
    service_type: 'design',
  },
  {
    title_ar: 'نقل الأثاث والتغليف - خدمة شاملة',
    title_fr: 'Déménagement et emballage - Service complet',
    title_en: 'Furniture Moving & Packing - Full Service',
    description_ar: 'شركة نقل أثاث محترفة. تغليف احترافي، نقل آمن، تركيب. نغطي جميع المدن المغربية. تأمين شامل. أسعار خاصة هذا الشهر.',
    description_fr: 'Société déménagement professionnel. Emballage pro, transport sûr, montage. Couvrons toutes villes marocaines. Assurance complète. Tarifs spéciaux ce mois.',
    description_en: 'Professional moving company. Professional packing, safe transport, assembly. Cover all Moroccan cities. Full insurance. Special rates this month.',
    category_slug: 'jobs-services',
    subcategory_slug: 'moving',
    city_id: 'casablanca',
    price: 1500,
    currency: 'MAD',
    phone: '+212 6 75 789 012',
    seller_name: 'النقل السريع للمغرب',
    seller_email: 'info@fastmove.ma',
    images_count: 8,
    is_negotiable: true,
    service_type: 'moving',
  },
  {
    title_ar: 'طبخ منزلي - أكلات مغربية أصيلة',
    title_fr: 'Cuisine maison - Plats marocains authentiques',
    title_en: 'Home Cooking - Authentic Moroccan Dishes',
    description_ar: 'أطباق مغربية منزلية طازجة يومياً. كسكس، طاجين، pastilla. مواد أولية طازجة وطبيعية. طلب مسبق. توصيل متاح.',
    description_fr: 'Plats marocains frais faits maison quotidiennement. Couscous, tajine, pastilla. Ingrédients frais et naturels. Commande préalable. Livraison disponible.',
    description_en: 'Fresh homemade Moroccan dishes daily. Couscous, tagine, pastilla. Fresh natural ingredients. Pre-order. Delivery available.',
    category_slug: 'jobs-services',
    subcategory_slug: 'catering',
    city_id: 'casablanca',
    price: 80,
    currency: 'MAD',
    phone: '+212 6 68 890 123',
    seller_name: 'أمينة المطبوخ',
    seller_email: 'amina.kitchen@mavora.ma',
    images_count: 15,
    is_negotiable: false,
    cuisine_type: 'moroccan',
  },
  {
    title_ar: 'تصليح جميع الأجهزة الإلكترونية',
    title_fr: 'Réparation tous appareils électroniques',
    title_en: 'All Electronic Devices Repair',
    description_ar: 'فني متخصص في تصليح الهواتف، اللابتوبات، التلفزيونات، والأجهزة المنزلية. تشخيص مجاني. ضمان 3 أشهر على التصليح. قطع أصلية.',
    description_fr: 'Technicien spécialiste réparation téléphones, ordis, TV, électroménager. Diagnostic gratuit. Garantie 3 mois. Pièces originales.',
    description_en: 'Specialized technician for phones, laptops, TVs, appliances repair. Free diagnosis. 3-month repair guarantee. Original parts.',
    category_slug: 'jobs-services',
    subcategory_slug: 'repair',
    city_id: 'fes',
    price: 200,
    currency: 'MAD',
    phone: '+212 6 79 012 345',
    seller_name: 'مركز التصليح السريع',
    seller_email: 'fix@quickrepair.ma',
    images_count: 6,
    is_negotiable: true,
    device_type: 'electronics',
  },

  // ==================== FASHION & BEAUTY (5 ads) ====================
  {
    title_ar: 'فستان زفاف إيطالي - جديد مع الملصقات',
    title_f: 'Robe de mariée italienne - Neuve avec étiquettes',
    title_en: 'Italian Wedding Dress - New with Tags',
    description_ar: 'فستان زفاف إيطالي الصنع، قصّاص، مطرز بالكريستال. المقاس M/L. لم يُلبس أبداً. السعر الأصلي 25,000 درهم. عرض خاص.',
    description_fr: 'Robe de mariée fabrication italienne, traîne, cristaux. Taille M/L. Jamais portée. Prix initial 25 000 DH. Offre spéciale.',
    description_en: 'Italian-made wedding dress, train, crystal embroidery. Size M/L. Never worn. Original price 25,000 MAD. Special offer.',
    category_slug: 'fashion',
    subcategory_slug: 'womens-fashion',
    city_id: 'casablanca',
    price: 15000,
    currency: 'MAD',
    phone: '+212 6 63 456 789',
    seller_name: 'صالون الأفراح الملكي',
    seller_email: 'bridal@royalsaalon.ma',
    images_count: 10,
    is_negotiable: true,
    condition: 'new',
    size: 'M/L',
  },
  {
    title_ar: 'حقائب يد أصلي - ماركات عالمية',
    title_fr: 'Sacs à main originaux - Grandes marques',
    title_en: 'Original Handbags - Luxury Brands',
    description_ar: 'مجموعة حقائب يد أصلية: Gucci, Louis Vuitton, Chanel. جميعها أصلية مع الفواتير. حالة ممتازة. سعر الوحدة أو المجموعة.',
    description_fr: 'Collection sacs à main originaux: Gucci, LV, Chanel. Tous authentiques avec factures. Excellent état. Prix unitaire ou lot.',
    description_en: 'Collection of original handbags: Gucci, LV, Chanel. All authentic with receipts. Excellent condition. Individual or bundle price.',
    category_slug: 'fashion',
    subcategory_slug: 'shoes-bags',
    city_id: 'marrakech',
    price: 8000,
    currency: 'MAD',
    phone: '+212 6 67 567 890',
    seller_name: 'لميس الفاسي',
    seller_email: 'lamis.f@mavora.ma',
    images_count: 12,
    is_negotiable: true,
    condition: 'like_new',
  },
  {
    title_ar: 'ذهب عيار 18 - مجموعة كاملة',
    title_fr: 'Or 18 carats - Ensemble complet',
    title_en: '18K Gold - Complete Set',
    description_ar: 'مجموعة ذهب عيار 18: قلادة، أساور، خلخال، قرط. وزن إجمالي 45 جرام. ذهب مغربي مع ختم الضمان. قابل للتفاوض.',
    description_fr: 'Parure or 18k: collier, bracelets, cheville, boucles. Poids total 45g. Or marocain avec poinçon garantie. Négociable.',
    description_en: '18K gold set: necklace, bracelets, anklet, earrings. Total weight 45g. Moroccan gold with guarantee stamp. Negotiable.',
    category_slug: 'fashion',
    subcategory_slug: 'watches-jewelry',
    city_id: 'tangier',
    price: 35000,
    currency: 'MAD',
    phone: '+212 6 70 678 901',
    seller_name: 'محلات الذهب الأمير',
    seller_email: 'gold@princejewelry.ma',
    images_count: 8,
    is_negotiable: true,
    material: 'gold_18k',
    weight_grams: 45,
  },
  {
    title_ar: 'أحذية رياضية Nike Air Jordan 1 - أصلية',
    title_fr: 'Baskets Nike Air Jordan 1 - Authentiques',
    title_en: 'Nike Air Jordan 1 Sneakers - Authentic',
    description_ar: 'Nike Air Jordan 1 Retro High OG، لون Chicago. المقاس 42 EU. أصلية 100% مع الصندوق. استخدمت مرتين فقط.',
    description_fr: 'Nike Air Jordan 1 Retro High OG, couleur Chicago. Pointure 42 EU. 100% authentique avec boîte. Portées 2 fois seulement.',
    description_en: 'Nike Air Jordan 1 Retro High OG, Chicago color. Size 42 EU. 100% authentic with box. Worn only twice.',
    category_slug: 'fashion',
    subcategory_slug: 'shoes-bags',
    city_id: 'casablanca',
    price: 3500,
    currency: 'MAD',
    phone: '+212 6 64 789 012',
    seller_name: ' Sneaker Store MA',
    seller_email: 'store@sneakerma.ma',
    images_count: 6,
    is_negotiable: false,
    condition: 'like_new',
    size_eu: '42',
  },
  {
    title_ar: 'عطور أصلية - أسعار مخفضة',
    title_fr: 'Parfums originaux - Prix réduits',
    title_en: 'Original Perfumes - Discounted Prices',
    description_ar: 'مجموعة عطور أصلية: Dior Sauvage, Chanel Bleu, Acqua di Gio. جميعها 100ml، أصلية، غير مفتوحة أو مستخدمة قليلاً. أسعار أقل من السوق.',
    description_fr: 'Collection parfums originaux: Dior Sauvage, Chanel Bleu, Acqua di Gio. Tous 100ml, authentiques, scellés ou peu utilisés. Prix sous marché.',
    description_en: 'Original perfume collection: Dior Sauvage, Chanel Bleu, Acqua di Gio. All 100ml, authentic, sealed or lightly used. Below market prices.',
    category_slug: 'health-beauty',
    subcategory_slug: 'fashion-accessories',
    city_id: 'rabat',
    price: 450,
    currency: 'MAD',
    phone: '+212 6 78 890 123',
    seller_name: 'عالم العطور',
    seller_email: 'perfumes@worldma.ma',
    images_count: 9,
    is_negotiable: true,
    condition: 'new',
  },

  // ==================== SPORTS & HOBBIES (5 ads) ====================
  {
    title_ar: 'دراجة هوائية Giant Trek - شبه جديدة',
    title_f: 'Vélo Giant Trek - Quasi neuf',
    title_en: 'Giant Trek Bicycle - Like New',
    description_ar: 'دراجة هوائية Giant Trek mountain bike، 21 سرعة، إطار 27.5". استخدمت 3 مرات فقط. مع خوذة وقفازات وعدة إصلاح.',
    description_fr: 'Vélo Giant Trek MTB, 21 vitesses, roues 27.5". Utilisé 3 fois seulement. Avec casque, gants, kit réparation.',
    description_en: 'Giant Trek mountain bike, 21 speeds, 27.5" wheels. Used only 3 times. With helmet, gloves, repair kit.',
    category_slug: 'sports-hobbies',
    subcategory_slug: 'cycling',
    city_id: 'agadir',
    price: 3500,
    currency: 'MAD',
    phone: '+212 6 62 901 234',
    seller_name: 'سعيد الرياضي',
    seller_email: 'said.sports@mavora.ma',
    images_count: 7,
    is_negotiable: true,
    condition: 'like_new',
  },
  {
    title_ar: 'معدات جيم كاملة - dumbbells وبار وحامل',
    title_fr: 'Équipement gym complet - Haltères, barre, support',
    title_en: 'Complete Gym Equipment - Dumbbells, Bar, Rack',
    description_ar: 'مجموعة رياضية كاملة: مجموعة dumbbells 1-20kg، barbell 20kg، rack، bench. حالة ممتازة. مناسب للتمرين في المنزل.',
    description_fr: 'Set fitness complet: haltères 1-20kg, barre 20kg, support, banc. Excellent état. Idéal entraînement domicile.',
    description_en: 'Complete fitness set: dumbbell set 1-20kg, 20kg barbell, rack, bench. Excellent condition. Perfect for home workouts.',
    category_slug: 'sports-hobbies',
    subcategory_slug: 'fitness',
    city_id: 'casablanca',
    price: 8000,
    currency: 'MAD',
    phone: '+212 6 66 012 345',
    seller_name: 'النادي الرياضي المنزلي',
    seller_email: 'gym@homefitness.ma',
    images_count: 10,
    is_negotiable: true,
    condition: 'used',
  },
  {
    title_ar: 'كاميرا درون DJI Mini 3 Pro',
    title_fr: 'Drone DJI Mini 3 Pro',
    title_en: 'DJI Mini 3 Pro Drone',
    description_ar: 'درون DJI Mini 3 Pro مع Fly More Combo، 3 بطاريات، hub شحن، حقيبة نقل. يصور 4K. استخدم 5 مرات فقط. مع صنوق.',
    description_fr: 'Drone DJI Mini 3 Pro avec Fly More Combo, 3 batteries, hub chargeur, sac. Vidéo 4K. Utilisé 5 fois. Avec boîte.',
    description_en: 'DJI Mini 3 Pro drone with Fly More Combo, 3 batteries, charging hub, carry bag. Shoots 4K. Used 5 times. With box.',
    category_slug: 'sports-hobbies',
    subcategory_slug: 'drones',
    city_id: 'marrakech',
    price: 9000,
    currency: 'MAD',
    phone: '+212 6 69 123 456',
    seller_name: 'أحمد الطياري',
    seller_email: 'ahmed.t@mavora.ma',
    images_count: 8,
    is_negotiable: true,
    condition: 'like_new',
  },
  {
    title_ar: 'لوحة رسم وألوان فنية - مجموعة كاملة',
    title_f: 'Toile peinture et couleurs artistiques - Set complet',
    title_en: 'Canvas Paint & Art Colors - Complete Set',
    description_ar: 'مجموعة فنية كاملة: 10 لوحات قماش مختلفة الأحجام، ألوان أكريليك، فرش، حامل خشبي. مناسبة للهواة والمحترفين.',
    description_fr: 'Set artistique complet: 10 toiles tailles variées, peintures acryliques, pinceaux, chevalet. Idéale amateurs et pros.',
    description_en: 'Complete art set: 10 canvas various sizes, acrylic paints, brushes, wooden easel. Great for amateurs and professionals.',
    category_slug: 'sports-hobbies',
    subcategory_slug: 'arts',
    city_id: 'fes',
    price: 1200,
    currency: 'MAD',
    phone: '+olicited 6 72 234 567',
    seller_name: 'مرسم الفنان',
    seller_email: 'art@artiststudio.ma',
    images_count: 12,
    is_negotiable: true,
    condition: 'new',
  },
  {
    title_ar: 'سكنر وكاميرا صيد تحت الماء - GoPro Hero 12',
    title_fr: 'Caméra plongée sous-marine - GoPro Hero 12',
    title_en: 'Underwater Fishing Camera - GoPro Hero 12',
    description_ar: 'GoPro Hero 12 Black، مع housing مضاد للماء حتى 60 متر. مثالية للغوص والتصوير تحت الماء. مع بطاريات إضافية.',
    description_fr: 'GoPro Hero 12 Black, avec housing étanche jusqu\'à 60m. Parfaite plongée et footage sous-marin. Batteries supplémentaires.',
    description_en: 'GoPro Hero 12 Black, with waterproof housing up to 60m. Perfect for diving and underwater filming. Extra batteries.',
    category_slug: 'sports-hobbies',
    subcategory_slug: 'diving',
    city_id: 'agadir',
    price: 5500,
    currency: 'MAD',
    phone: '+212 6 75 345 678',
    seller_name: 'مركز الغوص الأطلسي',
    seller_email: 'dive@atlanticcenter.ma',
    images_count: 6,
    is_negotiable: true,
    condition: 'like_new',
  },
];

// ============================================================
// Main Seeding Function
// ============================================================

async function seedDatabase() {
  console.log('🇲🇦 Starting Moroccan Classified Ads Seeding...');
  console.log(`📦 Total listings to create: ${listings.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    
    try {
      // Get category ID
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', listing.category_slug)
        .limit(1);

      if (!categories || categories.length === 0) {
        console.warn(`⚠️ Category not found: ${listing.category_slug}, skipping listing ${i + 1}`);
        errorCount++;
        continue;
      }

      const categoryId = categories[0].id;

      // Get or create user
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('email', listing.seller_email)
        .limit(1);

      let userId;
      
      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
      } else {
        // Create new user
        const now = new Date().toISOString();
        userId = crypto.randomUUID();
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: listing.seller_email,
            name: listing.seller_name,
            role: 'user',
            isActive: true,
            createdAt: now,
            updatedAt: now,
          })
          .select('id')
          .single();

        if (userError || !newUser) {
          console.error(`❌ Failed to create user for listing ${i + 1}:`, userError?.message);
          errorCount++;
          continue;
        }

        // Create profile
        await supabase.from('profiles').insert({
          id: userId,
          userId: userId,
          display_name: listing.seller_name,
          email: listing.seller_email,
          phone: listing.phone,
          createdAt: now,
          updatedAt: now,
        }).catch(e => console.warn('Profile creation warning:', e.message));
      }

      // Create the listing
      const now = new Date().toISOString();
      const listingId = crypto.randomUUID();
      const listingData = {
        id: listingId,
        title: listing.title_ar,
        description: listing.description_ar,
        categoryId: categoryId,
        userId: userId,
        price: listing.price,
        currencyCode: listing.currency,
        locationAddress: moroccanCities.find(c => c.id === listing.city_id)?.name_ar || listing.city_id,
        cityId: null, // Will be set if we have city mapping
        status: 'active',
        negotiable: listing.is_negotiable,
        viewCount: Math.floor(Math.random() * 500) + 10,
        contactPhone: listing.phone,
        condition: listing.condition || 'used',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random within last 30 days
        updatedAt: now,
      };

      const { data: newListing, error: listingError } = await supabase
        .from('listings')
        .insert(listingData)
        .select('id')
        .single();

      if (listingError || !newListing) {
        console.error(`❌ Failed to create listing ${i + 1}:`, listingError?.message);
        errorCount++;
        continue;
      }

      // Add placeholder images (using listing_media table)
      const mediaItems = [];
      for (let j = 0; j < (listing.images_count || 3); j++) {
        mediaItems.push({
          listingId: listingId,
          url: `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(listing.title_ar.substring(0, 20))}+${j + 1}`,
          type: 'image',
          createdAt: now,
        });
      }

      if (mediaItems.length > 0) {
        try {
          await supabase.from('listing_media').insert(mediaItems);
        } catch (e: any) {
          console.warn('Media insertion warning:', e?.message);
        }
      }

      successCount++;
      console.log(`✅ [${i + 1}/${listings.length}] Created: ${listing.title_ar.substring(0, 40)}...`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error processing listing ${i + 1}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 SEEDING COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${successCount} listings`);
  console.log(`❌ Failed: ${errorCount} listings`);
  console.log(`📈 Success Rate: ${((successCount / listings.length) * 100).toFixed(1)}%`);
  
  return { successCount, errorCount };
}

// Run the seeder
seedDatabase()
  .then(result => {
    console.log('\n🎉 Moroccan classified ads seeding completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error during seeding:', error);
    process.exit(1);
  });
