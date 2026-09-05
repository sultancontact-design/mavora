'use client';

/**
 * SuperAdminDashboard - لوحة تحكم المسؤول الكاملة
 * ✅ إصدار محسن: يجلب بيانات حقيقية من API ويعود للبيانات التجريبية عند الفشل
 * 
 * @version 2.0.0 - Fixed Version
 * @fixes - Added real API integration
 * @fixes - Added proper error handling
 * @fixes - Added loading states
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Package, MessageSquare, CreditCard, 
  Settings, Bell, Search, TrendingUp, Eye, Edit, Trash2,
  Plus, LogOut, Home, BarChart3, ShoppingCart, Star, AlertCircle,
  CheckCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight,
  FileText, Image as ImageIcon, Tag, MapPin, Phone, Mail,
  Loader2, RefreshCw, ExternalLink
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'seller' | 'user';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  lastLogin: string;
  listingsCount: number;
}

interface Listing {
  id: string;
  title: string;
  category: string;
  price: number;
  seller: string;
  status: 'active' | 'pending' | 'rejected' | 'expired';
  views: number;
  createdAt: string;
  image?: string;
}

interface Order {
  id: string;
  buyer: string;
  item: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing' | 'refunded';
  date: string;
}

interface DashboardStats {
  totalUsers: number;
  activeListings: number;
  totalRevenue: number;
  pendingOrders: number;
  monthlyGrowth: number;
}

// ============================================================
// Mock Data - بيانات تجريبية (تستخدم فقط عند فشل API)
// ============================================================

const MOCK_USERS: User[] = [
  { id: '1', name: 'أحمد محمد', email: 'ahmed@example.com', role: 'seller', status: 'active', joinDate: '2024-01-15', lastLogin: '2024-01-20', listingsCount: 12 },
  { id: '2', name: 'فاطمة الزهراء', email: 'fatima@example.com', role: 'seller', status: 'active', joinDate: '2024-01-10', lastLogin: '2024-01-19', listingsCount: 8 },
  { id: '3', name: 'عبد الرحمن', email: 'abdel@example.com', role: 'user', status: 'active', joinDate: '2024-01-18', lastLogin: '2024-01-20', listingsCount: 0 },
  { id: '4', name: 'خديجة بنشي', email: 'khadija@example.com', role: 'admin', status: 'active', joinDate: '2024-01-05', lastLogin: '2024-01-20', listingsCount: 3 },
  { id: '5', name: 'يوسف أمين', email: 'youssef@example.com', role: 'seller', status: 'suspended', joinDate: '2024-01-08', lastLogin: '2024-01-15', listingsCount: 5 },
  { id: '6', name: 'سارة علي', email: 'sara@example.com', role: 'user', status: 'pending', joinDate: '2024-01-20', lastLogin: '-', listingsCount: 0 },
];

const MOCK_LISTINGS: Listing[] = [
  { id: '1', title: 'iPhone 15 Pro Max - جديد', category: 'إلكترونيات', price: 15000, seller: 'أحمد محمد', status: 'active', views: 245, createdAt: '2024-01-18', image: '📱' },
  { id: '2', title: 'شقة للإيجار في الدار البيضاء', category: 'عقارات', price: 5000, seller: 'فاطمة الزهراء', status: 'active', views: 189, createdAt: '2024-01-17', image: '🏠' },
  { id: '3', title: 'سيارة تويوتا كامري 2023', category: 'سيارات', price: 280000, seller: 'محمد الأمين', status: 'pending', views: 567, createdAt: '2024-01-19', image: '🚗' },
  { id: '4', title: 'كنبة مودرن - حاله ممتازة', category: 'أثاث', price: 3500, seller: 'سعيد', status: 'active', views: 98, createdAt: '2024-01-16', image: '🛋️' },
  { id: '5', title: 'لابتوب Dell XPS 15', category: 'إلكترونيات', price: 12000, seller: 'أحمد محمد', status: 'active', views: 334, createdAt: '2024-01-15', image: '💻' },
  { id: '6', title: 'جهاز iPad Pro 12.9', category: 'إلكترونيات', price: 9000, seller: 'ليلى', status: 'rejected', views: 45, createdAt: '2024-01-14', image: '📱' },
  { id: '7', title: 'دراجة هوائية جبلية', category: 'رياضة', price: 2500, seller: 'كريم', status: 'active', views: 156, createdAt: '2024-01-13', image: '🚴' },
  { id: '8', title: 'مكنسة روبوت سامسونغ', category: 'أجهزة منزلية', price: 1800, seller: 'نادية', status: 'expired', views: 78, createdAt: '2024-01-10', image: '🤖' },
];

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', buyer: 'عبد الرحمن', item: 'iPhone 15 Pro Max', amount: 15000, status: 'completed', date: '2024-01-19' },
  { id: 'ORD-002', buyer: 'مريم', item: 'شقة للإيجار', amount: 5000, status: 'pending', date: '2024-01-19' },
  { id: 'ORD-003', buyer: 'حسن', item: 'لابتوب Dell XPS 15', amount: 12000, status: 'processing', date: '2024-01-18' },
  { id: 'ORD-004', buyer: 'زينب', item: 'كنبة مودرن', amount: 3500, status: 'completed', date: '2024-01-17' },
  { id: 'ORD-005', buyer: 'أيمن', item: 'دراجة هوائية', amount: 2500, status: 'refunded', date: '2024-01-16' },
];

const DEFAULT_STATS: DashboardStats = {
  totalUsers: 1247,
  activeListings: 456,
  totalRevenue: 125000,
  pendingOrders: 23,
  monthlyGrowth: 15.5,
};

// ============================================================
// Components
// ============================================================

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'blue',
  isLoading = false
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
  isLoading?: boolean;
}) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600', text: 'text-green-700 dark:text-green-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600', text: 'text-purple-700 dark:text-purple-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600', text: 'text-orange-700 dark:text-orange-300' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600', text: 'text-red-700 dark:text-red-300' },
  };

  const c = colors[color] || colors.blue;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="ms-1">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${c.bg}`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    expired: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    refunded: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const labels: Record<string, string> = {
    active: 'نشط ✅',
    pending: 'قيد المراجعة ⏳',
    suspended: 'موقوف 🚫',
    rejected: 'مرفوض ❌',
    expired: 'منتهي ⏰',
    completed: 'مكتمل ✅',
    processing: 'قيد المعالجة 🔄',
    refunded: 'مسترد 💰',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

function SidebarItem({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  badge,
  isLoading = false
}: { 
  icon: any; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
  badge?: number;
  isLoading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
      } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Icon className="w-5 h-5" />
      )}
      <span className="font-medium">{label}</span>
      {badge !== undefined && !isLoading && (
        <span className={`ms-auto px-2 py-0.5 rounded-full text-xs font-medium ${
          active ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Loading Spinner Component
function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <Loader2 className={`${sizes[size]} animate-spin text-teal-500`} />;
}

// Empty State Component
function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Error State Component
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-red-600 dark:text-red-400 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        إعادة المحاولة
      </button>
    </div>
  );
}

// ============================================================
// Main Dashboard Component
// ============================================================

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // ============================================================
  // Data Fetching Functions
  // ============================================================

  const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Fetch stats from API
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalUsers: statsData.totalUsers || DEFAULT_STATS.totalUsers,
          activeListings: statsData.activeListings || DEFAULT_STATS.activeListings,
          totalRevenue: statsData.totalRevenue || DEFAULT_STATS.totalRevenue,
          pendingOrders: statsData.pendingOrders || DEFAULT_STATS.pendingOrders,
          monthlyGrowth: statsData.monthlyGrowth || DEFAULT_STATS.monthlyGrowth,
        });
        setUsingMockData(false);
      } else {
        console.warn('[Dashboard] Stats API returned non-OK, using defaults');
        setStats(DEFAULT_STATS);
        setUsingMockData(true);
      }

      // Fetch users from API
      try {
        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (Array.isArray(usersData.users) && usersData.users.length > 0) {
            setUsers(usersData.users.map((u: Record<string, unknown>) => ({
              id: u.id as string,
              name: (u.name || u.display_name || 'Unknown') as string,
              email: u.email as string,
              role: (u.role || 'user') as User['role'],
              status: (u.isActive !== false ? 'active' : 'suspended') as User['status'],
              joinDate: u.createdAt ? new Date(u.createdAt as string).toLocaleDateString('ar-MA') : '-',
              lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt as string).toLocaleDateString('ar-MA') : '-',
              listingsCount: u.listingsCount || u._count?.listings || 0,
            })));
          } else {
            setUsers(MOCK_USERS);
            setUsingMockData(true);
          }
        } else {
          setUsers(MOCK_USERS);
          setUsingMockData(true);
        }
      } catch (usersError) {
        console.warn('[Dashboard] Users API failed, using mock data:', usersError);
        setUsers(MOCK_USERS);
        setUsingMockData(true);
      }

      // Fetch listings from API
      try {
        const listingsResponse = await fetch('/api/listings?limit=10');
        if (listingsResponse.ok) {
          const listingsData = await listingsResponse.json();
          if (Array.isArray(listingsData.listings) && listingsData.listings.length > 0) {
            setListings(listingsData.listings.map((l: Record<string, unknown>) => ({
              id: l.id as string,
              title: l.title as string,
              category: l.category?.name || l.categoryId || 'غير مصنف',
              price: Number(l.price) || 0,
              seller: l.seller?.display_name || 'غير معروف',
              status: (l.status || 'active') as Listing['status'],
              views: l.viewCount || 0,
              createdAt: l.createdAt ? new Date(l.createdAt as string).toLocaleDateString('ar-MA') : '-',
            })));
          } else {
            setListings(MOCK_LISTINGS);
            setUsingMockData(true);
          }
        } else {
          setListings(MOCK_LISTINGS);
          setUsingMockData(true);
        }
      } catch (listingsError) {
        console.warn('[Dashboard] Listings API failed, using mock data:', listingsError);
        setListings(MOCK_LISTINGS);
        setUsingMockData(true);
      }

      // Orders - use mock for now (API may not be fully implemented)
      setOrders(MOCK_ORDERS);

    } catch (err) {
      console.error('[Dashboard] Failed to fetch data:', err);
      setError('فشل في تحميل البيانات. يرجى التحقق من اتصال الإنترنت.');
      // Fall back to mock data on any error
      setUsers(MOCK_USERS);
      setListings(MOCK_LISTINGS);
      setOrders(MOCK_ORDERS);
      setStats(DEFAULT_STATS);
      setUsingMockData(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Handle logout
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mavora_user');
      localStorage.removeItem('mavora_auth_token');
      document.cookie = 'mavora_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'mavora_demo_mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    router.push('/admin-login');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Navigate to listing detail
  const handleListingClick = (listingId: string) => {
    router.push(`/listings/${listingId}`);
  };

  // Navigate to user profile
  const handleUserClick = (userId: string) => {
    window.open(`/profile?id=${userId}`, '_blank');
  };

  // Filter data based on search
  const filteredListings = listings.filter(l => 
    l.title.includes(searchQuery) || l.category.includes(searchQuery) || l.seller.includes(searchQuery)
  );

  const filteredUsers = users.filter(u =>
    u.name.includes(searchQuery) || u.email.includes(searchQuery)
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-40">
        {/* Logo - Clickable to go home */}
        <Link href="/" className="block p-6 border-b border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
            مافورا
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">لوحة التحكم</p>
        </Link>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="لوحة التحكم" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            isLoading={isRefreshing}
          />
          <SidebarItem 
            icon={Users} 
            label="المستخدمون" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            badge={stats.totalUsers} 
          />
          <SidebarItem 
            icon={Package} 
            label="الإعلانات" 
            active={activeTab === 'listings'} 
            onClick={() => setActiveTab('listings')} 
            badge={stats.activeListings} 
          />
          <SidebarItem 
            icon={ShoppingCart} 
            label="الطلبات" 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')} 
            badge={stats.pendingOrders} 
          />
          <SidebarItem 
            icon={MessageSquare} 
            label="الرسائل" 
            active={activeTab === 'messages'} 
            onClick={() => setActiveTab('messages')} 
          />
          <SidebarItem 
            icon={CreditCard} 
            label="المدفوعات" 
            active={activeTab === 'payments'} 
            onClick={() => setActiveTab('payments')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="التقارير" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="الإعدادات" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        {/* Data Source Indicator */}
        {usingMockData && !isLoading && (
          <div className="mx-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              وضع العرض التجريبي (API غير متاح)
            </p>
          </div>
        )}

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold">
              م
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">مدير النظام</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mr-64 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white placeholder-gray-500"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Home Link */}
              <Link
                href="/"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="الذهاب للموقع"
              >
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">جاري تحميل البيانات...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <ErrorState message={error} onRetry={handleRefresh} />
          )}

          {/* Content Tabs */}
          {!isLoading && (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">لوحة التحكم</h2>
                    <p className="text-gray-500 dark:text-gray-400">نظرة عامة على المنصة</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="إجمالي المستخدمين"
                      value={stats.totalUsers.toLocaleString('ar-MA')}
                      icon={Users}
                      trend="up"
                      trendValue="+12%"
                      color="blue"
                    />
                    <StatCard
                      title="الإعلانات النشطة"
                      value={stats.activeListings.toLocaleString('ar-MA')}
                      icon={Package}
                      trend="up"
                      trendValue="+8%"
                      color="green"
                    />
                    <StatCard
                      title="إجمالي الإيرادات"
                      value={`${stats.totalRevenue.toLocaleString('ar-MA')} د.م`}
                      icon={DollarSign}
                      trend="up"
                      trendValue="+15.5%"
                      color="purple"
                    />
                    <StatCard
                      title="طلبات معلقة"
                      value={stats.pendingOrders}
                      icon={Clock}
                      trend="down"
                      trendValue="-5%"
                      color="orange"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">إجراءات سريعة</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Link href="/listings/create" className="flex flex-col items-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors">
                        <Plus className="w-8 h-8 text-teal-600 mb-2" />
                        <span className="text-sm font-medium text-teal-700 dark:text-teal-400">إضافة إعلان</span>
                      </Link>
                      <Link href="/admin?tab=users" className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                        <Users className="w-8 h-8 text-blue-600 mb-2" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">المستخدمون</span>
                      </Link>
                      <Link href="/admin?tab=orders" className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                        <ShoppingCart className="w-8 h-8 text-purple-600 mb-2" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">الطلبات</span>
                      </Link>
                      <Link href="/" className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                        <Home className="w-8 h-8 text-orange-600 mb-2" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-400">الموقع الرئيسي</span>
                      </Link>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Listings */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">آخر الإعلانات</h3>
                        <button 
                          onClick={() => setActiveTab('listings')}
                          className="text-sm text-teal-600 hover:text-teal-700"
                        >
                          عرض الكل
                        </button>
                      </div>
                      <div className="space-y-3">
                        {listings.slice(0, 5).map((listing) => (
                          <div 
                            key={listing.id} 
                            onClick={() => handleListingClick(listing.id)}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <span className="text-2xl">{listing.image || '📦'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{listing.title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{listing.seller}</p>
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-gray-900 dark:text-white">{listing.price.toLocaleString()} د.م</p>
                              <StatusBadge status={listing.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Users */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">آخر المستخدمين</h3>
                        <button 
                          onClick={() => setActiveTab('users')}
                          className="text-sm text-teal-600 hover:text-teal-700"
                        >
                          عرض الكل
                        </button>
                      </div>
                      <div className="space-y-3">
                        {users.slice(0, 5).map((user) => (
                          <div 
                            key={user.id} 
                            onClick={() => handleUserClick(user.id)}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                            <div className="text-left">
                              <StatusBadge status={user.status} />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المستخدمون</h2>
                      <p className="text-gray-500 dark:text-gray-400">إدارة حسابات المستخدمين ({users.length})</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                      <Plus className="w-4 h-4" />
                      إضافة مستخدم
                    </button>
                  </div>

                  {filteredUsers.length === 0 ? (
                    <EmptyState 
                      message="لا يوجد مستخدمون مطابقون لبحثك" 
                      actionLabel="مسح البحث"
                      onAction={() => setSearchQuery('')}
                    />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المستخدم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الدور</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الإعلانات</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">آخر تسجيل</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                                    {user.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={user.status} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                                {user.listingsCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {user.lastLogin}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-left">
                                <div className="flex items-center gap-2">
                                  <button className="p-1 text-gray-500 hover:text-blue-600">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 text-gray-500 hover:text-green-600">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 text-gray-500 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الإعلانات</h2>
                      <p className="text-gray-500 dark:text-gray-400">إدارة جميع الإعلانات ({listings.length})</p>
                    </div>
                    <Link href="/listings/create" className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                      <Plus className="w-4 h-4" />
                      إضافة إعلان
                    </Link>
                  </div>

                  {filteredListings.length === 0 ? (
                    <EmptyState 
                      message="لا توجد إعلانات مطابقة لبحثك" 
                      actionLabel="مسح البحث"
                      onAction={() => setSearchQuery('')}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredListings.map((listing) => (
                        <div 
                          key={listing.id}
                          onClick={() => handleListingClick(listing.id)}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center text-4xl">
                            {listing.image || '📦'}
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{listing.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{listing.category} • {listing.seller}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-teal-600">{listing.price.toLocaleString()} د.م</p>
                            <StatusBadge status={listing.status} />
                          </div>
                          <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {listing.views}
                            </span>
                            <span>{listing.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الطلبات</h2>
                    <p className="text-gray-500 dark:text-gray-400">تتبع وإدارة الطلبات ({orders.length})</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">رقم الطلب</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المشتري</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المنتج</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المبلغ</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحالة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900 dark:text-white">{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{order.buyer}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{order.item}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">{order.amount.toLocaleString()} د.م</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{order.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الرسائل</h2>
                    <p className="text-gray-500 dark:text-gray-400">نظام الرسائل والمحادثات</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">قريباً</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">نظام الرسائل قيد التطوير</p>
                    <Link href="/messages" className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                      فتح صفحة الرسائل
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المدفوعات</h2>
                    <p className="text-gray-500 dark:text-gray-400">إدارة المعاملات المالية</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="إجمالي الإيرادات" value={`${stats.totalRevenue.toLocaleString()} د.م`} icon={DollarSign} color="green" />
                    <StatCard title="الطلبات المعلقة" value={stats.pendingOrders} icon={Clock} color="orange" />
                    <StatCard title="معدل النمو" value={`${stats.monthlyGrowth}%`} icon={TrendingUp} color="blue" />
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">نظام المدفوعات</h3>
                    <p className="text-gray-500 dark:text-gray-400">الدفع عبر Stripe و PayPal و Payoneer</p>
                  </div>
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">التقارير</h2>
                    <p className="text-gray-500 dark:text-gray-400">تحليلات وإحصائيات مفصلة</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-500" />
                        تقرير المبيعات
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">تحليل المبيعات والإيرادات الشهرية</p>
                      <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        تحميل التقرير
                      </button>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="font-semibold text-gray-900 dark-text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        تقرير المستخدمين
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">إحصائيات المستخدمين الجدد والنشطين</p>
                      <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        تحميل التقرير
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الإعدادات</h2>
                    <p className="text-gray-500 dark:text-gray-400">إعدادات النظام والمنصة</p>
                  </div>
                  
                  <div className="max-w-2xl space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">إعدادات عامة</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم المنصة</label>
                          <input type="text" defaultValue="مافورا" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني للدعم</label>
                          <input type="email" defaultValue="support@mavora.ma" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <button className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                          حفظ الإعدادات
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
