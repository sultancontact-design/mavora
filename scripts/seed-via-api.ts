/**
 * MAVORA Seed Data via Supabase REST API
 * زراعة البيانات عبر API مباشرة
 */

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

// ===================================================
// Data Definitions
// ===================================================

const categories = [
  { name_ar: 'سيارات ومركبات', name_fr: 'Véhicules', name_en: 'Vehicles', slug: 'vehicles', icon: 'Car', description_ar: 'سيارات جديدة ومستعملة، دراجات نارية، قطع غيار', description_fr: 'Voitures neuves et d\'occasion, motos, pièces détachées', description_en: 'New and used cars, motorcycles, spare parts', order: 1, is_active: true, parent_id: null },
  { name_ar: 'سيارات', name_fr: 'Voitures', name_en: 'Cars', slug: 'cars', icon: null, description_ar: null, description_fr: null, description_en: null, order: 1, is_active: true, parent_id: 'vehicles' },
  { name_ar: 'دراجات نارية', name_fr: 'Motos', name_en: 'Motorcycles', slug: 'motorcycles', icon: null, description_ar: null, description_fr: null, description_en: null, order: 2, is_active: true, parent_id: 'vehicles' },
  { name_ar: 'شاحنات', name_fr: 'Camions', name_en: 'Trucks', slug: 'trucks', icon: null, description_ar: null, description_fr: null, description_en: null, order: 3, is_active: true, parent_id: 'vehicles' },
  { name_ar: 'قطع غيار', name_fr: 'Pièces détachées', name_en: 'Spare Parts', slug: 'spare-parts', icon: null, description_ar: null, description_fr: null, description_en: null, order: 4, is_active: true, parent_id: 'vehicles' },
  
  { name_ar: 'عقارات', name_fr: 'Immobilier', name_en: 'Real Estate', slug: 'real-estate', icon: 'Building2', description_ar: 'شقق، فيلات، أراضي، محلات تجارية للبيع والإيجار', description_fr: 'Appartements, villas, terrains, locaux commerciaux à vendre et à louer', description_en: 'Apartments, villas, land, commercial properties for sale and rent', order: 2, is_active: true, parent_id: null },
  { name_ar: 'شقق للبيع', name_fr: 'Appartements à vendre', name_en: 'Apartments for Sale', slug: 'apartments-sale', icon: null, description_ar: null, description_fr: null, description_en: null, order: 1, is_active: true, parent_id: 'real-estate' },
  { name_ar: 'شقق للإيجار', name_fr: 'Appartements à louer', name_en: 'Apartments for Rent', slug: 'apartments-rent', icon: null, description_ar: null, description_fr: null, description_en: null, order: 2, is_active: true, parent_id: 'real-estate' },
  { name_ar: 'فيلا للبيع', name_fr: 'Villas à vendre', name_en: 'Villas for Sale', slug: 'villas-sale', icon: null, description_ar: null, description_fr: null, description_en: null, order: 3, is_active: true, parent_id: 'real-estate' },
  { name_ar: 'فيلا للإيجار', name_fr: 'Villas à louer', name_en: 'Villas for Rent', slug: 'villas-rent', icon: null, description_ar: null, description_fr: null, description_en: null, order: 4, is_active: true, parent_id: 'real-estate' },
  { name_ar: 'أراضي', name_fr: 'Terrains', name_en: 'Land', slug: 'land', icon: null, description_ar: null, description_fr: null, description_en: null, order: 5, is_active: true, parent_id: 'real-estate' },
  { name_ar: 'محلات تجارية', name_fr: 'Locaux commerciaux', name_en: 'Commercial', slug: 'commercial', icon: null, description_ar: null, description_fr: null, description_en: null, order: 6, is_active: true, parent_id: 'real-estate' },
  
  { name_ar: 'إلكترونيات', name_fr: 'Électronique', name_en: 'Electronics', slug: 'electronics', icon: 'Smartphone', description_ar: 'هواتف، حواسيب، تلفزيونات، كاميرات وأجهزة إلكترونية', description_fr: 'Téléphones, ordinateurs, téléviseurs, appareils photo et électronique', description_en: 'Phones, computers, TVs, cameras and electronics', order: 3, is_active: true, parent_id: null },
  { name_ar: 'هواتف ذكية', name_fr: 'Smartphones', name_en: 'Smartphones', slug: 'smartphones', icon: null, description_ar: null, description_fr: null, description_en: null, order: 1, is_active: true, parent_id: 'electronics' },
  { name_ar: 'حواسيب', name_fr: 'Ordinateurs', name_en: 'Computers', slug: 'computers', icon: null, description_ar: null, description_fr: null, description_en: null, order: 2, is_active: true, parent_id: 'electronics' },
  { name_ar: 'تلفزيونات', name_fr: 'Téléviseurs', name_en: 'TVs', slug: 'tvs', icon: null, description_ar: null, description_fr: null, description_en: null, order: 3, is_active: true, parent_id: 'electronics' },
  { name_ar: 'كاميرات', name_fr: 'Appareils photo', name_en: 'Cameras', slug: 'cameras', icon: null, description_ar: null, description_fr: null, description_en: null, order: 4, is_active: true, parent_id: 'electronics' },
  
  { name_ar: 'المنزل والحديقة', name_fr: 'Maison et Jardin', name_en: 'Home & Garden', slug: 'home-garden', icon: 'Home', description_ar: 'أثاث، ديكور، معدات منزلية، أدوات حديقة', description_fr: 'Mobilier, décoration, électroménager, outils de jardin', description_en: 'Furniture, decor, home appliances, garden tools', order: 4, is_active: true, parent_id: null },
  { name_ar: 'أثاث غرفة المعيشة', name_fr: 'Salon', name_en: 'Living Room', slug: 'living-room', icon: null, description_ar: null, description_fr: null, description_en: null, order: 1, is_active: true, parent_id: 'home-garden' },
  { name_ar: 'غرف نوم', name_fr: 'Chambres à coucher', name_en: 'Bedrooms', slug: 'bedrooms', icon: null, description_ar: null, description_fr: null, description_en: null, order: 2, is_active: true, parent_id: 'home-garden' },
  { name_ar: 'مطبخ وغرفة الأكل', name_fr: 'Cuisine et salle à manger', name_en: 'Kitchen & Dining', slug: 'kitchen-dining', icon: null, description_ar: null, description_fr: null, description_en: null, order: 3, is_active: true, parent_id: 'home-garden' },
  
  { name_ar: 'أزياء وجمال', name_fr: 'Mode et Beauté', name_en: 'Fashion & Beauty', slug: 'fashion-beauty', icon: 'Shirt', description_ar: 'ملابس، أحذية، إكسسوارات، مستحضرات تجميل', description_fr: 'Vêtements, chaussures, accessoires, cosmétiques', description_en: 'Clothing, shoes, accessories, cosmetics', order: 5, is_active: true, parent_id: null },
  { name_ar: 'ملابس رجالية', name_fr: 'Vêtements homme', name_en: 'Men\'s Clothing', slug: 'mens-clothing', icon: null, description_ar: null, description_fr: null, description_en: null, order: 1, is_active: true, parent_id: 'fashion-beauty' },
  { name_ar: 'ملابس نسائية', name_fr: 'Vêtements femme', name_en: 'Women\'s Clothing', slug: 'womens-clothing', icon: null, description_ar: null, description_fr: null, description_en: null, order: 2, is_active: true, parent_id: 'fashion-beauty' },
  { name_ar: 'ملابس أطفال', name_fr: 'Vêtements enfants', name_en: 'Kids\' Clothing', slug: 'kids-clothing', icon: null, description_ar: null, description_fr: null, description_en: null, order: 3, is_active: true, parent_id: 'fashion-beauty' },
  { name_ar: 'أحذية', name_fr: 'Chaussures', name_en: 'Shoes', slug: 'shoes', icon: null, description_ar: null, description_fr: null, description_en: null, order: 4, is_active: true, parent_id: 'fashion-beauty' },
  
  { name_ar: 'رياضة وهوايات', name_fr: 'Sports et Loisirs', name_en: 'Sports & Hobbies', slug: 'sports-hobbies', icon: 'Dumbbell', description_ar: 'معدات رياضية، دراجات، كتب، آلات موسيقية', description_fr: 'Équipements sportifs, vélos, livres, instruments de musique', description_en: 'Sports equipment, bikes, books, musical instruments', order: 6, is_active: true, parent_id: null },
  { name_ar: 'معدات رياضية', name_fr: 'Équipements sportifs', name_en: 'Sports Equipment', slug: 'sports-equipment', icon: null, description_ar: null, description_fr: null, description_en: null, order: 1, is_active: true, parent_id: 'sports-hobbies' },
  { name_ar: 'دراجات', name_fr: 'Vélos', name_en: 'Bicycles', slug: 'bicycles', icon: null, description_ar: null, description_fr: null, description_en: null, order: 2, is_active: true, parent_id: 'sports-hobbies' },
  { name_ar: 'كتب ومجلات', name_fr: 'Livres et magazines', name_en: 'Books & Magazines', slug: 'books-magazines', icon: null, description_ar: null, description_fr: null, description_en: null, order: 3, is_active: true, parent_id: 'sports-hobbies' },
  
  { name_ar: 'حيوانات أليفة', name_fr: 'Animaux', name_en: 'Pets', slug: 'pets', icon: 'Heart', description_ar: 'كلاب، قطط، طيور، أسماك، مستلزمات حيوانات', description_fr: 'Chiens, chats, oiseaux, poissons, accessoires animaux', description_en: 'Dogs, cats, birds, fish, pet supplies', order: 7, is_active: true, parent_id: null },
  { name_ar: 'كلاب', name_fr: 'Chiens', name_en: 'Dogs', slug: 'dogs', icon: null, description_ar: null, description_fr: null, description_en: null, order: 1, is_active: true, parent_id: 'pets' },
  { name_ar: 'قطط', name_fr: 'Chats', name_en: 'Cats', slug: 'cats', icon: null, description_ar: null, description_fr: null, description_en: null, order: 2, is_active: true, parent_id: 'pets' },
  { name_ar: 'طيور', name_fr: 'Oiseaux', name_en: 'Birds', slug: 'birds', icon: null, description_ar: null, description_fr: null, description_en: null, order: 3, is_active: true, parent_id: 'pets' },
  
  { name_ar: 'وظائف وخدمات', name_fr: 'Emplois et Services', name_en: 'Jobs & Services', slug: 'jobs-services', icon: 'Briefcase', description_ar: 'وظائف شاغرة، خدمات مهنية، خدمات منزلية', description_fr: 'Offres d\'emploi, services professionnels, services domestiques', description_en: 'Job offers, professional services, domestic services', order: 8, is_active: true, parent_id: null },
  { name_ar: 'وظائف إدارية', name_fr: 'Emplois administratifs', name_en: 'Administrative Jobs', slug: 'admin-jobs', icon: null, description_ar: null, description_fr: null, description_en: null, order: 1, is_active: true, parent_id: 'jobs-services' },
  { name_ar: 'وظائف تقنية', name_fr: 'Emplois tech', name_en: 'Tech Jobs', slug: 'tech-jobs', icon: null, description_ar: null, description_fr: null, description_en: null, order: 2, is_active: true, parent_id: 'jobs-services' },
  { name_ar: 'خدمات منزلية', name_fr: 'Services domestiques', name_en: 'Domestic Services', slug: 'domestic-services', icon: null, description_ar: null, description_fr: null, description_en: null, order: 3, is_active: true, parent_id: 'jobs-services' },
  
  { name_ar: 'أعمال وتجارة', name_fr: 'Affaires et Commerce', name_en: 'Business & Trade', slug: 'business-trade', icon: 'Store', description_ar: 'محلات، مطاعم، مشاريع جاهزة، معدات تجارية', description_fr: 'Commerces, restaurants, projets clés en main, équipements commerciaux', description_en: 'Shops, restaurants, turnkey businesses, commercial equipment', order: 9, is_active: true, parent_id: null },
  { name_ar: 'محلات تجارية', name_fr: 'Commerces', name_en: 'Shops', slug: 'shops', icon: null, description_ar: null, description_fr: null, description_en: null, order: 1, is_active: true, parent_id: 'business-trade' },
  { name_ar: 'مطاعم وكافيهات', name_fr: 'Restaurants et cafés', name_en: 'Restaurants & Cafes', slug: 'restaurants-cafes', icon: null, description_ar: null, description_fr: null, description_en: null, order: 2, is_active: true, parent_id: 'business-trade' },
  { name_ar: 'مشاريع جاهزة', name_fr: 'Projets clés en main', name_en: 'Turnkey Businesses', slug: 'turnkey-businesses', icon: null, description_ar: null, description_fr: null, description_en: null, order: 3, is_active: true, parent_id: 'business-trade' },
];

