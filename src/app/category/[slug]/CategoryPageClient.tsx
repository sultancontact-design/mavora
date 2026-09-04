'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Filter, 
  Grid3X3, 
  List, 
  MapPin, 
  Search,
  SlidersHorizontal,
  Car,
  Home,
  Smartphone,
  Briefcase,
  Wrench,
  Shirt,
  Sofa,
  PawPrint,
  Dumbbell,
  Baby
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ListingCard from '@/components/listing/ListingCard';

const CATEGORY_CONFIG: Record<string, { 
  icon: React.ElementType;
  color: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionFr: string;
  descriptionEn: string;
}> = {
  vehicles: {
    icon: Car,
    color: 'blue',
    nameAr: 'سيارات ومركبات',
    nameFr: 'Véhicules',
    nameEn: 'Vehicles & Cars',
    descriptionAr: 'سيارات جديدة ومستعملة، دراجات نارية، قوارب، وشركات نقل',
    descriptionFr: 'Voitures neuves et d\'occasion, motos, bateaux, entreprises de transport',
    descriptionEn: 'New and used cars, motorcycles, boats, and transport companies'
  },
  'real-estate': {
    icon: Home,
    color: 'emerald',
    nameAr: 'عقارات',
    nameFr: 'Immobilier',
    nameEn: 'Real Estate',
    descriptionAr: 'شقق، فلل، أراضي، مكاتب، ومحلات تجارية للبيع أو للإيجار',
    descriptionFr: 'Appartements, villas, terrains, bureaux, locaux commerciaux à vendre ou louer',
    descriptionEn: 'Apartments, villas, land, offices, commercial spaces for sale or rent'
  },
  electronics: {
    icon: Smartphone,
    color: 'violet',
    nameAr: 'إلكترونيات',
    nameFr: 'Électronique',
    nameEn: 'Electronics',
    descriptionAr: 'هواتف، حواسيب، أجهزة منزلية، وكاميرات',
    descriptionFr: 'Téléphones, ordinateurs, appareils ménagers, caméras',
    descriptionEn: 'Phones, computers, home appliances, cameras'
  },
  jobs: {
    icon: Briefcase,
    color: 'amber',
    nameAr: 'وظائف',
    nameFr: 'Emploi',
    nameEn: 'Jobs & Employment',
    descriptionAr: 'فرص عمل، وظائف بدوام كامل وجزئي، عمل حر',
    descriptionFr: 'Opportunités d\'emploi, temps plein et partiel, freelance',
    descriptionEn: 'Job opportunities, full-time and part-time work, freelance'
  },
  services: {
    icon: Wrench,
    color: 'rose',
    nameAr: 'خدمات',
    nameFr: 'Services',
    nameEn: 'Services',
    descriptionAr: 'خدمات منزلية، تصليح، تعليم، وصحة',
    descriptionFr: 'Services domestiques, réparation, éducation, santé',
    descriptionEn: 'Home services, repair, education, health'
  },
  fashion: {
    icon: Shirt,
    color: 'pink',
    nameAr: 'أزياء وموضة',
    nameFr: 'Mode',
    nameEn: 'Fashion & Style',
    descriptionAr: 'ملابس، أحذية، إكسسوارات، وساعات',
    descriptionFr: 'Vêtements, chaussures, accessoires, montres',
    descriptionEn: 'Clothing, shoes, accessories, watches'
  },
  home: {
    icon: Sofa,
    color: 'teal',
    nameAr: 'المنزل والحديقة',
    nameFr: 'Maison & Jardin',
    nameEn: 'Home & Garden',
    descriptionAr: 'أثاث، ديكور، أدوات منزلية، وحديقة',
    descriptionFr: 'Meubles, décoration, outils ménagers, jardin',
    descriptionEn: 'Furniture, decor, home tools, garden'
  },
  pets: {
    icon: PawPrint,
    color: 'orange',
    nameAr: 'حيوانات أليفة',
    nameFr: 'Animaux',
    nameEn: 'Pets & Animals',
    descriptionAr: 'كلاب، قطط، طيور، وإكسسوارات الحيوانات',
    descriptionFr: 'Chiens, chats, oiseaux, accessoires animaux',
    descriptionEn: 'Dogs, cats, birds, pet accessories'
  },
  sports: {
    icon: Dumbbell,
    color: 'green',
    nameAr: 'رياضة وهوايات',
    nameFr: 'Sports & Loisirs',
    nameEn: 'Sports & Hobbies',
    descriptionAr: 'معدات رياضية، آلات موسيقية، كتب، وألعاب',
    descriptionFr: 'Équipements sportifs, instruments de musique, livres, jeux',
    descriptionEn: 'Sports equipment, musical instruments, books, games'
  },
  babies: {
    icon: Baby,
    color: 'cyan',
    nameAr: 'أطفال ورضع',
    nameFr: 'Bébés & Enfants',
    nameEn: 'Babies & Kids',
    descriptionAr: 'ملابس أطفال، ألعاب، عربات، ومستلزمات الأطفال',
    descriptionFr: 'Vêtements enfants, jouets, poussettes, articles bébé',
    descriptionEn: 'Kids clothes, toys, strollers, baby supplies'
  }
};

