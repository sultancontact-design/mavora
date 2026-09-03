'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import MavoraLogo from '@/components/common/MavoraLogo';
import ListingCard from '@/components/listing/ListingCard';
import { Loader2, Heart, ArrowLeft } from 'lucide-react';
import type { Listing } from '@/lib/types';

export default function FavoritesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Fetch favorites
  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavorites(Array.isArray(data) ? data : data.favorites || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald" />
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <MavoraLogo size="md" />
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Heart className="size-8 text-red-500" />
              {t('common.favorites')}
            </h1>
            <p className="text-muted-foreground">{t('favorites.saved_items')}</p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">{t('favorites.no_favorites_yet')}</h3>
            <p className="text-muted-foreground mb-6">{t('favorites.start_saving')}</p>
            <Link href="/listings">
              <Button className="bg-emerald hover:bg-emerald/90">
                {t('favorites.browse_listings')}
              </Button>
            </Link>
          </div>
        ) : (
          /* Favorites Grid */
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {favorites.length} {t('favorites.items_saved')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((listing) => (
                <ListingCard key={listing.id} listing={listing} showFavoriteButton={false} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