const cities = [
  { name_ar: 'الدار البيضاء', name_fr: 'Casablanca', name_en: 'Casablanca', slug: 'casablanca', region: 'الدار البيضاء سطات', population: 3359818, is_major: true },
  { name_ar: 'الرباط', name_fr: 'Rabat', name_en: 'Rabat', slug: 'rabat', region: 'الرباط سلا القنيطرة', population: 577827, is_major: true },
  { name_ar: 'فاس', name_fr: 'Fès', name_en: 'Fes', slug: 'fes', region: 'فاس مكناس', population: 1112072, is_major: true },
  { name_ar: 'مراكش', name_fr: 'Marrakech', name_en: 'Marrakech', slug: 'marrakech', region: 'مراكش آسفي', population: 928850, is_major: true },
  { name_ar: 'أكادير', name_fr: 'Agadir', name_en: 'Agadir', slug: 'agadir', region: 'سوس ماسة', population: 450000, is_major: true },
  { name_ar: 'طنجة', name_fr: 'Tanger', name_en: 'Tangier', slug: 'tangier', region: 'طنجة تطوان الحسيمة', population: 947952, is_major: true },
  { name_ar: 'مكناس', name_fr: 'Meknès', name_en: 'Meknes', slug: 'meknes', region: 'فاس مكناس', population: 632079, is_major: true },
  { name_ar: 'وجدة', name_fr: 'Oujda', name_en: 'Oujda', slug: 'oujda', region: 'الشراق', population: 494252, is_major: true },
  { name_ar: 'كنترة', name_fr: 'Kenitra', name_en: 'Kenitra', slug: 'kenitra', region: 'الرباط سلا القنيطرة', population: 431282, is_major: false },
  { name_ar: 'تطوان', name_fr: 'Tétouan', name_en: 'Tetouan', slug: 'tetouan', region: 'طنجة تطوان الحسيمة', population: 380787, is_major: false },
  { name_ar: 'الجديدة', name_fr: 'El Jadida', name_en: 'El Jadida', slug: 'el-jadida', region: 'الدار البيضاء سطات', population: 194231, is_major: false },
  { name_ar: 'ناظور', name_fr: 'Nador', name_en: 'Nador', slug: 'nador', region: 'الشراق', population: 161726, is_major: false },
  { name_ar: 'بنى ملال', name_fr: 'Béni Mellal', name_en: 'Beni Mellal', slug: 'beni-mellal', region: 'بني ملال خنيفرة', population: 163286, is_major: false },
  { name_ar: 'خنيفرة', name_fr: 'Khenifra', name_en: 'Khenifra', slug: 'khenifra', region: 'بني ملال خنيفرة', population: 117005, is_major: false },
  { name_ar: 'الحسيمة', name_fr: 'Al Hoceïma', name_en: 'Al Hoceima', slug: 'al-hoceima', region: 'طنجة تطوان الحسيمة', population: 117336, is_major: false },
  { name_ar: 'القنيطرة', name_fr: 'Kénitra', name_en: 'Kenitra-city', slug: 'kenitra-city', region: 'الرباط سلا القنيطرة', population: 403356, is_major: false },
  { name_ar: 'سطات', name_fr: 'Settat', name_en: 'Settat', slug: 'settat', region: 'الدار البيضاء سطات', population: 309297, is_major: false },
  { name_ar: 'سلا', name_fr: 'Salé', name_en: 'Sale', slug: 'sale', region: 'الرباط سلا القنيطرة', population: 903486, is_major: false },
  { name_ar: 'المحمدية', name_fr: 'Mohammedia', name_en: 'Mohammedia', slug: 'mohammedia', region: 'الدار البيضاء سطات', population: 208612, is_major: false },
  { name_ar: 'خريبكة', name_fr: 'Khouribga', name_en: 'Khouribga', slug: 'khouribga', region: 'بني ملال خنيفرة', population: 244040, is_major: false },
  { name_ar: 'جرادة', name_fr: 'Jerada', name_en: 'Jerada', slug: 'jerada', region: 'الشراق', population: 105840, is_major: false },
  { name_ar: 'تازة', name_fr: 'Taza', name_en: 'Taza', slug: 'taza', region: 'فاس مكناس', population: 148456, is_major: false },
  { name_ar: 'العيون', name_fr: 'Laâyoune', name_en: 'Laayoune', slug: 'laayoune', region: 'العيون الساقية الحمراء', population: 218716, is_major: false },
  { name_ar: 'الفقيه بن صالح', name_fr: 'Fquih Ben Salah', name_en: 'Fquih Ben Salah', slug: 'fquih-ben-salah', region: 'بني ملال خنيفرة', population: 108706, is_major: false },
  { name_ar: 'إفران', name_fr: 'Ifrane', name_en: 'Ifrane', slug: 'ifran', region: 'فاس مكناس', population: 21000, is_major: false },
  { name_ar: 'الحاجب', name_fr: 'El Hajeb', name_en: 'El Hajeb', slug: 'el-hajeb', region: 'فاس مكناس', population: 62689, is_major: false },
  { name_ar: 'آسفي', name_fr: 'Safi', name_en: 'Safi', slug: 'safi', region: 'مراكش آسفي', population: 308588, is_major: false },
  { name_ar: 'الصويرة', name_fr: 'Essaouira', name_en: 'Essaouira', slug: 'essaouira', region: 'مراكش آسفي', population: 86738, is_major: false },
  { name_ar: 'الرشيدية', name_fr: 'Errachidia', name_en: 'Errachidia', slug: 'errachidia', region: 'درعة تافيلالت', population: 103480, is_major: false },
  { name_ar: 'ورزازات', name_fr: 'Ouarzazate', name_en: 'Ouarzazate', slug: 'ouarzazate', region: 'درعة تافيلالت', population: 71194, is_major: false },
  { name_ar: 'كلميم', name_fr: 'Guelmim', name_en: 'Guelmim', slug: 'guelmim', region: 'كلميم واد نون', population: 124300, is_major: false },
  { name_ar: 'تارودانت', name_fr: 'Taroudant', name_en: 'Taroudant', slug: 'taroudant', region: 'سوس ماسة', population: 86802, is_major: false },
  { name_ar: 'الصخيرات', name_fr: 'Skhirate-Témara', name_en: 'Skhirate-Temara', slug: 'skhirate-temara', region: 'الرباط سلا القنيطرة', population: 347763, is_major: false },
  { name_ar: 'سيدي قاسم', name_fr: 'Sidi Kacem', name_en: 'Sidi Kacem', slug: 'sidi-kacem', region: 'الرباط سلا القنيطرة', population: 188413, is_major: false },
  { name_ar: 'بركان', name_fr: 'Berkane', name_en: 'Berkane', slug: 'berkane', region: 'الشراق', population: 109237, is_major: false },
  { name_ar: 'شفشاون', name_fr: 'Chefchaouen', name_en: 'Chefchaouen', slug: 'chefchaouen', region: 'طنجة تطوان الحسيمة', population: 45506, is_major: false },
  { name_ar: 'العرائش', name_fr: 'Larache', name_en: 'Larache', slug: 'larache', region: 'طنجة تطوان الحسيمة', population: 125917, is_major: false },
  { name_ar: 'مديونة', name_fr: 'Mediouna', name_en: 'Mediouna', slug: 'mediouna', region: 'الدار البيضاء سطات', population: 162594, is_major: false },
  { name_ar: 'نواصر', name_fr: 'Nouaceur', name_en: 'Nouaceur', slug: 'nouaceur', region: 'الدار البيضاء سطات', population: 276943, is_major: false },
  { name_ar: 'برشيد', name_fr: 'Berrechid', name_en: 'Berrechid', slug: 'berrechid', region: 'الدار البيضاء سطات', population: 162150, is_major: false },
  { name_ar: 'بنسليمان', name_fr: 'Benslimane', name_en: 'Benslimane', slug: 'bensliman', region: 'الدار البيضاء سطات', population: 63197, is_major: false },
];