interface Listing {
  id: string;
  title: string;
  price?: number | null;
  currencyCode?: string;
  locationAddress?: string;
  images?: string[];
  category?: { name: string; nameAr?: string; nameFr?: string };
}

export default function CategoryPageClient() {
  const { t, locale } = useTranslation();
  const params = useParams();
  const slug = params.slug as string;
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const config = CATEGORY_CONFIG[slug] || CATEGORY_CONFIG.vehicles;
  const Icon = config.icon;
  const isRtl = locale === 'ar';

  const getCategoryName = () => {
    switch (locale) {
      case 'ar': return config.nameAr;
      case 'fr': return config.nameFr;
      default: return config.nameEn;
    }
  };

  const getCategoryDescription = () => {
    switch (locale) {
      case 'ar': return config.descriptionAr;
      case 'fr': return config.descriptionFr;
      default: return config.descriptionEn;
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listings?category=${slug}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          setListings(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Category Header */}
      <section className={`bg-gradient-to-br from-${config.color}-600 to-${config.color}-700 text-white`}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className={`size-4 ${isRtl ? '' : 'rotate-180'}`} />
            {locale === 'ar' ? 'العودة للرئيسية' : locale === 'fr' ? 'Retour à l\'accueil' : 'Back to Home'}
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Icon className="size-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">{getCategoryName()}</h1>
              <p className="mt-2 text-lg text-white/80">{getCategoryDescription()}</p>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="mt-8">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="sticky top-16 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder={`${t('common.search')} ${getCategoryName()}...`}
                className="ps-10 rounded-xl"
              />
            </div>
            
            {/* Location */}
            <Button variant="outline" className="gap-2 rounded-xl">
              <MapPin className="size-4" />
              {locale === 'ar' ? 'الموقع' : locale === 'fr' ? 'Lieu' : 'Location'}
            </Button>
            
            {/* Filters */}
            <Button variant="outline" className="gap-2 rounded-xl">
              <SlidersHorizontal className="size-4" />
              {locale === 'ar' ? 'فلتر' : locale === 'fr' ? 'Filtrer' : 'Filters'}
            </Button>
            
            {/* View Mode */}
            <div className="flex rounded-lg border border-gray-200">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="size-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-gray-200 h-80" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <p className="mb-6 text-sm text-gray-500">
              {listings.length} {locale === 'ar' ? 'إعلان' : locale === 'fr' ? 'annonces' : 'listings'}
            </p>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'lg:grid-cols-2'
            }`}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-gray-100">
              <Icon className="size-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {locale === 'ar' ? 'لا توجد إعلانات حالياً' : locale === 'fr' ? 'Aucune annonce pour le moment' : 'No listings yet'}
            </h3>
            <p className="mt-2 text-gray-500">
              {locale === 'ar'
                ? 'كن أول من ينشر إعلان في هذا القسم!'
                : locale === 'fr'
                  ? 'Soyez le premier à publier une annonce dans cette catégorie !'
                  : 'Be the first to post a listing in this category!'}
            </p>
            <Button className="mt-6 rounded-xl" asChild>
              <Link href="/listings/create">
                {locale === 'ar' ? 'نشر إعلان' : locale === 'fr' ? 'Publier une annonce' : 'Post a Listing'}
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
