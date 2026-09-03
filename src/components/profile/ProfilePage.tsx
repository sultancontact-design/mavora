'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  FileText,
  Eye,
  Clock,
  Pencil,
  Plus,
  User as UserIcon,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore } from '@/stores/navigation';
import type { Listing, Locale, User as UserType } from '@/lib/types';

// ─── Helpers ────────────────────────────────────────────────────────

function timeAgo(dateStr: string, locale: Locale): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const months = Math.floor(days / 30);

  if (locale === 'ar') {
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 30) return `منذ ${days} يوم`;
    return `منذ ${months} شهر`;
  }
  if (locale === 'fr') {
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 30) return `il y a ${days}j`;
    return `il y a ${months}m`;
  }
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${months}mo ago`;
}

function formatDate(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
  };
  return date.toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US', options);
}

// ─── Component ──────────────────────────────────────────────────────

export default function ProfilePage() {
  const { t, locale } = useTranslation();
  const { user, setUser } = useAuthStore();
  const { navigateHome, navigateCreateListing, navigateDetail } = useNavigationStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');

  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // ── Fetch user listings ──
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setListingsLoading(true);
    fetch(`/api/listings?seller_id=${user.id}&per_page=50`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setUserListings(data.data ?? []);
        }
      })
      .catch(() => { if (!cancelled) setUserListings([]); })
      .finally(() => { if (!cancelled) setListingsLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  // ── Edit handlers ──
  const startEditing = useCallback(() => {
    if (!user) return;
    setEditName(user.display_name);
    setEditPhone(user.phone ?? '');
    setEditBio(user.bio ?? '');
    setIsEditing(true);
  }, [user]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const saveProfile = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editName,
          phone: editPhone || null,
          bio: editBio || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      const { profile: updatedProfile } = await res.json();
      setUser(updatedProfile);
      setIsEditing(false);
      toast.success(t('profile.save_success'));
    } catch {
      toast.error(t('profile.save_error'));
    } finally {
      setIsSaving(false);
    }
  }, [editName, editPhone, editBio, setUser, t]);

  // ── Guard ──
  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={navigateHome}
        >
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Button>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">{t('error.unauthorized')}</p>
        </div>
      </div>
    );
  }

  const userInitials = user.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={navigateHome}
      >
        <ArrowLeft className="size-4" />
        {t('common.back')}
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Sidebar: Profile Card ── */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pb-16 pt-8 text-center">
              <Avatar className="mx-auto size-24 ring-4 ring-white/20">
                <AvatarImage src={user.avatar_url} alt={user.display_name} />
                <AvatarFallback className="bg-white/20 text-2xl font-bold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardContent className="relative px-6 pb-6 pt-12">
              {!isEditing ? (
                <>
                  <div className="mb-4 text-center">
                    <h2 className="text-xl font-bold text-foreground">{user.display_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>{t('profile.member_since')} {formatDate(user.created_at, locale)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="size-4" />
                      <span>{userListings.length} {t('profile.listings_count')}</span>
                    </div>
                    {user.is_verified && (
                      <div className="flex items-center gap-2 text-[#0E9F6E]">
                        <CheckCircle className="size-4" />
                        <span>{t('common.active')}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="mt-6 w-full gap-2"
                    onClick={startEditing}
                  >
                    <Pencil className="size-4" />
                    {t('profile.edit_profile')}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-sm font-medium">
                      {t('profile.display_name')}
                    </Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-sm font-medium">
                      {t('profile.phone')}
                    </Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bio" className="text-sm font-medium">
                      {t('profile.bio')}
                    </Label>
                    <Textarea
                      id="edit-bio"
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder={t('profile.bio_placeholder')}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      {t('profile.cancel_edit')}
                    </Button>
                    <Button
                      className="flex-1 bg-[#0E9F6E] text-white hover:bg-[#0E9F6E]/90"
                      onClick={saveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="me-2 size-4 animate-spin" />
                      ) : null}
                      {isSaving ? t('profile.saving') : t('common.save')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Main: My Listings ── */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {t('profile.my_listings_title')}
            </h2>
            <Button
              size="sm"
              className="gap-1.5 bg-[#0E9F6E] text-white hover:bg-[#0E9F6E]/90"
              onClick={navigateCreateListing}
            >
              <Plus className="size-4" />
              {t('common.post_ad')}
            </Button>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-3">
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="mb-1 h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : userListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {userListings.map((listing) => {
                const primaryImage = listing.media?.find((m) => m.is_primary) ?? listing.media?.[0];
                return (
                  <button
                    key={listing.id}
                    onClick={() => navigateDetail(listing.id)}
                    className="group overflow-hidden rounded-xl border border-border bg-card text-start transition-all duration-200 hover:border-[#0E9F6E]/40 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={listing.title}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground/30">
                          <UserIcon className="size-10" />
                        </div>
                      )}
                      <div className="absolute end-2 top-2">
                        <Badge
                          variant="secondary"
                          className={
                            listing.status === 'active'
                              ? 'border-0 bg-[#0E9F6E]/10 text-[#0E9F6E]'
                              : 'border-0 bg-muted text-muted-foreground'
                          }
                        >
                          {t(`common.${listing.status}`)}
                        </Badge>
                      </div>
                      {listing.price != null && listing.currency && (
                        <div className="absolute bottom-0 end-0 start-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
                          <span className="text-base font-bold text-white">
                            {listing.currency.symbol}{listing.price.toLocaleString(locale)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-[#0E9F6E]">
                        {listing.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {timeAgo(listing.created_at, locale)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="size-3" />
                          {listing.view_count}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
              <FileText className="mb-3 size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t('profile.no_listings')}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={navigateCreateListing}
              >
                <Plus className="size-4" />
                {t('profile.post_first')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