const currencies = [
  { code: 'MAD', name_ar: 'درهم مغربي', name_fr: 'Dirham marocain', name_en: 'Moroccan Dirham', symbol: 'د.م.', symbol_position: 'after', decimal_places: 2, is_default: true, exchange_rate_to_usd: 10.05 },
  { code: 'USD', name_ar: 'دولار أمريكي', name_fr: 'Dollar américain', name_en: 'US Dollar', symbol: '$', symbol_position: 'before', decimal_places: 2, is_default: false, exchange_rate_to_usd: 1 },
  { code: 'EUR', name_ar: 'يورو', name_fr: 'Euro', name_en: 'Euro', symbol: '€', symbol_position: 'before', decimal_places: 2, is_default: false, exchange_rate_to_usd: 1.08 },
];

const plans = [
  { name_ar: 'مجاني', name_fr: 'Gratuit', name_en: 'Free', slug: 'free', price: 0, currency_code: 'MAD', duration_days: 365, max_listings: 5, max_images_per_listing: 4, featured_listings_per_month: 0, priority_support: false, can_create_organization: false, max_organization_members: 0, features_ar: ['5 إعلانات شهرياً', '4 صور لكل إعلان'], features_fr: ['5 annonces par mois', '4 images par annonce'], features_en: ['5 listings per month', '4 images per listing'], is_popular: false, is_active: true, order: 1 },
  { name_ar: 'احترافي', name_fr: 'Professionnel', name_en: 'Professional', slug: 'professional', price: 49, currency_code: 'MAD', duration_days: 30, max_listings: 50, max_images_per_listing: 12, featured_listings_per_month: 5, priority_support: true, can_create_organization: true, max_organization_members: 3, features_ar: ['50 إعلان شهرياً', '12 صور', '5 مميزات', 'دعم أولوية'], features_fr: ['50 annonces/mois', '12 images', '5 vedettes', 'Support prioritaire'], features_en: ['50 listings/month', '12 images', '5 featured', 'Priority support'], is_popular: true, is_active: true, order: 2 },
  { name_ar: 'تجاري', name_fr: 'Commercial', name_en: 'Business', slug: 'business', price: 149, currency_code: 'MAD', duration_days: 30, max_listings: 200, max_images_per_listing: 20, featured_listings_per_month: 20, priority_support: true, can_create_organization: true, max_organization_members: 10, features_ar: ['200 إعلان', '20 صور', '20 مميز', 'دعم VIP'], features_fr: ['200 annonces', '20 images', '20 vedettes', 'Support VIP'], features_en: ['200 listings', '20 images', '20 featured', 'VIP support'], is_popular: false, is_active: true, order: 3 },
  { name_ar: 'مؤسسي', name_fr: 'Entreprise', name_en: 'Enterprise', slug: 'enterprise', price: 499, currency_code: 'MAD', duration_days: 30, max_listings: -1, max_images_per_listing: 30, featured_listings_per_month: -1, priority_support: true, can_create_organization: true, max_organization_members: -1, features_ar: ['غير محدود', '30 صور', 'كل الميزات', 'دعم 24/7'], features_fr: ['Illimité', '30 images', 'Toutes fonctionnalités', 'Support 24/7'], features_en: ['Unlimited', '30 images', 'All features', '24/7 support'], is_popular: false, is_active: true, order: 4 },
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
  
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    console.error(`   ❌ Error ${response.status}: ${error}`);
    return null;
  }
  return response.json();
}

