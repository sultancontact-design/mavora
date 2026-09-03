'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore } from '@/stores/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Users,
  FileText,
  Globe,
  Grid3X3,
  ShieldAlert,
  Loader2,
  Eye,
  Search,
  Check,
  X,
  Archive,
  AlertTriangle,
  UserCheck,
  Activity,
  ClipboardList,
  Settings as SettingsIcon,
  HeartPulse,
  Save,
  Tag,
} from 'lucide-react';
import AdminCategoryFields from './AdminCategoryFields';
import type { Listing, Locale, AuditLog } from '@/lib/types';

interface AdminStats {
  total_users: number;
  total_listings: number;
  total_countries: number;
  total_categories: number;
}

interface AdminUser {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_suspended: boolean;
  created_at: string;
  listing_count: number;
}

interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: { database: boolean; storage: boolean; auth: boolean };
  timestamp: string;
  uptime: number;
}

interface AdminReport {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter: { id: string; display_name: string; avatar_url: string | null } | null;
  listing: { title: string; seller_id: string } | null;
}

function getLocalizedListingField(
  listing: { title_ar?: string; title_fr?: string; title_en?: string },
  locale: Locale
): string {
  switch (locale) {
    case 'ar': return listing.title_ar || listing.title_en || listing.title_fr || '';
    case 'fr': return listing.title_fr || listing.title_en || listing.title_ar || '';
    default: return listing.title_en || listing.title_ar || listing.title_fr || '';
  }
}

function getReasonDisplay(reason: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    scam: t('report.reason_scam_display'),
    prohibited: t('report.reason_prohibited_display'),
    duplicate: t('report.reason_duplicate_display'),
    wrong_category: t('report.reason_wrong_category_display'),
    other: t('report.reason_other_display'),
  };
  return map[reason] ?? reason;
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'active': return 'default';
    case 'draft': return 'secondary';
    case 'archived': return 'outline';
    case 'sold': return 'secondary';
    case 'reserved': return 'outline';
    case 'rejected': return 'destructive';
    case 'pending_review': return 'outline';
    default: return 'secondary';
  }
}

