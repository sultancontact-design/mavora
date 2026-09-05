'use client';

import React, { useEffect, useState, useCallback, Suspense, lazy, ComponentType } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  Settings,
  BarChart3,
  Shield,
  Tag,
  CreditCard,
  MessageSquare,
  Activity,
  Crown,
  Coins,
  Zap,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Bell,
  Wallet,
  Flag,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

// Lazy loaded components for code splitting
const UserManagement = lazy(() => import('./UserManagement').then(m => ({ default: m.default })));
const ListingManagement = lazy(() => import('./ListingManagement').then(m => ({ default: m.default })));
const ReportManagement = lazy(() => import('./ReportManagement').then(m => ({ default: m.default })));
const CategoryManagement = lazy(() => import('./CategoryManagement').then(m => ({ default: m.default })));
const PaymentManagement = lazy(() => import('./PaymentManagement').then(m => ({ default: m.default })));
const AuditLogViewer = lazy(() => import('./AuditLogViewer').then(m => ({ default: m.default })));
const SettingsPanel = lazy(() => import('./SettingsPanel').then(m => ({ default: m.default })));
const ModerationQueue = lazy(() => import('./ModerationQueue').then(m => ({ default: m.default })));

// Types
interface AdminStats {
  success: boolean;
  overview: {
    total_users: number;
    total_listings: number;
    total_revenue: number;
    pending_reports: number;
    total_wallet_balance: number;
    active_listings: number;
    categories_count: number;
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
    total: number;
  };
  categories: Array<{ id: string; name: string; nameAr?: string; slug: string }>;
  recent_listings: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    price: number | null;
    currencyCode: string;
  }>;
  revenue: {
    total: number;
    monthly: number;
  };
  wallets: {
    total_balance: number;
  };
}

// Sidebar Navigation Items
const navItems = [
  { id: 'overview', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'users', label: 'المستخدمون', icon: Users },
  { id: 'listings', label: 'الإعلانات', icon: FileText },
  { id: 'moderation', label: 'المراجعة', icon: Shield },
  { id: 'reports', label: 'البلاغات', icon: AlertTriangle },
  { id: 'categories', label: 'التصنيفات', icon: Tag },
  { id: 'payments', label: 'المدفوعات', icon: CreditCard },
  { id: 'subscriptions', label: 'الاشتراكات', icon: Crown },
  { id: 'promotions', label: 'الترويجات', icon: Zap },
  { id: 'tokens', label: 'الرصيد والنقاط', icon: Coins },
  { id: 'messages', label: 'الرسائل', icon: MessageSquare },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { id: 'audit', label: 'سجلات التدقيق', icon: Activity },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

// Loading fallback component
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-4" />
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    </div>
  );
}

// Error boundary fallback
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">حدث خطأ في تحميل هذا القسم</h3>
          <Button onClick={onRetry} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper for lazy components with error handling
function LazyTab({ 
  component: Component, 
  onError 
}: { 
  component: ComponentType; 
  onError: () => void;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <ErrorFallback onRetry={() => setHasError(false)} />;
  }

  return (
    <Suspense fallback={<TabLoader />}>
      <ErrorCatcher onError={() => setHasError(true)}>
        <Component />
      </ErrorCatcher>
    </Suspense>
  );
}

