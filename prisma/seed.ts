/**
 * MAVORA Seed Data
 * البيانات الأولية لمنصة مافورا - المغرب
 * 
 * يشمل:
 * - الفئات الرئيسية والفرعية
 * - المدن المغربية
 * - العملات
 * - باقات الأسعار
 * - إعدادات النظام
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// ===================================================
// Moroccan Categories - الفئات المغربية
// ===================================================

const categories = [
  // === سيارات ومركبات ===
  {
    name_ar: 'سيارات ومركبات',
    name_fr: 'Véhicules',
    name_en: 'Vehicles',
    slug: 'vehicles',
    icon: 'Car',
    description_ar: 'سيارات جديدة ومستعملة، دراجات نارية، قطع غيار',
    description_fr: 'Voitures neuves et d\'occasion, motos, pièces détachées',
    description_en: 'New and used cars, motorcycles, spare parts',
    order: 1,
    is_active: true,
    subcategories: [
      { name_ar: 'سيارات', name_fr: 'Voitures', name_en: 'Cars', slug: 'cars' },
      { name_ar: 'دراجات نارية', name_fr: 'Motos', name_en: 'Motorcycles', slug: 'motorcycles' },
      { name_ar: 'شاحنات', name_fr: 'Camions', name_en: 'Trucks', slug: 'trucks' },
      { name_ar: 'قطع غيار', name_fr: 'Pièces détachées', name_en: 'Spare Parts', slug: 'spare-parts' },
      { name_ar: 'قوارب ومراكب', name_fr: 'Bateaux', name_en: 'Boats', slug: 'boats' },
      { name_ar: 'معدات ثقيلة', name_fr: 'Engins lourds', name_en: 'Heavy Equipment', slug: 'heavy-equipment' },
    ]
  },
  // === عقارات ===
  {
    name_ar: 'عقارات',
    name_fr: 'Immobilier',
    name_en: 'Real Estate',
    slug: 'real-estate',
    icon: 'Building2',
    description_ar: 'شقق، فيلات، أراضي، محلات تجارية للبيع والإيجار',
    description_fr: 'Appartements, villas, terrains, locaux commerciaux à vendre et à louer',
    description_en: 'Apartments, villas, land, commercial properties for sale and rent',
    order: 2,
    is_active: true,
    subcategories: [
      { name_ar: 'شقق للبيع', name_fr: 'Appartements à vendre', name_en: 'Apartments for Sale', slug: 'apartments-sale' },
      { name_ar: 'شقق للإيجار', name_fr: 'Appartements à louer', name_en: 'Apartments for Rent', slug: 'apartments-rent' },
      { name_ar: 'فيلا للبيع', name_fr: 'Villas à vendre', name_en: 'Villas for Sale', slug: 'villas-sale' },
      { name_ar: 'فيلا للإيجار', name_fr: 'Villas à louer', name_en: 'Villas for Rent', slug: 'villas-rent' },
      { name_ar: 'أراضي', name_fr: 'Terrains', name_en: 'Land', slug: 'land' },
      { name_ar: 'محلات تجارية', name_fr: 'Locaux commerciaux', name_en: 'Commercial', slug: 'commercial' },
      { name_ar: 'مكاتب', name_fr: 'Bureaux', name_en: 'Offices', slug: 'offices' },
      { name_ar: 'غرف', name_fr: 'Chambres', name_en: 'Rooms', slug: 'rooms' },
    ]
  },
  // === إلكترونيات ===
  {
    name_ar: 'إلكترونيات',
    name_fr: 'Électronique',
    name_en: 'Electronics',
    slug: 'electronics',
    icon: 'Smartphone',
    description_ar: 'هواتف، حواسيب، تلفزيونات، كاميرات وأجهزة إلكترونية',
    description_fr: 'Téléphones, ordinateurs, téléviseurs, appareils photo et électronique',
    description_en: 'Phones, computers, TVs, cameras and electronics',
    order: 3,
    is_active: true,
    subcategories: [
      { name_ar: 'هواتف ذكية', name_fr: 'Smartphones', name_en: 'Smartphones', slug: 'smartphones' },
      { name_ar: 'حواسيب', name_fr: 'Ordinateurs', name_en: 'Computers', slug: 'computers' },
      { name_ar: 'تلفزيونات', name_fr: 'Téléviseurs', name_en: 'TVs', slug: 'tvs' },
      { name_ar: 'كاميرات', name_fr: 'Appareils photo', name_en: 'Cameras', slug: 'cameras' },
      { name_ar: 'صوتيات', name_fr: 'Audio', name_en: 'Audio', slug: 'audio' },
      { name_ar: 'ألعاب فيديو', name_fr: 'Jeux vidéo', name_en: 'Video Games', slug: 'video-games' },
      { name_ar: 'إكسسوارات', name_fr: 'Accessoires', name_en: 'Accessories', slug: 'electronics-accessories' },
    ]
  },
  // === المنزل والحديقة ===
  {
    name_ar: 'المنزل والحديقة',
    name_fr: 'Maison et Jardin',
    name_en: 'Home & Garden',
    slug: 'home-garden',
    icon: 'Home',
    description_ar: 'أثاث، ديكور، معدات منزلية، أدوات حديقة',
    description_fr: 'Mobilier, décoration, électroménager, outils de jardin',
    description_en: 'Furniture, decor, home appliances, garden tools',
    order: 4,
    is_active: true,
    subcategories: [
      { name_ar: 'أثاث غرفة المعيشة', name_fr: 'Salon', name_en: 'Living Room', slug: 'living-room' },
      { name_ar: 'غرف نوم', name_fr: 'Chambres à coucher', name_en: 'Bedrooms', slug: 'bedrooms' },
      { name_ar: 'مطبخ وغرفة الأكل', name_fr: 'Cuisine et salle à manger', name_en: 'Kitchen & Dining', slug: 'kitchen-dining' },
      { name_ar: 'ديكور وإكسسوارات', name_fr: 'Décoration et accessoires', name_en: 'Decor & Accessories', slug: 'decor' },
      { name_ar: 'حديقة', name_fr: 'Jardin', name_en: 'Garden', slug: 'garden' },
      { name_ar: 'معدات كهربائية', name_fr: 'Électroménager', name_en: 'Appliances', slug: 'appliances' },
    ]
  },
  // === أزياء وجمال ===
  {
    name_ar: 'أزياء وجمال',
    name_fr: 'Mode et Beauté',
    name_en: 'Fashion & Beauty',
    slug: 'fashion-beauty',
    icon: 'Shirt',
    description_ar: 'ملابس، أحذية، إكسسوارات، مستحضرات تجميل',
    description_fr: 'Vêtements, chaussures, accessoires, cosmétiques',
    description_en: 'Clothing, shoes, accessories, cosmetics',
    order: 5,
    is_active: true,
    subcategories: [
      { name_ar: 'ملابس رجالية', name_fr: 'Vêtements homme', name_en: 'Men\'s Clothing', slug: 'mens-clothing' },
      { name_ar: 'ملابس نسائية', name_fr: 'Vêtements femme', name_en: 'Women\'s Clothing', slug: 'womens-clothing' },
      { name_ar: 'ملابس أطفال', name_fr: 'Vêtements enfants', name_en: 'Kids\' Clothing', slug: 'kids-clothing' },
      { name_ar: 'أحذية', name_fr: 'Chaussures', name_en: 'Shoes', slug: 'shoes' },
      { name_ar: 'حقائب وإكسسوارات', name_fr: 'Sacs et accessoires', name_en: 'Bags & Accessories', slug: 'bags-accessories' },
      { name_ar: 'ساعات ومجوهرات', name_fr: 'Montres et bijoux', name_en: 'Watches & Jewelry', slug: 'watches-jewelry' },
      { name_ar: 'جمال وصحة', name_fr: 'Beauté et santé', name_en: 'Beauty & Health', slug: 'beauty-health' },
    ]
  },
  // === رياضة وهوايات ===
  {
    name_ar: 'رياضة وهوايات',
    name_fr: 'Sports et Loisirs',
    name_en: 'Sports & Hobbies',
    slug: 'sports-hobbies',
    icon: 'Dumbbell',
    description_ar: 'معدات رياضية، دراجات، كتب، آلات موسيقية',
    description_fr: 'Équipements sportifs, vélos, livres, instruments de musique',
    description_en: 'Sports equipment, bikes, books, musical instruments',
    order: 6,
    is_active: true,
    subcategories: [
      { name_ar: 'معدات رياضية', name_fr: 'Équipements sportifs', name_en: 'Sports Equipment', slug: 'sports-equipment' },
      { name_ar: 'دراجات', name_fr: 'Vélos', name_en: 'Bicycles', slug: 'bicycles' },
      { name_ar: 'موسيقى وآلات', name_fr: 'Musique et instruments', name_en: 'Music & Instruments', slug: 'music-instruments' },
      { name_ar: 'كتب ومجلات', name_fr: 'Livres et magazines', name_en: 'Books & Magazines', slug: 'books-magazines' },
      { name_ar: 'ألعاب وألغاز', name_fr: 'Jeux et puzzles', name_en: 'Games & Puzzles', slug: 'games-puzzles' },
      { name_ar: 'فنون وحرف يدوية', name_fr: 'Art et artisanat', name_en: 'Arts & Crafts', slug: 'arts-crafts' },
    ]
  },
  // === حيوانات أليفة ===
  {
    name_ar: 'حيوانات أليفة',
    name_fr: 'Animaux',
    name_en: 'Pets',
    slug: 'pets',
    icon: 'Heart',
    description_ar: 'كلاب، قطط، طيور، أسماك، مستلزمات حيوانات',
    description_fr: 'Chiens, chats, oiseaux, poissons, accessoires animaux',
    description_en: 'Dogs, cats, birds, fish, pet supplies',
    order: 7,
    is_active: true,
    subcategories: [
      { name_ar: 'كلاب', name_fr: 'Chiens', name_en: 'Dogs', slug: 'dogs' },
      { name_ar: 'قطط', name_fr: 'Chats', name_en: 'Cats', slug: 'cats' },
      { name_ar: 'طيور', name_fr: 'Oiseaux', name_en: 'Birds', slug: 'birds' },
      { name_ar: 'أسماك', name_fr: 'Poissons', name_en: 'Fish', slug: 'fish' },
      { name_ar: 'مستلزمات حيوانات', name_fr: 'Accessoires animaux', name_en: 'Pet Supplies', slug: 'pet-supplies' },
    ]
  },
  // === وظائف وخدمات ===
  {
    name_ar: 'وظائف وخدمات',
    name_fr: 'Emplois et Services',
    name_en: 'Jobs & Services',
    slug: 'jobs-services',
    icon: 'Briefcase',
    description_ar: 'وظائف شاغرة، خدمات مهنية، خدمات منزلية',
    description_fr: 'Offres d\'emploi, services professionnels, services domestiques',
    description_en: 'Job offers, professional services, domestic services',
    order: 8,
    is_active: true,
    subcategories: [
      { name_ar: 'وظائف إدارية', name_fr: 'Emplois administratifs', name_en: 'Administrative Jobs', slug: 'admin-jobs' },
      { name_ar: 'وظائف تقنية', name_fr: 'Emplois tech', name_en: 'Tech Jobs', slug: 'tech-jobs' },
      { name_ar: 'وظائف تجارية', name_fr: 'Emplois commerciaux', name_en: 'Sales Jobs', slug: 'sales-jobs' },
      { name_ar: 'خدمات منزلية', name_fr: 'Services domestiques', name_en: 'Domestic Services', slug: 'domestic-services' },
      { name_ar: 'خدمات تعليمية', name_fr: 'Services éducatifs', name_en: 'Education Services', slug: 'education-services' },
      { name_ar: 'خدمات صحية', name_fr: 'Services de santé', name_en: 'Health Services', slug: 'health-services' },
      { name_ar: 'خدمات صيانة', name_fr: 'Services de maintenance', name_en: 'Repair Services', slug: 'repair-services' },
    ]
  },
  // === أعمال وتجارة ===
  {
    name_ar: 'أعمال وتجارة',
    name_fr: 'Affaires et Commerce',
    name_en: 'Business & Trade',
    slug: 'business-trade',
    icon: 'Store',
    description_ar: 'محلات، مطاعم، مشاريع جاهزة، معدات تجارية',
    description_fr: 'Commerces, restaurants, projets clés en main, équipements commerciaux',
    description_en: 'Shops, restaurants, turnkey businesses, commercial equipment',
    order: 9,
    is_active: true,
    subcategories: [
      { name_ar: 'محلات تجارية', name_fr: 'Commerces', name_en: 'Shops', slug: 'shops' },
      { name_ar: 'مطاعم وكافيهات', name_fr: 'Restaurants et cafés', name_en: 'Restaurants & Cafes', slug: 'restaurants-cafes' },
      { name_ar: 'مشاريع جاهزة', name_fr: 'Projets clés en main', name_en: 'Turnkey Businesses', slug: 'turnkey-businesses' },
      { name_ar: 'معدات تجارية', name_fr: 'Équipements commerciaux', name_en: 'Commercial Equipment', slug: 'commercial-equipment' },
      { name_ar: 'مواد أولية', name_br: 'Matières premières', name_en: 'Raw Materials', slug: 'raw-materials' },
    ]
  },
  // === أخرى ===
  {
    name_ar: 'أخرى',
    name_fr: 'Autres',
    name_en: 'Others',
    slug: 'others',
    icon: 'Package',
    description_ar: 'كل ما لا ينتمي للفئات السابقة',
    description_fr: 'Tout ce qui n\'appartient pas aux catégories précédentes',
    description_en: 'Everything that doesn\'t fit in other categories',
    order: 10,
    is_active: true,
    subcategories: [
      { name_ar: 'هدايا وتذكارات', name_fr: 'Cadeaux et souvenirs', name_en: 'Gifts & Souvenirs', slug: 'gifts-souvenirs' },
      { name_ar: 'تجهيزات حفلات', name_frl: 'Équipements fêtes', name_en: 'Party Supplies', slug: 'party-supplies' },
      { name_ar: 'أشياء مجانية', name_fr: 'Objets gratuits', name_en: 'Free Stuff', slug: 'free-stuff' },
    ]
  }
];

// ===================================================
// Moroccan Cities - المدن المغربية
// ===================================================

const cities = [
  // المدن الكبرى
  { name_ar: 'الدار البيضاء', name_fr: 'Casablanca', name_en: 'Casablanca', slug: 'casablanca', region: 'الدار البيضاء سطات', population: 3359818, is_major: true },
  { name_ar: 'الرباط', name_fr: 'Rabat', name_en: 'Rabat', slug: 'rabat', region: 'الرباط سلا القنيطرة', population: 577827, is_major: true },
  { name_ar: 'فاس', name_fr: 'Fès', name_en: 'Fes', slug: 'fes', region: 'فاس مكناس', population: 1112072, is_major: true },
  { name_ar: 'مراكش', name_fr: 'Marrakech', name_en: 'Marrakech', slug: 'marrakech', region: 'مراكش آسفي', population: 928850, is_major: true },
  { name_ar: 'أكادير', name_fr: 'Agadir', name_en: 'Agadir', slug: 'agadir', region: 'سوس ماسة', population: 450000, is_major: true },
  { name_ar: 'طنجة', name_fr: 'Tanger', name_en: 'Tangier', slug: 'tangier', region: 'طنجة تطوان الحسيمة', population: 947952, is_major: true },
  { name_ar: 'مكناس', name_fr: 'Meknès', name_en: 'Meknes', slug: 'meknes', region: 'فاس مكناس', population: 632079, is_major: true },
  { name_ar: 'وجدة', name_fr: 'Oujda', name_en: 'Oujda', slug: 'oujda', region: 'الشراق', population: 494252, is_major: true },
  
  // مدن مهمة أخرى
  { name_ar: 'كنترة', name_fr: 'Kenitra', name_en: 'Kenitra', slug: 'kenitra', region: 'الرباط سلا القنيطرة', population: 431282, is_major: false },
  { name_ar: 'تطوان', name_fr: 'Tétouan', name_en: 'Tetouan', slug: 'tetouan', region: 'طنجة تطوان الحسيمة', population: 380787, is_major: false },
  { name_ar: 'الجديدة', name_fr: 'El Jadida', name_en: 'El Jadida', slug: 'el-jadida', region: 'الدار البيضاء سطات', population: 194231, is_major: false },
  { name_ar: 'ناظور', name_fr: 'Nador', name_en: 'Nador', slug: 'nador', region: 'الشراق', population: 161726, is_major: false },
  { name_ar: 'بنى ملال', name_fr: 'Béni Mellal', name_en: 'Beni Mellal', slug: 'beni-mellal', region: 'بني ملال خنيفرة', population: 163286, is_major: false },
  { name_ar: 'خنيفرة', name_fr: 'Khenifra', name_en: 'Khenifra', slug: 'khenifra', region: 'بني ملال خنيفرة', population: 117005, is_major: false },
  { name_ar: 'الحسيمة', name_fr: 'Al Hoceïma', name_en: 'Al Hoceima', slug: 'al-hoceima', region: 'طنجة تطوان الحسيمة', population: 117336, is_major: false },
  { name_ar: 'القنيطرة', name_fr: 'Kénitra', name_en: 'Kenitra', slug: 'kenitra-city', region: 'الرباط سلا القنيطرة', population: 403356, is_major: false },
  { name_ar: 'سطات', name_fr: 'Settat', name_en: 'Settat', slug: 'settat', region: 'الدار البيضاء سطات', population: 309297, is_major: false },
  { name_ar: 'سلا', name_fr: 'Salé', name_en: 'Sale', slug: 'sale', region: 'الرباط سلا القنيطرة', population: 903486, is_major: false },
  { name_ar: 'المحمدية', name_fr: 'Mohammedia', name_en: 'Mohammedia', slug: 'mohammedia', region: 'الدار البيضاء سطات', population: 208612, is_major: false },
  { name_ar: 'خريبكة', name_fr: 'Khouribga', name_en: 'Khouribga', slug: 'khouribga', region: 'بني ملال خنيفرة', population: 244040, is_major: false },
  { name_ar: 'جرادة', name_fr: 'Jerada', name_en: 'Jerada', slug: 'jerada', region: 'الشراق', population: 105840, is_major: false },
  { name_ar: 'بوجادة', name_fr: 'Boujdour', name_en: 'Boujdour', slug: 'boujdour', region: 'العيون الساقية الحمراء', population: 42201, is_major: false },
  { name_ar: 'تازة', name_fr: 'Taza', name_en: 'Taza', slug: 'taza', region: 'فاس مكناس', population: 148456, is_major: false },
  { name_ar: 'العيون', name_fr: 'Laâyoune', name_en: 'Laayoune', slug: 'laayoune', region: 'العيون الساقية الحمراء', population: 218716, is_major: false },
  { name_ar: 'السمارة', name_fr: 'Smara', name_en: 'Smara', slug: 'smara', region: 'العيون الساقية الحمراء', population: 57655, is_major: false },
  { name_ar: 'الفقيه بن صالح', name_fr: 'Fquih Ben Salah', name_en: 'Fquih Ben Salah', slug: 'fquih-ben-salah', region: 'بني ملال خنيفرة', population: 108706, is_major: false },
  { name_ar: 'إفران', name_fr: 'Ifrane', name_en: 'Ifrane', slug: 'ifran', region: 'فاس مكناس', population: 21000, is_major: false },
  { name_ar: 'الحاجب', name_fr: 'El Hajeb', name_en: 'El Hajeb', slug: 'el-hajeb', region: 'فاس مكناس', population: 62689, is_major: false },
  { name_ar: 'تاونات', name_fr: 'Taounate', name_en: 'Taounate', slug: 'taounate', region: 'فاس مكناس', population: 51867, is_major: false },
  { name_ar: 'آسفي', name_fr: 'Safi', name_en: 'Safi', slug: 'safi', region: 'مراكش آسفي', population: 308588, is_major: false },
  { name_ar: 'اليوسفية', name_fr: 'Youssefia', name_en: 'Youssefia', slug: 'youssefia', region: 'مراكش آسفي', population: 66827, is_major: false },
  { name_ar: 'الصويرة', name_fr: 'Essaouira', name_en: 'Essaouira', slug: 'essaouira', region: 'مراكش آسفي', population: 86738, is_major: false },
  { name_ar: 'الرشيدية', name_fr: 'Errachidia', name_en: 'Errachidia', slug: 'errachidia', region: 'درعة تافيلالت', population: 103480, is_major: false },
  { name_ar: 'ورزازات', name_fr: 'Ouarzazate', name_en: 'Ouarzazate', slug: 'ouarzazate', region: 'درعة تافيلالت', population: 71194, is_major: false },
  { name_ar: 'زاغورة', name_fr: 'Zagora', name_en: 'Zagora', slug: 'zagora', region: 'درعة تافيلالت', population: 41639, is_major: false },
  { name_ar: 'تنغير', name_fr: 'Tinghir', name_en: 'Tinghir', slug: 'tinghir', region: 'درعة تافيلالت', population: 104572, is_major: false },
  { name_ar: 'الكويرة', name_fr: 'La Guera', name_en: 'Guelmim', slug: 'guelmim', region: 'كلميم واد نون', population: 124300, is_major: false },
  { name_ar: 'كلميم', name_fr: 'Guelmim', name_en: 'Guelmim-city', slug: 'guelmim-city', region: 'كلميم واد نون', population: 124300, is_major: false },
  { name_arch: 'العيون', name_fr: 'Tiznit', name_en: 'Tiznit', slug: 'tiznit', region: 'سوس ماسة', population: 80099, is_major: false },
  { name_ar: 'تارودانت', name_fr: 'Taroudant', name_en: 'Taroudant', slug: 'taroudant', region: 'سوس ماسة', population: 86802, is_major: false },
  { name_ar: 'شتوكة أيت باها', name_fr: 'Chtouka Aït Baha', name_en: 'Chtouka Ait Baha', slug: 'chtouka-ait-baha', region: 'سوس ماسة', population: 36187, is_major: false },
  { name_ar: 'المصطفى', name_fr: 'Al Haouz', name_en: 'Al Haouz', slug: 'al-haouz', region: 'مراكش آسفي', population: 564421, is_major: false },
  { name_ar: 'الصخيرات', name_fr: 'Skhirate-Témara', name_en: 'Skhirate-Temara', slug: 'skhirate-temara', region: 'الرباط سلا القنيطرة', population: 347763, is_major: false },
  { name_ar: 'سيدي قاسم', name_fr: 'Sidi Kacem', name_en: 'Sidi Kacem', slug: 'sidi-kacem', region: 'الرباط سلا القنيطرة', population: 188413, is_major: false },
  { name_ar: 'بركان', name_fr: 'Berkane', name_en: 'Berkane', slug: 'berkane', region: 'الشراق', population: 109237, is_major: false },
  { name_ar: 'تاوريرت', name_fr: 'Taourirt', name_en: 'Taourirt', slug: 'taourirt', region: 'الشراق', population: 96378, is_major: false },
  { name_ar: 'جرف الملحة', name_fr: 'Jerf Melha', name_en: 'Jerf Melha', slug: 'jerf-melha', region: 'الشراق', population: 37985, is_major: false },
  { name_ar: 'فكيك', name_fr: 'Figuig', name_en: 'Figuig', slug: 'figuig', region: 'الشراق', population: 10130, is_major: false },
  { name_ar: 'الحاجب', name_fr: 'El Hajeb', name_en: 'El-Hajeb', slug: 'el-hajeb-city', region: 'فاس مكناس', population: 62689, is_major: false },
  { name_ar: 'إقليم أزيلال', name_fr: 'Azilal', name_en: 'Azilal', slug: 'azilal', region: 'بني ملال خنيفرة', population: 56381, is_major: false },
  { name_ar: 'شفشاون', name_fr: 'Chefchaouen', name_en: 'Chefchaouen', slug: 'chefchaouen', region: 'طنجة تطوان الحسيمة', population: 45506, is_major: false },
  { name_ar: 'العرائش', name_fr: 'Larache', name_en: 'Larache', slug: 'larache', region: 'طنجة تطوان الحسيمة', population: 125917, is_major: false },
  { name_ar: 'تطوان', name_fr: 'Tétouan City', name_en: 'Tetouan City', slug: 'tetouan-city', region: 'طنجة تطوان الحسيمة', population: 380787, is_major: false },
  { name_ar: 'الفحص أنجرة', name_fr: 'Fahs Anjra', name_en: 'Fahs Anjra', slug: 'fahs-anjra', region: 'طنجة تطوان الحسيمة', population: 114716, is_major: false },
  { name_ar: 'مديونة', name_fr: 'Mediouna', name_en: 'Mediouna', slug: 'mediouna', region: 'الدار البيضاء سطات', population: 162594, is_major: false },
  { name_ar: 'نواصر', name_fr: 'Nouaceur', name_en: 'Nouaceur', slug: 'nouaceur', region: 'الدار البيضاء سطات', population: 276943, is_major: false },
  { name_ar: 'برشيد', name_fr: 'Berrechid', name_en: 'Berrechid', slug: 'berrechid', region: 'الدار البيضاء سطات', population: 162150, is_major: false },
  { name_ar: 'بنسليمان', name_fr: 'Benslimane', name_en: 'Benslimane', slug: 'benslimane', region: 'الدار البيضاء سطات', population: 63197, is_major: false },
  { name_ar: 'خنيفرة', name_fr: 'Khenifra City', name_en: 'Khenifra City', slug: 'khenifra-city', region: 'بني ملال خنيفرة', population: 117005, is_major: false },
];

// ===================================================
// Currencies - العملات
// ===================================================

const currencies = [
  {
    code: 'MAD',
    name_ar: 'درهم مغربي',
    name_fr: 'Dirham marocain',
    name_en: 'Moroccan Dirham',
    symbol: 'د.م.',
    symbol_position: 'after',
    decimal_places: 2,
    is_default: true,
    exchange_rate_to_usd: 10.05,
  },
  {
    code: 'USD',
    name_ar: 'دولار أمريكي',
    name_fr: 'Dollar américain',
    name_en: 'US Dollar',
    symbol: '$',
    symbol_position: 'before',
    decimal_places: 2,
    is_default: false,
    exchange_rate_to_usd: 1,
  },
  {
    code: 'EUR',
    name_ar: 'يورو',
    name_fr: 'Euro',
    name_en: 'Euro',
    symbol: '€',
    symbol_position: 'before',
    decimal_places: 2,
    is_default: false,
    exchange_rate_to_usd: 1.08,
  },
];

// ===================================================
// Subscription Plans - باقات الاشتراكات
// ===================================================

const plans = [
  {
    name_ar: 'مجاني',
    name_fr: 'Gratuit',
    name_en: 'Free',
    slug: 'free',
    price: 0,
    currency_code: 'MAD',
    duration_days: 365,
    max_listings: 5,
    max_images_per_listing: 4,
    featured_listings_per_month: 0,
    priority_support: false,
    can_create_organization: false,
    max_organization_members: 0,
    features_ar: ['5 إعلانات شهرياً', '4 صور لكل إعلان', 'دعم عادي'],
    features_fr: ['5 annonces par mois', '4 images par annonce', 'Support standard'],
    features_en: ['5 listings per month', '4 images per listing', 'Standard support'],
    is_popular: false,
    is_active: true,
    order: 1,
  },
  {
    name_ar: 'احترافي',
    name_fr: 'Professionnel',
    name_en: 'Professional',
    slug: 'professional',
    price: 49,
    currency_code: 'MAD',
    duration_days: 30,
    max_listings: 50,
    max_images_per_listing: 12,
    featured_listings_per_month: 5,
    priority_support: true,
    can_create_organization: true,
    max_organization_members: 3,
    features_ar: ['50 إعلان شهرياً', '12 صور لكل إعلان', '5 إعلانات مميزة', 'دعم أولوية', 'إنشاء منظمة', '3 أعضاء'],
    features_fr: ['50 annonces par mois', '12 images par annonce', '5 annonces en vedette', 'Support prioritaire', 'Créer organisation', '3 membres'],
    features_en: ['50 listings per month', '12 images per listing', '5 featured listings', 'Priority support', 'Create organization', '3 members'],
    is_popular: true,
    is_active: true,
    order: 2,
  },
  {
    name_ar: 'تجاري',
    name_fr: 'Commercial',
    name_en: 'Business',
    slug: 'business',
    price: 149,
    currency_code: 'MAD',
    duration_days: 30,
    max_listings: 200,
    max_images_per_listing: 20,
    featured_listings_per_month: 20,
    priority_support: true,
    can_create_organization: true,
    max_organization_members: 10,
    features_ar: ['200 إعلان شهرياً', '20 صور لكل إعلان', '20 إعلان مميز', 'دعم VIP', 'إنشاء منظمة', '10 أعضاء', 'تقارير متقدمة'],
    features_fr: ['200 annonces par mois', '20 images par annonce', '20 annonces en vedette', 'Support VIP', 'Créer organisation', '10 membres', 'Rapports avancés'],
    features_en: ['200 listings per month', '20 images per listing', '20 featured listings', 'VIP support', 'Create organization', '10 members', 'Advanced reports'],
    is_popular: false,
    is_active: true,
    order: 3,
  },
  {
    name_ar: 'مؤسسي',
    name_fr: 'Entreprise',
    name_en: 'Enterprise',
    slug: 'enterprise',
    price: 499,
    currency_code: 'MAD',
    duration_days: 30,
    max_listings: -1, // unlimited
    max_images_per_listing: 30,
    featured_listings_per_month: -1, // unlimited
    priority_support: true,
    can_create_organization: true,
    max_organization_members: -1, // unlimited
    features_ar: ['إعلانات غير محدودة', '30 صور لكل إعلان', 'إعلانات مميزة غير محدودة', 'دعم مخصص 24/7', 'منظمات غير محدودة', 'أعضاء غير محدودين', 'API مخصص', 'مدير حساب خاص'],
    features_fr: ['Annonces illimitées', '30 images par annonce', 'Annonces en vedette illimitées', 'Support dédié 24/7', 'Organisations illimitées', 'Membres illimités', 'API personnalisé', 'Gestionnaire de compte dédié'],
    features_en: ['Unlimited listings', '30 images per listing', 'Unlimited featured listings', 'Dedicated 24/7 support', 'Unlimited organizations', 'Unlimited members', 'Custom API', 'Dedicated account manager'],
    is_popular: false,
    is_active: true,
    order: 4,
  },
];

// ===================================================
// System Settings - إعدادات النظام
// ===================================================

const settings = [
  { key: 'site_name_ar', value: 'مافورا', type: 'string', category: 'general' },
  { key: 'site_name_fr', value: 'MAVORA', type: 'string', category: 'general' },
  { key: 'site_name_en', value: 'MAVORA', type: 'string', category: 'general' },
  { key: 'default_locale', value: 'ar', type: 'string', category: 'general' },
  { key: 'default_country_code', value: 'MA', type: 'string', category: 'general' },
  { key: 'listing_duration_days', value: '30', type: 'number', category: 'listings' },
  { key: 'max_images_per_listing', value: '20', type: 'number', category: 'listings' },
  { key: 'allow_guest_viewing', value: 'true', type: 'boolean', category: 'general' },
  { key: 'require_email_verification', value: 'true', type: 'boolean', category: 'auth' },
  { key: 'require_phone_verification', value: 'false', type: 'boolean', category: 'auth' },
  { key: 'enable_chat', value: 'true', type: 'boolean', category: 'features' },
  { key: 'enable_reviews', value: 'true', type: 'boolean', category: 'features' },
  { key: 'enable_favorites', value: 'true', type: 'boolean', category: 'features' },
  { key: 'featured_listing_price', value: '20', type: 'number', category: 'pricing' },
  { key: 'urgent_listing_price', value: '15', type: 'number', category: 'pricing' },
  { key: 'highlight_listing_price', value: '10', type: 'number', category: 'pricing' },
  { key: 'currency_code', value: 'MAD', type: 'string', category: 'pricing' },
  { key: 'maintenance_mode', value: 'false', type: 'boolean', category: 'system' },
];

// ===================================================
// Main Seed Function
// ===================================================

async function main() {
  console.log('🌱 بدء زراعة البيانات الأولية لـ MAVORA...\n');
  
  try {
    // 1. Create Country (Morocco)
    console.log('🇲🇦 إنشاء دولة المغرب...');
    const morocco = await prisma.country.upsert({
      where: { code: 'MA' },
      update: {},
      create: {
        code: 'MA',
        name_ar: 'المغرب',
        name_fr: 'Maroc',
        name_en: 'Morocco',
        flag_emoji: '🇲🇦',
        phone_code: '+212',
        is_active: true,
      },
    });
    console.log(`   ✅ تم إنشاء: ${morocco.name_ar}\n`);

    // 2. Create Currencies
    console.log('💰 إنشاء العملات...');
    for (const currency of currencies) {
      const created = await prisma.currency.upsert({
        where: { code: currency.code },
        update: {},
        create: currency,
      });
      console.log(`   ✅ ${created.name_ar} (${created.code})`);
    }
    console.log('');

    // 3. Create Cities
    console.log('🏙️ إنشاء المدن المغربية...');
    let citiesCreated = 0;
    for (const city of cities) {
      await prisma.city.upsert({
        where: { slug: city.slug },
        update: {},
        create: {
          ...city,
          country_id: morocco.id,
        },
      });
      citiesCreated++;
    }
    console.log(`   ✅ تم إنشاء ${citiesCreated} مدينة\n`);

    // 4. Create Categories with Subcategories
    console.log('📁 إنشاء الفئات والفئات الفرعية...');
    let categoriesCreated = 0;
    let subcategoriesCreated = 0;
    
    for (const category of categories) {
      const createdCategory = await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: {
          name_ar: category.name_ar,
          name_fr: category.name_fr,
          name_en: category.name_en,
          slug: category.slug,
          icon: category.icon,
          description_ar: category.description_ar,
          description_fr: category.description_fr,
          description_en: category.description_en,
          order: category.order,
          is_active: category.is_active,
        },
      });
      categoriesCreated++;
      
      // Create subcategories
      if (category.subcategories && category.subcategories.length > 0) {
        for (const sub of category.subcategories) {
          await prisma.category.upsert({
            where: { slug: sub.slug },
            update: {},
            create: {
              name_ar: sub.name_ar,
              name_fr: sub.name_fr,
              name_en: sub.name_en,
              slug: sub.slug,
              parent_id: createdCategory.id,
              is_active: true,
            },
          });
          subcategoriesCreated++;
        }
      }
      
      console.log(`   ✅ ${category.name_ar} (${category.subcategories?.length || 0} فئات فرعية)`);
    }
    console.log(`\n   📊 المجموع: ${categoriesCreated} فئة رئيسية، ${subcategoriesCreated} فئة فرعية\n`);

    // 5. Create Subscription Plans
    console.log('📦 إنشاء باقات الاشتراكات...');
    for (const plan of plans) {
      const createdPlan = await prisma.subscriptionPlan.upsert({
        where: { slug: plan.slug },
        update: {},
        create: plan,
      });
      console.log(`   ✅ ${createdPlan.name_ar} - ${createdPlan.price} MAD/شهر`);
    }
    console.log('');

    // 6. Create Settings
    console.log('⚙️ إنشاء إعدادات النظام...');
    for (const setting of settings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }
    console.log('   ✅ تم إنشاء جميع الإعدادات\n');

    // 7. Create Admin User
    console.log('👤 إنشاء مسؤول النظام...');
    const adminPassword = await hash('Admin@2024!', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@mavora.ma' },
      update: {},
      create: {
        email: 'admin@mavora.ma',
        display_name: 'مسؤول النظام',
        password_hash: adminPassword,
        role: 'super_admin',
        is_verified: true,
        is_suspended: false,
      },
    });
    console.log(`   ✅ تم إنشاء المسؤول: ${admin.email}`);
    console.log('   🔑 كلمة المرور: Admin@2024!\n');

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('✅ تمت زراعة البيانات بنجاح!');
    console.log('═══════════════════════════════════════════');
    console.log(`
📊 ملخص البيانات:
   • دولة: 1 (المغرب)
   • عملات: ${currencies.length}
   • مدن: ${cities.length}
   • فئات رئيسية: ${categories.length}
   • فئات فرعية: ${subcategoriesCreated}
   • باقات اشتراك: ${plans.length}
   • إعدادات: ${settings.length}
   • مستخدم مسؤول: 1

🔐 بيانات الدخول للمسؤول:
   البريد: admin@mavora.ma
   كلمة المرور: Admin@2024!

🌐 الموقع جاهز الآن للاستخدام!
    `);

  } catch (error) {
    console.error('❌ خطأ في زراعة البيانات:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
