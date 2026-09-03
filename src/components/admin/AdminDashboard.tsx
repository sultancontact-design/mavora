'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  Loader2,
  Eye,
  Search,
  Check,
  X,
  Archive,
  Activity,
  ClipboardList,
  Settings as SettingsIcon,
  TrendingUp,
  TrendingDown,
  Package,
  CreditCard,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import UserManagement from './UserManagement';
import ListingManagement from './ListingManagement';
import ReportManagement from './ReportManagement';
import CategoryManagement from './CategoryManagement';
import PaymentManagement from './PaymentManagement';
import AuditLogViewer from './AuditLogViewer';
import SettingsPanel from './SettingsPanel';
import AdminCategoryFields from './AdminCategoryFields';

// Types
interface AdminStats {
  overview: {
    total_users: number;
    total_listings: number;
    total_revenue: number;
    pending_reports: number;
  };
  users: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
  };
  listings: {
    today: number;
    this_week: number;
    this_month: number;
    active: number;
    pending: number;
  };
  charts: {
    listings: { date: string; count: number }[];
    users: { date: string; count: number }[];
  };
}

interface RecentListing {
  id: string;
  title: string;
  status: string;
  seller_name?: string;
  created_at: string;
}

interface RecentReport {
  id: string;
  reason: string;
  target_type: string;
  reporter_name?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { t, locale } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, listingsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/listings?per_page=5&status=pending_review'),
        fetch('/api/admin/reports'),
      ]);

      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats');
      }

      const statsData = await statsRes.json();
      setStats(statsData);

      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setRecentListings(
          (listingsData.data || []).map((l: Record<string, unknown>) => ({
            id: l.id as string,
            title: l.title as string,
            status: l.status as string,
            seller_name: ((l.seller as Record<string, unknown> | undefined)?.display_name) as string || undefined,
            created_at: l.created_at as string,
          }))
        );
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setRecentReports(
          (reportsData.data || []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            reason: r.reason as string,
            target_type: r.target_type as string,
            reporter_name: ((r.reporter as Record<string, unknown> | undefined)?.display_name) as string || undefined,
            created_at: r.created_at as string,
          }))
        );
      }
    } catch (err) {
      console.error('Admin dashboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && ['admin', 'super_admin', 'moderator'].includes(user.role)) {
      fetchStats();
    }
  }, [user, fetchStats]);

  // Check access
  if (!user || !['admin', 'super_admin', 'moderator'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('admin.access_denied')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don&apos;t have permission to access this area.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 ml-2" />
                {t('common.back')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending_review: 'secondary',
      rejected: 'destructive',
      archived: 'outline',
      draft: 'outline',
    };
    
    const labels: Record<string, string> = {
      active: t('common.active'),
      pending_review: 'pending',
      rejected: 'rejected',
      archived: 'archived',
      draft: t('common.draft'),
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                {t('admin.title')}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Platform management dashboard
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {user.role}
              </Badge>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'ml-2 mr-0' : 'mr-2 ml-0'}`} />
                  {t('common.back')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-9 w-full h-auto gap-2">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <Activity className="h-4 w-4 hidden sm:inline mr-1" />
              {t('admin.overview')}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 hidden sm:inline mr-1" />
              {t('admin.users_tab')}
            </TabsTrigger>
            <TabsTrigger value="listings" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 hidden sm:inline mr-1" />
              {t('admin.listings_tab')}
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm">
              <AlertTriangle className="h-4 w-4 hidden sm:inline mr-1" />
              {t('admin.reports_tab')}
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm">
              <Package className="h-4 w-4 hidden sm:inline mr-1" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="category-fields" className="text-xs sm:text-sm">
              Fields
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">
              <CreditCard className="h-4 w-4 hidden sm:inline mr-1" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4 hidden sm:inline mr-1" />
              {t('admin.audit_tab')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              <SettingsIcon className="h-4 w-4 hidden sm:inline mr-1" />
              {t('admin.settings_tab')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="pt-6 text-center text-red-500">
                  {error}
                  <Button variant="outline" className="mt-4" onClick={fetchStats}>
                    {t('common.retry')}
                  </Button>
                </CardContent>
              </Card>
            ) : stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title={t('admin.total_users')}
                    value={stats.users.total.toLocaleString()}
                    subtitle={`${stats.users.today} today`}
                    icon={<Users className="h-6 w-6 text-blue-600" />}
                    trend={{ value: stats.users.this_week, positive: true }}
                    color="blue"
                  />
                  <StatCard
                    title={t('admin.total_listings')}
                    value={stats.listings.active.toLocaleString()}
                    subtitle={`${stats.listings.pending} pending review`}
                    icon={<FileText className="h-6 w-6 text-green-600" />}
                    trend={{ value: stats.listings.today, positive: true }}
                    color="green"
                  />
                  <StatCard
                    title="Revenue"
                    value={`$${stats.overview.total_revenue.toFixed(2)}`}
                    subtitle="Total revenue"
                    icon={<DollarSign className="h-6 w-6 text-yellow-600" />}
                    color="yellow"
                  />
                  <StatCard
                    title="Pending Reports"
                    value={stats.overview.pending_reports.toString()}
                    subtitle="Need attention"
                    icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
                    trend={{ value: stats.overview.pending_reports, positive: false }}
                    color="red"
                  />
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Pending Listings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center justify-between">
                        <span>{t('admin.recent_listings')} - Pending Review</span>
                        <Badge variant="secondary">{recentListings.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentListings.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                          No pending listings
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {recentListings.map((listing) => (
                            <div
                              key={listing.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {listing.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {listing.seller_name} • {formatDate(listing.created_at)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {getStatusBadge(listing.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Reports */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center justify-between">
                        <span>{t('admin.reports_tab')}</span>
                        <Badge variant="destructive">{recentReports.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentReports.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                          {t('admin.no_reports')}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {recentReports.map((report) => (
                            <div
                              key={report.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                  {report.reason.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {report.target_type} • {report.reporter_name} • {formatDate(report.created_at)}
                                </p>
                              </div>
                              <Badge variant="outline" className="ml-4 text-red-600 border-red-300">
                                New
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Chart Placeholder */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      {t('admin.recent_activity')} - Last 30 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-around gap-1 px-4">
                      {(stats.charts.listings || []).slice(-30).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-blue-500 dark:bg-blue-400 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-300 min-h-[2px]"
                          style={{ height: `${Math.max(2, (item.count / Math.max(...stats.charts.listings.map(l => l.count))) * 100)}%` }}
                          title={`${item.date}: ${item.count} listings`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400 px-4">
                      <span>{stats.charts.listings[0]?.date || ''}</span>
                      <span>{stats.charts.listings[stats.charts.listings.length - 1]?.date || ''}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="listings">
            <ListingManagement />
          </TabsContent>

          <TabsContent value="reports">
            <ReportManagement onActionComplete={fetchStats} />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="category-fields">
            <AdminCategoryFields />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogViewer />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ title, value, subtitle, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30',
    green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30',
    yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30',
    red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30',
  };

  return (
    <Card className={`border-2 ${colorClasses[color]}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            <div className="flex items-center gap-2">
              {trend && (
                <span className={`flex items-center text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  +{trend.value}
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type { AdminStats };
