import { Metadata } from 'next';
import CategoryPageClient from './CategoryPageClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const categoryNames: Record<string, { ar: string; fr: string; en: string }> = {
    vehicles: { ar: 'سيارات ومركبات', fr: 'Véhicules', en: 'Vehicles & Cars' },
    'real-estate': { ar: 'عقارات', fr: 'Immobilier', en: 'Real Estate' },
    electronics: { ar: 'إلكترونيات', fr: 'Électronique', en: 'Electronics' },
    jobs: { ar: 'وظائف', fr: 'Emploi', en: 'Jobs & Employment' },
    services: { ar: 'خدمات', fr: 'Services', en: 'Services' },
    fashion: { ar: 'أزياء وموضة', fr: 'Mode', en: 'Fashion & Style' },
    home: { ar: 'المنزل والحديقة', fr: 'Maison & Jardin', en: 'Home & Garden' },
    pets: { ar: 'حيوانات أليفة', fr: 'Animaux', en: 'Pets & Animals' },
    sports: { ar: 'رياضة وهوايات', fr: 'Sports & Loisirs', en: 'Sports & Hobbies' },
    babies: { ar: 'أطفال ورضع', fr: 'Bébés & Enfants', en: 'Babies & Kids' },
  };

  const category = categoryNames[slug];
  
  return {
    title: `${category?.ar || slug} | MAVORA`,
    description: `تصفح جميع إعلانات ${category?.ar || slug} على منصة مافورا`,
  };
}

export default function CategoryPage({ params }: PageProps) {
  return <CategoryPageClient />;
}
