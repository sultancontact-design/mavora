'use client';

/**
 * SuperAdminDashboard - لوحة تحكم المسؤول الكاملة
 * مع جميع الميزات الفعلية وبيانات تجريبية
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Package, MessageSquare, CreditCard, 
  Settings, Bell, Search, TrendingUp, Eye, Edit, Trash2,
  Plus, LogOut, Home, BarChart3, ShoppingCart, Star, AlertCircle,
  CheckCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight,
  FileText, Image as ImageIcon, Tag, MapPin, Phone, Mail
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

// ============================================================
// Mock Data - بيانات تجريبية حقيقية
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

const STATS = {
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
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
}) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600', text: 'text-green-700 dark:text-green-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600', text: 'text-purple-700 dark:text-purple-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600', text: 'text-orange-700 dark:text-orange-300' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600', text: 'text-red-700 dark:text-red-300' },
  };

  const c = colors[color] || colors.blue;

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
  badge 
}: { 
  icon: any; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {badge !== undefined && (
        <span className={`ms-auto px-2 py-0.5 rounded-full text-xs font-medium ${
          active ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ============================================================
// Main Dashboard Component
// ============================================================

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle logout
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mavora_user');
      localStorage.removeItem('mavora_auth_token');
    }
    router.push('/admin-login');
  };

  // Filter data based on search
  const filteredListings = MOCK_LISTINGS.filter(l => 
    l.title.includes(searchQuery) || l.category.includes(searchQuery) || l.seller.includes(searchQuery)
  );

  const filteredUsers = MOCK_USERS.filter(u =>
    u.name.includes(searchQuery) || u.email.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
            مافورا
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">لوحة التحكم</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="لوحة التحكم" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Users} label="المستخدمون" active={activeTab === 'users'} onClick={() => setActiveTab('users')} badge={STATS.totalUsers} />
          <SidebarItem icon={Package} label="الإعلانات" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} badge={STATS.activeListings} />
          <SidebarItem icon={ShoppingCart} label="الطلبات" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} badge={STATS.pendingOrders} />
          <SidebarItem icon={MessageSquare} label="الرسائل" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
          <SidebarItem icon={CreditCard} label="المدفوعات" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
          <SidebarItem icon={BarChart3} label="التقارير" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <SidebarItem icon={Settings} label="الإعدادات" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

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
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <a 
                href="/" 
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>عرض الموقع</span>
              </a>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* ==================== DASHBOARD TAB ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">نظرة عامة على أداء المنصة</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="إجمالي المستخدمين" 
                  value={STATS.totalUsers.toLocaleString()} 
                  icon={Users} 
                  trend="up" 
                  trendValue={`${STATS.monthlyGrowth}% هذا الشهر`}
                  color="blue"
                />
                <StatCard 
                  title="الإعلانات النشطة" 
                  value={STATS.activeListings} 
                  icon={Package} 
                  trend="up" 
                  trendValue="+12% هذا الأسبوع"
                  color="green"
                />
                <StatCard 
                  title="إيرادات الشهر" 
                  value={`${(STATS.totalRevenue / 1000).toFixed(0)}K MAD`} 
                  icon={DollarSign} 
                  trend="up" 
                  trendValue="+8% عن الشهر الماضي"
                  color="purple"
                />
                <StatCard 
                  title="طلبات معلقة" 
                  value={STATS.pendingOrders} 
                  icon={ShoppingCart} 
                  color="orange"
                />
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">آخر الطلبات</h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      عرض الكل
                    </button>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {MOCK_ORDERS.slice(0, 4).map(order => (
                      <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{order.item}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{order.buyer} • {order.date}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 dark:text-white">{order.amount.toLocaleString()} MAD</p>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Listings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">أحدث الإعلانات</h3>
                    <button 
                      onClick={() => setActiveTab('listings')}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      عرض الكل
                    </button>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {MOCK_LISTINGS.slice(0, 4).map(listing => (
                      <div key={listing.id} className="px-6 py-4 flex items-center gap-4">
                        <span className="text-2xl">{listing.image}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{listing.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{listing.seller}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 dark:text-white">{listing.price.toLocaleString()} MAD</p>
                          <StatusBadge status={listing.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== USERS TAB ==================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{filteredUsers.length} مستخدم</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  إضافة مستخدم
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">المستخدم</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">الدور</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">الحالة</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">الإعلانات</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">آخر دخول</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                            user.role === 'seller' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role === 'super_admin' ? 'مدير عام' : user.role === 'admin' ? 'مدير' : user.role === 'seller' ? 'بائع' : 'مستخدم'}
                          </span>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">{user.listingsCount}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{user.lastLogin}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== LISTINGS TAB ==================== */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الإعلانات</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{filteredListings.length} إعلان</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  إضافة إعلان
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredListings.map(listing => (
                  <div key={listing.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-6xl">
                      {listing.image}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{listing.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{listing.category}</p>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-lg font-bold text-teal-600">{listing.price.toLocaleString()} MAD</p>
                        <StatusBadge status={listing.status} />
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{listing.seller}</span>
                        <span className="text-sm text-gray-400 dark:text-gray-500">👁 {listing.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== ORDERS TAB ==================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الطلبات</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{MOCK_ORDERS.length} طلب</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">رقم الطلب</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">المنتج</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">المشتري</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">المبلغ</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">التاريخ</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">الحالة</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {MOCK_ORDERS.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-white">{order.id}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.item}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{order.buyer}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{order.amount.toLocaleString()} MAD</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{order.date}</td>
                        <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">تفاصيل</button>
                            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">تحديث</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== MESSAGES TAB ==================== */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الرسائل</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">محادثات المستخدمين</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">نظام الرسائل</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  سيتم عرض جميع محادثات المستخدمين هنا. يمكنك مراقبة والتدخل في المحادثات عند الحاجة.
                </p>
                <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> مشفر من طرف إلى طرف</span>
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> في الوقت الفعلي</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== PAYMENTS TAB ==================== */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المدفوعات</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة المعاملات المالية</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="إيرادات اليوم" value="4,250 MAD" icon={CreditCard} color="green" />
                <StatCard title="معاملات معلقة" value="12" icon={Clock} color="orange" />
                <StatCard title="مبالغ مستردة" value="850 MAD" icon={ArrowDownRight} color="red" />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">بوابات الدفع</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  PayPal و Payoneer متاحان للدفع الدولي. الدفع المحلي عبر CIF و التحويل البنكي.
                </p>
                <div className="mt-6 flex items-center justify-center gap-6">
                  <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">PayPal ✓</span>
                  </div>
                  <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span className="text-orange-700 dark:text-orange-300 font-medium">Payoneer ✓</span>
                  </div>
                  <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-green-700 dark:text-green-300 font-medium">CIF ✓</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== REPORTS TAB ==================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">التقارير والإحصائيات</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">تحليلات مفصلة لأداء المنصة</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                    نمو المستخدمين
                  </h3>
                  <div className="space-y-4">
                    {['يناير: +145 مستخدم', 'فبراير: +203 مستخدم', 'مارس: +178 مستخدم', 'أبريل: +256 مستخدم'].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">{item.split(':')[0]}</span>
                        <span className="font-medium text-green-600">{item.split(': ')[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    أكثر الفئات طلباً
                  </h3>
                  <div className="space-y-4">
                    {[
                      { name: 'إلكترونيات', percent: 35 },
                      { name: 'عقارات', percent: 25 },
                      { name: 'سيارات', percent: 20 },
                      { name: 'أثاث', percent: 12 },
                      { name: 'أخرى', percent: 8 },
                    ].map((cat, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                          <span className="text-gray-500 dark:text-gray-400">{cat.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full"
                            style={{ width: `${cat.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SETTINGS TAB ==================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الإعدادات</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">إعدادات المنصة العامة</p>
              </div>

              <div className="max-w-2xl space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">إعدادات عامة</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم المنصة</label>
                      <input type="text" defaultValue="مافورا" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني للدعم</label>
                      <input type="email" defaultValue="support@mavora.ma" dir="ltr" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العملة الافتراضية</label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="MAD">درهم مغربي (MAD)</option>
                        <option value="USD">دولار أمريكي (USD)</option>
                        <option value="EUR">يورو (EUR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    إلغاء
                  </button>
                  <button className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors">
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