function formatDate(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminDashboard() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { navigateHome } = useNavigationStore();

  // Overview data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);

  // Listings tab data
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [listingsSearch, setListingsSearch] = useState('');
  const [listingsLoading, setListingsLoading] = useState(false);

  // Users tab data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Reports tab data
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Audit tab data
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Settings tab data
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthCheck | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // General
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const isRtl = locale === 'ar';

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, listingsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/listings?per_page=10&sort_by=newest'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setRecentListings(listingsData.data || []);
      }
    } catch {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllListings = useCallback(async (search?: string) => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({
        per_page: '50',
        sort_by: 'newest',
      });
      if (search) params.set('search', search);
      // Fetch all statuses - use admin approach
      const res = await fetch(`/api/admin/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAllListings(data.data || []);
      } else {
        // Fallback: use regular listings endpoint
        const fallbackRes = await fetch(`/api/listings?${params.toString()}`);
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setAllListings(data.data || []);
        }
      }
    } catch {
      // silent
    } finally {
      setListingsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch {
      // silent
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.data || []);
      }
    } catch {
      // silent
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs?per_page=50');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.data || []);
      }
    } catch {
      // silent
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.data || []);
      }
    } catch {
      // silent
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch {
      // silent
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const handleSaveSetting = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      const res = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? { ...s, value } : s))
        );
        setEditingKey(null);
      }
    } catch {
      // silent
    } finally {
      setSavingKey(null);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  useEffect(() => {
    if (activeTab === 'listings') fetchAllListings(listingsSearch || undefined);
  }, [activeTab, fetchAllListings, listingsSearch]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
  }, [activeTab, fetchReports]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchAuditLogs]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
      fetchHealth();
    }
  }, [activeTab, fetchSettings, fetchHealth]);

  const handleModerate = async (listingId: string, action: 'approve' | 'reject' | 'archive') => {
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, action }),
      });
      if (res.ok) {
        setAllListings((prev) =>
          prev.map((l) =>
            l.id === listingId
              ? { ...l, status: action === 'approve' ? 'active' : action === 'reject' ? 'rejected' : 'archived' }
              : l
          )
        );
        setRecentListings((prev) =>
          prev.map((l) =>
            l.id === listingId
              ? { ...l, status: action === 'approve' ? 'active' : action === 'reject' ? 'rejected' : 'archived' }
              : l
          )
        );
      }
    } catch {
      // silent
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, action }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch {
      // silent
    }
  };

  // Auth guard
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center gap-4 px-4">
        <ShieldAlert className="size-16 text-destructive" />
        <p className="text-lg font-semibold text-foreground">{t('admin.access_denied')}</p>
        <Button variant="outline" onClick={navigateHome}>
          <ArrowLeft className={isRtl ? 'ms-2 rotate-180' : 'me-2'} />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      label: t('admin.total_users'),
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      label: t('admin.total_listings'),
      value: stats?.total_listings ?? 0,
      icon: FileText,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      label: t('admin.total_countries'),
      value: stats?.total_countries ?? 0,
      icon: Globe,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      label: t('admin.total_categories'),
      value: stats?.total_categories ?? 0,
      icon: Grid3X3,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={navigateHome}>
            <ArrowLeft className={isRtl ? 'size-5 rotate-180' : 'size-5'} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t('admin.title')}
            </h1>
          </div>
        </div>
        {loading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex w-full sm:w-fit">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="size-4" />
            <span className="hidden sm:inline">{t('admin.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="listings" className="gap-1.5">
            <FileText className="size-4" />
            <span className="hidden sm:inline">{t('admin.listings_tab')}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="size-4" />
            <span className="hidden sm:inline">{t('admin.users_tab')}</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <AlertTriangle className="size-4" />
            <span className="hidden sm:inline">{t('admin.reports_tab')}</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ClipboardList className="size-4" />
            <span className="hidden sm:inline">{t('audit.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <SettingsIcon className="size-4" />
            <span className="hidden sm:inline">{t('admin.settings_tab')}</span>
          </TabsTrigger>
          <TabsTrigger value="category-fields" className="gap-1.5">
            <Tag className="size-4" />
            <span className="hidden sm:inline">{t('admin.category_fields_tab')}</span>
          </TabsTrigger>
        </TabsList>

        {/* ======================== OVERVIEW TAB ======================== */}
        <TabsContent value="overview">
          {/* Stat Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                        <Icon className={`size-5 ${stat.color}`} />
                      </div>
                      <div className="min-w-0">
                        {loading ? (
                          <Skeleton className="mb-1 h-4 w-16" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                        )}
                        <p className="truncate text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="bg-[#0f2b46] px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-base font-semibold text-white sm:text-lg">
                {t('admin.recent_activity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-6">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="ms-auto h-4 w-20" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : recentListings.length === 0 ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <FileText className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('listings.no_listings')}</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="hidden divide-y sm:block">
                    <div className="grid grid-cols-[1fr_120px_100px_80px] gap-4 border-b bg-muted/30 px-6 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span>{t('admin.listing_title')}</span>
                      <span>{t('common.price')}</span>
                      <span>{t('admin.status')}</span>
                      <span>{t('admin.views')}</span>
                    </div>
                    {recentListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="grid grid-cols-[1fr_120px_100px_80px] items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/20"
                      >
                        <span className="truncate text-sm font-medium text-foreground">
                          {getLocalizedListingField(listing, locale)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {listing.price
                            ? `${listing.price.toLocaleString()} ${(listing.currency_code || 'MAD')}`
                            : t('common.negotiable')}
                        </span>
                        <Badge variant={statusBadgeVariant(listing.status)} className="w-fit justify-center text-xs">
                          {t(`listing.status_${listing.status}` as keyof typeof import('@/i18n/en.json'))}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="size-3" />
                          {listing.view_count ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="divide-y sm:hidden">
                    {recentListings.map((listing) => (
                      <div key={listing.id} className="space-y-2 px-4 py-3">
                        <p className="truncate text-sm font-medium text-foreground">
                          {getLocalizedListingField(listing, locale)}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-emerald-600">
                            {listing.price
                              ? `${listing.price.toLocaleString()} ${(listing.currency_code || 'MAD')}`
                              : t('common.negotiable')}
                          </span>
                          <Badge variant={statusBadgeVariant(listing.status)} className="text-xs">
                            {t(`listing.status_${listing.status}` as keyof typeof import('@/i18n/en.json'))}
                          </Badge>
                          <span className={isRtl ? 'ms-auto' : 'ms-auto flex items-center gap-1 text-xs text-muted-foreground'}>
                            <Eye className="size-3" />
                            {listing.view_count ?? 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== LISTINGS TAB ======================== */}
        <TabsContent value="listings">
          <Card>
            <CardHeader className="bg-[#0f2b46] px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base font-semibold text-white sm:text-lg">
                  {t('admin.listings_tab')}
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className={`absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ${isRtl ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={t('admin.search')}
                    value={listingsSearch}
                    onChange={(e) => setListingsSearch(e.target.value)}
                    className={`${isRtl ? 'pr-9' : 'pl-9'} h-9 bg-white/90 text-foreground placeholder:text-white/50`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {listingsLoading ? (
                <div className="divide-y">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-6">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : allListings.length === 0 ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <FileText className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('admin.no_listings_all')}</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {/* Desktop Table */}
                  <div className="hidden divide-y sm:block">
                    <div className="grid grid-cols-[1fr_100px_90px_70px_200px] gap-3 border-b bg-muted/30 px-6 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span>{t('admin.listing_title')}</span>
                      <span>{t('admin.seller')}</span>
                      <span>{t('admin.status')}</span>
                      <span>{t('admin.views')}</span>
                      <span className={isRtl ? 'text-left' : 'text-right'}>{t('admin.actions')}</span>
                    </div>
                    {allListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="grid grid-cols-[1fr_100px_90px_70px_200px] items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/20"
                      >
                        <span className="truncate text-sm font-medium text-foreground">
                          {getLocalizedListingField(listing, locale)}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {(listing.seller as Record<string, string>)?.display_name ?? '—'}
                        </span>
                        <Badge variant={statusBadgeVariant(listing.status)} className="w-fit justify-center text-xs">
                          {t(`listing.status_${listing.status}` as keyof typeof import('@/i18n/en.json'))}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="size-3" />
                          {listing.view_count ?? 0}
                        </span>
                        <div className={`flex items-center gap-1 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleModerate(listing.id, 'approve')}
                          >
                            <Check className="size-3" />
                            {t('admin.approve')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleModerate(listing.id, 'reject')}
                          >
                            <X className="size-3" />
                            {t('admin.reject')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-muted-foreground hover:bg-muted"
                            onClick={() => handleModerate(listing.id, 'archive')}
                          >
                            <Archive className="size-3" />
                            {t('admin.archive')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mobile List */}
                  <div className="divide-y sm:hidden">
                    {allListings.map((listing) => (
                      <div key={listing.id} className="space-y-2 px-4 py-3">
                        <p className="truncate text-sm font-medium text-foreground">
                          {getLocalizedListingField(listing, locale)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusBadgeVariant(listing.status)} className="text-xs">
                            {t(`listing.status_${listing.status}` as keyof typeof import('@/i18n/en.json'))}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="size-3" />{listing.view_count ?? 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(listing.seller as Record<string, string>)?.display_name ?? '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs text-emerald-600"
                            onClick={() => handleModerate(listing.id, 'approve')}
                          >
                            <Check className="size-3" />{t('admin.approve')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs text-red-600"
                            onClick={() => handleModerate(listing.id, 'reject')}
                          >
                            <X className="size-3" />{t('admin.reject')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleModerate(listing.id, 'archive')}
                          >
                            <Archive className="size-3" />{t('admin.archive')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== USERS TAB ======================== */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="bg-[#0f2b46] px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-base font-semibold text-white sm:text-lg">
                {t('admin.users_tab')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="divide-y">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-6">
                      <Skeleton className="size-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="ms-auto h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <Users className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('admin.no_users')}</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="hidden divide-y sm:block">
                    <div className="grid grid-cols-[1fr_80px_100px_120px] gap-4 border-b bg-muted/30 px-6 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span>{t('auth.display_name')}</span>
                      <span>{t('admin.listing_count')}</span>
                      <span>{t('admin.status')}</span>
                      <span>{t('admin.registered')}</span>
                    </div>
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="grid grid-cols-[1fr_80px_100px_120px] items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/20"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                            {u.display_name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <span className="truncate text-sm font-medium text-foreground">{u.display_name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{u.listing_count}</span>
                        <div className="flex items-center gap-1.5">
                          {u.is_verified && <Badge variant="default" className="bg-emerald-600 text-xs">✓</Badge>}
                          {u.is_suspended && <Badge variant="destructive" className="text-xs">✗</Badge>}
                          {!u.is_verified && !u.is_suspended && <Badge variant="secondary" className="text-xs">—</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(u.created_at, locale)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="divide-y sm:hidden">
                    {users.map((u) => (
                      <div key={u.id} className="space-y-2 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                            {u.display_name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{u.display_name}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(u.created_at, locale)}</p>
                          </div>
                          <div className="ms-auto flex items-center gap-1">
                            {u.is_verified && <Badge variant="default" className="bg-emerald-600 text-xs">✓</Badge>}
                            {u.is_suspended && <Badge variant="destructive" className="text-xs">✗</Badge>}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{u.listing_count} {t('admin.listing_count')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== REPORTS TAB ======================== */}
        <TabsContent value="reports">
          <Card>
            <CardHeader className="bg-[#0f2b46] px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-base font-semibold text-white sm:text-lg">
                {t('admin.reports_tab')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {reportsLoading ? (
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-6">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="ms-auto h-8 w-40" />
                    </div>
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <AlertTriangle className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('admin.no_reports')}</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="hidden divide-y sm:block">
                    <div className="grid grid-cols-[1fr_120px_120px_140px] gap-3 border-b bg-muted/30 px-6 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span>{t('admin.target')}</span>
                      <span>{t('admin.reason')}</span>
                      <span>{t('admin.reporter')}</span>
                      <span className={isRtl ? 'text-left' : 'text-right'}>{t('admin.actions')}</span>
                    </div>
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="grid grid-cols-[1fr_120px_120px_140px] items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/20"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {report.listing?.title ?? report.target_id}
                          </p>
                          <p className="text-xs text-muted-foreground">{report.target_type}</p>
                        </div>
                        <Badge variant="outline" className="w-fit text-xs">
                          {getReasonDisplay(report.reason, t)}
                        </Badge>
                        <span className="truncate text-xs text-muted-foreground">
                          {report.reporter?.display_name ?? '—'}
                        </span>
                        <div className={`flex items-center gap-1 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleReportAction(report.id, 'resolve')}
                          >
                            <UserCheck className="size-3" />
                            {t('admin.resolve')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-muted-foreground hover:bg-muted"
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                          >
                            <X className="size-3" />
                            {t('admin.dismiss')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="divide-y sm:hidden">
                    {reports.map((report) => (
                      <div key={report.id} className="space-y-2 px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {report.listing?.title ?? report.target_id}
                          </p>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {getReasonDisplay(report.reason, t)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.reporter')}: {report.reporter?.display_name ?? '—'}
                        </p>
                        {report.description && (
                          <p className="text-xs text-muted-foreground/80 italic">{report.description}</p>
                        )}
                        <div className="flex items-center gap-1 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs text-emerald-600"
                            onClick={() => handleReportAction(report.id, 'resolve')}
                          >
                            <UserCheck className="size-3" />{t('admin.resolve')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                          >
                            <X className="size-3" />{t('admin.dismiss')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== AUDIT TAB ======================== */}
        <TabsContent value="audit">
          <Card>
            <CardHeader className="bg-[#0f2b46] px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-base font-semibold text-white sm:text-lg">
                {t('audit.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {auditLoading ? (
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-6">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="ms-auto h-4 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('admin.no_audit_logs')}</p>
                </div>
              ) : (
                <div className="max-h-[32rem] overflow-y-auto">
                  {/* Desktop table */}
                  <div className="hidden divide-y sm:block">
                    <div className="grid grid-cols-[1fr_140px_120px_140px_100px] gap-4 border-b bg-muted/30 px-6 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span>{t('audit.actor')}</span>
                      <span>{t('audit.action')}</span>
                      <span>{t('audit.resource')}</span>
                      <span>{t('audit.ip')}</span>
                      <span>{t('admin.created_at')}</span>
                    </div>
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="grid grid-cols-[1fr_140px_120px_140px_100px] items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/20"
                      >
                        <span className="truncate text-sm font-medium text-foreground">
                          {log.actor?.display_name || '—'}
                        </span>
                        <span className="text-sm text-muted-foreground">{log.action}</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {log.resource_type}{log.resource_id ? ` / ${log.resource_id.slice(0, 8)}…` : ''}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {log.ip_address || '—'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(log.created_at, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Mobile cards */}
                  <div className="divide-y sm:hidden">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="space-y-1 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-medium text-foreground">
                            {log.actor?.display_name || '—'}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(log.created_at, locale)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('audit.action')}: {log.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('audit.resource')}: {log.resource_type}
                        </p>
                        {log.ip_address && (
                          <p className="text-xs font-mono text-muted-foreground/70">
                            {t('audit.ip')}: {log.ip_address}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== SETTINGS TAB ======================== */}
        <TabsContent value="settings">
          {/* Health Status Card */}
          <Card className="mb-6">
            <CardHeader className="bg-[#0f2b46] px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2">
                <HeartPulse className="size-5 text-white" />
                <CardTitle className="text-base font-semibold text-white sm:text-lg">
                  {t('admin.health_status')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {healthLoading ? (
                <div className="flex gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 flex-1 rounded-lg" />
                  ))}
                </div>
              ) : healthData ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                  {/* Status */}
                  <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                    <span
                      className={`mb-1 text-sm font-bold ${healthData.status === 'healthy' ? 'text-emerald-600' : healthData.status === 'degraded' ? 'text-amber-600' : 'text-red-600'}`}
                    >
                      {t(`admin.health_${healthData.status}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">Status</span>
                  </div>
                  {/* Database */}
                  <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                    <Check className={`mb-1 size-5 ${healthData.checks.database ? 'text-emerald-600' : 'text-red-600'}`} />
                    <span className="text-xs text-muted-foreground">{t('admin.health_database')}</span>
                  </div>
                  {/* Storage */}
                  <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                    <Check className={`mb-1 size-5 ${healthData.checks.storage ? 'text-emerald-600' : 'text-red-600'}`} />
                    <span className="text-xs text-muted-foreground">{t('admin.health_storage')}</span>
                  </div>
                  {/* Auth */}
                  <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                    <Check className={`mb-1 size-5 ${healthData.checks.auth ? 'text-emerald-600' : 'text-red-600'}`} />
                    <span className="text-xs text-muted-foreground">{t('admin.health_auth')}</span>
                  </div>
                  {/* Uptime */}
                  <div className="col-span-2 flex flex-col items-center justify-center rounded-lg border p-3 lg:col-span-1">
                    <span className="mb-1 text-sm font-semibold text-foreground">
                      {Math.floor(healthData.uptime / 3600)}h {Math.floor((healthData.uptime % 3600) / 60)}m
                    </span>
                    <span className="text-xs text-muted-foreground">{t('admin.health_uptime')}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Settings Table */}
          <Card>
            <CardHeader className="bg-[#0f2b46] px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-base font-semibold text-white sm:text-lg">
                {t('admin.settings_tab')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {settingsLoading ? (
                <div className="divide-y">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-6">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="ms-auto h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : settings.length === 0 ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <SettingsIcon className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t('admin.no_settings')}</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {/* Desktop table */}
                  <div className="hidden divide-y sm:block">
                    <div className="grid grid-cols-[160px_1fr_100px_1fr_100px] gap-3 border-b bg-muted/30 px-6 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span>{t('admin.setting_key')}</span>
                      <span>{t('admin.setting_value')}</span>
                      <span>{t('admin.setting_type')}</span>
                      <span>{t('admin.setting_description')}</span>
                      <span className={isRtl ? 'text-left' : 'text-right'}>{t('admin.actions')}</span>
                    </div>
                    {settings.map((setting) => (
                      <div
                        key={setting.id}
                        className="grid grid-cols-[160px_1fr_100px_1fr_100px] items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/20"
                      >
                        <span className="truncate text-sm font-mono font-medium text-foreground">{setting.key}</span>
                        {editingKey === setting.key ? (
                          <div className="flex items-center gap-2">
                            {setting.value_type === 'boolean' ? (
                              <Switch
                                checked={editValue === 'true'}
                                onCheckedChange={(checked) => setEditValue(String(checked))}
                              />
                            ) : setting.value_type === 'json' ? (
                              <Textarea
                                className="min-h-[60px] text-sm"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                              />
                            ) : (
                              <Input
                                type={setting.value_type === 'number' ? 'number' : 'text'}
                                className="h-8 text-sm"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSetting(setting.key, editValue);
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <span className="truncate text-sm text-muted-foreground">{setting.value}</span>
                        )}
                        <Badge variant="outline" className="w-fit text-xs">{setting.value_type}</Badge>
                        <span className="truncate text-xs text-muted-foreground">{setting.description ?? '—'}</span>
                        <div className={`flex items-center gap-1 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                          {editingKey === setting.key ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                disabled={savingKey === setting.key}
                                onClick={() => handleSaveSetting(setting.key, editValue)}
                              >
                                {savingKey === setting.key ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                                {t('common.save')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-muted-foreground hover:bg-muted"
                                onClick={() => setEditingKey(null)}
                              >
                                <X className="size-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => { setEditingKey(setting.key); setEditValue(setting.value); }}
                            >
                              {t('admin.edit')}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mobile cards */}
                  <div className="divide-y sm:hidden">
                    {settings.map((setting) => (
                      <div key={setting.id} className="space-y-2 px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-mono font-medium text-foreground">{setting.key}</span>
                          <Badge variant="outline" className="shrink-0 text-xs">{setting.value_type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{setting.description ?? ''}</p>
                        {editingKey === setting.key ? (
                          <div className="space-y-2">
                            {setting.value_type === 'boolean' ? (
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={editValue === 'true'}
                                  onCheckedChange={(checked) => setEditValue(String(checked))}
                                />
                                <span className="text-sm text-muted-foreground">{editValue}</span>
                              </div>
                            ) : setting.value_type === 'json' ? (
                              <Textarea
                                className="min-h-[60px] text-sm"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                              />
                            ) : (
                              <Input
                                type={setting.value_type === 'number' ? 'number' : 'text'}
                                className="h-8 text-sm"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                              />
                            )}
                            <div className="flex items-center gap-1 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs text-emerald-600"
                                disabled={savingKey === setting.key}
                                onClick={() => handleSaveSetting(setting.key, editValue)}
                              >
                                {savingKey === setting.key ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                                {t('common.save')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => setEditingKey(null)}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="truncate text-sm text-foreground">{setting.value}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-xs text-blue-600"
                              onClick={() => { setEditingKey(setting.key); setEditValue(setting.value); }}
                            >
                              {t('admin.edit')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== CATEGORY FIELDS TAB ======================== */}
        <TabsContent value="category-fields">
          <AdminCategoryFields />
        </TabsContent>
      </Tabs>
    </div>
  );
}