// Error catcher component
class ErrorCatcher extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function SuperAdminDashboard() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      setError(null);
      const statsRes = await fetch('/api/admin/stats?period=month', {
        signal: controller.signal,
      });
      
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData);
      } else {
        throw new Error(statsData.error || 'Invalid response');
      }
    } catch (err) {
      console.error('Admin dashboard error:', err);
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('انتهت مهلة الاتصال - يرجى المحاولة مرة أخرى');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : 'en-US').format(num);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : 'en-US', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending_review: 'secondary',
      rejected: 'destructive',
      archived: 'outline',
      draft: 'outline',
      sold: 'outline',
      reserved: 'secondary',
    };
    return variants[status] || 'outline';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'نشط',
      pending_review: 'قيد المراجعة',
      rejected: 'مرفوض',
      archived: 'مؤرشف',
      draft: 'مسودة',
      sold: 'مباع',
      reserved: 'محجوز',
    };
    return labels[status] || status;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // Error state (with stats still showing sidebar)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-40`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center font-bold text-lg">
                M
              </div>
              <span className="font-bold text-lg">MAVORA</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.display_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.display_name || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">Super Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {navItems.find(item => item.id === activeTab)?.label || 'لوحة التحكم'}
              </h1>
              <Badge variant="outline" className="text-xs">
                {locale === 'ar' ? 'مباشر' : 'Live'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              {/* Notifications */}
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {stats?.overview.pending_reports ? (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.overview.pending_reports > 9 ? '9+' : stats.overview.pending_reports}
                  </span>
                ) : null}
              </Button>

              {/* Back to Site */}
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 ml-2" />
                  الموقع
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
                  <RefreshCw className="h-4 w-4 ml-2" />
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي المستخدمين</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                          {formatNumber(stats.overview.total_users)}
                        </p>
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +{stats.users.today} اليوم
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي الإعلانات</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                          {formatNumber(stats.overview.total_listings)}
                        </p>
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {stats.listings.active} نشط
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي الإيرادات</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                          {formatCurrency(stats.revenue.total)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">درهم مغربي</p>
                      </div>
                      <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">بلاغات معلقة</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                          {formatNumber(stats.overview.pending_reports)}
                        </p>
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          تحتاج مراجعة
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <Flag className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">رصيد المحافظ</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">
                          {formatCurrency(stats.wallets.total_balance)}
                        </p>
                      </div>
                      <Wallet className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">التصنيفات</p>
                        <p className="text-2xl font-bold text-teal-600 mt-1">
                          {stats.categories.length}
                        </p>
                      </div>
                      <Tag className="h-8 w-8 text-teal-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">نشاط اليوم</p>
                        <div className="flex gap-4 text-sm mt-1">
                          <div>
                            <span className="text-gray-500">مستخدمين:</span>
                            <span className="font-semibold mr-1">{stats.users.today}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">إعلانات:</span>
                            <span className="font-semibold mr-1">{stats.listings.today}</span>
                          </div>
                        </div>
                      </div>
                      <Activity className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Listings & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Listings */}
                <Card>
                  <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">آخر الإعلانات</h3>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('listings')}>
                        عرض الكل
                        <ChevronLeft className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="space-y-3">
                      {stats.recent_listings.slice(0, 5).map((listing) => (
                        <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{listing.title}</p>
                            <p className="text-xs text-gray-500">{formatDate(listing.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {listing.price && (
                              <span className="text-sm font-semibold text-emerald-600">
                                {formatCurrency(listing.price)}
                              </span>
                            )}
                            <Badge variant={getStatusBadge(listing.status)} className="text-xs">
                              {getStatusLabel(listing.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <div className="p-6 pb-2">
                    <h3 className="text-lg font-semibold mb-4">إجراءات سريعة</h3>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setActiveTab('moderation')}
                      >
                        <Shield className="h-5 w-5" />
                        <span className="text-xs">مراجعة الإعلانات</span>
                        <Badge variant="secondary" className="text-xs">
                          {stats.listings.pending}
                        </Badge>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setActiveTab('reports')}
                      >
                        <Flag className="h-5 w-5" />
                        <span className="text-xs">البلاغات</span>
                        <Badge variant="destructive" className="text-xs">
                          {stats.overview.pending_reports}
                        </Badge>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setActiveTab('users')}
                      >
                        <Users className="h-5 w-5" />
                        <span className="text-xs">إدارة المستخدمين</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setActiveTab('settings')}
                      >
                        <Settings className="h-5 w-5" />
                        <span className="text-xs">الإعدادات</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts Placeholder */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold">نمو المنصة</h3>
                  <p className="text-sm text-gray-500 mt-1">آخر 30 يوم</p>
                </div>
                <div className="px-6 pb-6">
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">بيان النمو سيظهر هنا</p>
                      <p className="text-sm text-gray-400 mt-1">يمكن دمج مكتبة Recharts لعرض البيانات</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Other Tabs - Lazy Loaded Components */}
          {activeTab === 'users' && <LazyTab component={UserManagement} onError={() => {}} />}
          {activeTab === 'listings' && <LazyTab component={ListingManagement} onError={() => {}} />}
          {activeTab === 'moderation' && <LazyTab component={ModerationQueue} onError={() => {}} />}
          {activeTab === 'reports' && <LazyTab component={ReportManagement} onError={() => {}} />}
          {activeTab === 'categories' && <LazyTab component={CategoryManagement} onError={() => {}} />}
          {activeTab === 'payments' && <LazyTab component={PaymentManagement} onError={() => {}} />}
          {activeTab === 'audit' && <LazyTab component={AuditLogViewer} onError={() => {}} />}
          {activeTab === 'settings' && <LazyTab component={SettingsPanel} onError={() => {}} />}

          {/* New Tabs - Placeholders for future development */}
          {(activeTab === 'subscriptions' ||
            activeTab === 'promotions' ||
            activeTab === 'tokens' ||
            activeTab === 'messages' ||
            activeTab === 'analytics') && (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    قيد التطوير
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    هذه الميزة قيد التطوير وستكون متاحة قريباً
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('overview')}>
                    العودة للرئيسية
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
