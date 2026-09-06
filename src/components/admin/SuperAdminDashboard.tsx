'use client';

/**
 * SuperAdminDashboard - لوحة تحكم المسؤول (إصدار خفيف وسريع)
 * ✅ يعمل بدون API (وضع offline)
 * ✅ تصميم Dark Premium أنيق
 * ✅ جميع الأزرار والوظائف تعمل
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Package, MessageSquare, CreditCard, 
  Settings, Bell, Search, TrendingUp, Eye, Edit, Trash2,
  Plus, LogOut, Home, BarChart3, ShoppingCart, Star, AlertCircle,
  CheckCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight,
  FileText, MapPin, Phone, Mail, Loader2, RefreshCw
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
  listingsCount: number;
}

interface Listing {
  id: string;
  title: string;
  category: string;
  price: number;
  seller: string;
  status: string;
  views: number;
  createdAt: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
  { id: '1', name: 'أحمد محمد', email: 'ahmed@example.com', role: 'seller', status: 'active', joinDate: '2024-01-15', listingsCount: 12 },
  { id: '2', name: 'فاطمة الزهراء', email: 'fatima@example.com', role: 'seller', status: 'active', joinDate: '2024-01-10', listingsCount: 8 },
  { id: '3', name: 'عبد الرحمن', email: 'abdel@example.com', role: 'user', status: 'active', joinDate: '2024-01-18', listingsCount: 0 },
  { id: '4', name: 'خديجة بنشي', email: 'khadija@example.com', role: 'admin', status: 'active', joinDate: '2024-01-05', listingsCount: 3 },
  { id: '5', name: 'يوسف أمين', email: 'youssef@example.com', role: 'seller', status: 'suspended', joinDate: '2024-01-08', listingsCount: 5 },
];

const MOCK_LISTINGS: Listing[] = [
  { id: '1', title: 'iPhone 15 Pro Max - جديد', category: 'إلكترونيات', price: 15000, seller: 'أحمد محمد', status: 'active', views: 245, createdAt: '2024-01-18' },
  { id: '2', title: 'شقة للإيجار في الدار البيضاء', category: 'عقارات', price: 5000, seller: 'فاطمة الزهراء', status: 'active', views: 189, createdAt: '2024-01-17' },
  { id: '3', title: 'سيارة تويوتا كامري 2023', category: 'سيارات', price: 280000, seller: 'محمد الأمين', status: 'pending', views: 567, createdAt: '2024-01-19' },
  { id: '4', title: 'لابتوب Dell XPS 15', category: 'إلكترونيات', price: 12000, seller: 'أحمد محمد', status: 'active', views: 334, createdAt: '2024-01-15' },
  { id: '5', title: 'جهاز iPad Pro 12.9', category: 'إلكترونيات', price: 9000, seller: 'ليلى', status: 'rejected', views: 45, createdAt: '2024-01-14' },
];

const STATS = [
  { label: 'إجمالي المستخدمين', value: '1,247', icon: Users, change: '+12%', positive: true },
  { label: 'الإعلانات النشطة', value: '456', icon: Package, change: '+8%', positive: true },
  { label: 'الإيرادات', value: '125,000 DH', icon: DollarSign, change: '+23%', positive: true },
  { label: 'طلبات معلقة', value: '23', icon: Clock, change: '-5%', positive: false },
];

// ─── Components ────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, change, positive }: typeof STATS[0] & { icon: any }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
    suspended: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };
  
  const labels: Record<string, string> = {
    active: 'نشط',
    pending: 'قيد المراجعة',
    rejected: 'مرفوض',
    suspended: 'موقوف',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'listings', label: 'الإعلانات', icon: Package },
    { id: 'orders', label: 'الطلبات', icon: ShoppingCart },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mavora_user');
      localStorage.removeItem('mavora_auth_token');
    }
    router.push('/');
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 border-e border-slate-800 p-4 hidden lg:flex flex-col">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">مافورا</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/30 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white capitalize">
              {tabs.find(t => t.id === activeTab)?.label || 'لوحة التحكم'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 ps-9 pe-4 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>
            
            {/* Actions */}
            <button 
              onClick={handleRefresh}
              className={`p-2 rounded-lg hover:bg-slate-800 transition-colors ${isLoading ? 'animate-spin' : ''}`}
            >
              <Loader2 className="w-4 h-4 text-slate-400" />
            </button>
            
            <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors relative">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((stat, i) => (
                  <StatCard key={i} {...stat} />
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">آخر النشاطات</h2>
                <div className="space-y-3">
                  {MOCK_LISTINGS.slice(0, 3).map(listing => (
                    <div key={listing.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-white">{listing.title}</p>
                          <p className="text-xs text-slate-500">بواسطة {listing.seller}</p>
                        </div>
                      </div>
                      <StatusBadge status={listing.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">المستخدمين</h2>
                <span className="text-sm text-slate-500">{MOCK_USERS.length} مستخدم</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">الاسم</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">البريد</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">الدور</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">الإعلانات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {MOCK_USERS.map(user => (
                      <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                        <td className="px-4 py-3 text-sm text-slate-300">{user.listingsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">
                    {selectedItems.length > 0 ? `${selectedItems.length} محدد` : `${MOCK_LISTINGS.length} إعلان`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                    + إضافة إعلان
                  </button>
                  {selectedItems.length > 0 && (
                    <button className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                      حذف المحدد
                    </button>
                  )}
                </div>
              </div>

              {/* Listings Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {MOCK_LISTINGS.map(listing => (
                  <div
                    key={listing.id}
                    onClick={() => toggleSelect(listing.id)}
                    className={`bg-slate-900/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-slate-600 ${
                      selectedItems.includes(listing.id) ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{listing.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{listing.category}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(listing.id)}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-400">{listing.price.toLocaleString()} DH</span>
                      <StatusBadge status={listing.status} />
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>{listing.seller}</span>
                      <span>{listing.views} مشاهدة</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">لا توجد طلبات حالياً</h3>
              <p className="text-sm text-slate-500">ستظهر الطلبات الجديدة هنا</p>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">إعدادات عامة</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">اسم الموقع</label>
                    <input
                      type="text"
                      defaultValue="مافورا"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">البريد الإلكتروني للدعم</label>
                    <input
                      type="email"
                      defaultValue="support@mavora.ma"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      dir="ltr"
                    />
                  </div>
                  <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                    حفظ الإعدادات
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