async function upsertRecord(table: string, data: any, conflictColumn: string = 'slug') {
  const existing = await supabaseRequest(table, 'GET', `${conflictColumn}=eq.${data[conflictColumn]}`);
  if (existing && existing.length > 0) {
    // Update
    const result = await supabaseRequest(`${table}?${conflictColumn}=eq.${data[conflictColumn]}`, 'PATCH', data);
    return result ? result[0] : null;
  } else {
    // Insert
    const result = await supabaseRequest(table, 'POST', data);
    return result ? result[0] : null;
  }
}

// ===================================================
// Main Seed Function
// ===================================================

async function main() {
  console.log('🌱 بدء زراعة البيانات الأولية عبر Supabase API...\n');
  
  try {
    // 1. Create Country
    console.log('🇲🇦 إنشاء دولة المغرب...');
    const countryResult = await upsertRecord('countries', {
      code: 'MA',
      name_ar: 'المغرب',
      name_fr: 'Maroc',
      name_en: 'Morocco',
      flag_emoji: '🇲🇦',
      phone_code: '+212',
      is_active: true
    }, 'code');
    console.log('   ✅ تم إنشاء المغرب\n');

    // 2. Create Currencies
    console.log('💰 إنشاء العملات...');
    for (const currency of currencies) {
      const result = await upsertRecord('currencies', currency, 'code');
      console.log(`   ✅ ${currency.name_ar} (${currency.code})`);
    }
    console.log('');

    // 3. Create Cities
    console.log('🏙️ إنشاء المدن المغربية...');
    let cityCount = 0;
    for (const city of cities) {
      const result = await upsertRecord('cities', {
        ...city,
        country_id: countryResult?.id || 'MA'
      }, 'slug');
      if (result) cityCount++;
    }
    console.log(`   ✅ تم إنشاء ${cityCount} مدينة\n`);

    // 4. Create Categories (with parent handling)
    console.log('📁 إنشاء الفئات...');
    const categoryMap: Record<string, string> = {};
    let catCount = 0;
    
    for (const cat of categories) {
      const catData = { ...cat };
      
      // Handle parent_id reference
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        catData.parent_id = categoryMap[cat.parent_id];
      } else if (cat.parent_id && !categoryMap[cat.parent_id]) {
        // Parent not created yet, skip for now
        continue;
      }
      
      const result = await upsertRecord('categories', catData, 'slug');
      if (result) {
        categoryMap[cat.slug] = result.id;
        catCount++;
        console.log(`   ✅ ${cat.name_ar}`);
      }
    }
    console.log(`\n   📊 تم إنشاء ${catCount} فئة\n`);

    // 5. Create Plans
    console.log('📦 إنشاء باقات الاشتراكات...');
    for (const plan of plans) {
      const result = await upsertRecord('subscription_plans', plan, 'slug');
      console.log(`   ✅ ${plan.name_ar} - ${plan.price} MAD`);
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('✅ تمت زراعة البيانات بنجاح!');
    console.log('═══════════════════════════════════════════');
    console.log(`
📊 ملخص:
   • مدن: ${cityCount}
   • فئات: ${catCount}
   • عملات: ${currencies.length}
   • باقات: ${plans.length}

🌐 الموقع جاهز الآن!
    `);

  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

main();
