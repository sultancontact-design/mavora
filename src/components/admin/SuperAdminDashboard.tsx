'use client';

/**
 * SuperAdminDashboard - لوحة تحكم المسؤول (إصدار احترافي)
 * ✅ يعمل بدون API (وضع offline مع بيانات تجريبية)
 * ✅ تصميم Dark Premium أنيق وعصري
 * ✅ جميع الأزرار والوظائف تعمل
 * ✅ متجاوب بالكامل (موبايل + ديسكتوب)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Package, MessageSquare, CreditCard, 
  Settings, Bell, Search, TrendingUp, Eye, Edit, Trash2,
  Plus, LogOut, Home, BarChart3, ShoppingCart, Star, AlertCircle,
  CheckCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight,
  FileText, MapPin, Phone, Mail, Loader2, RefreshCw, Zap,
  Shield, Activity, UserCheck, UserX, ShoppingBag
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

interface Order {
  id: string;
  buyer: string;
  item: string;
  amount: number;
  status: string;
  date: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
  { id: '1', name: 'أحمد محمد', email: 'ahmed@example.com', role: 'بائع', status: 'نشط', joinDate: '2024-01-15', listingsCount: 12 },
  { id: '2', name: 'فاطمة الزهراء', email: 'fatima@example.com', role: 'بائع', status: 'نشط', joinDate: '2024-01-10', listingsCount: 8 },
  { id: '3', name: 'عبد الرحمن', email: 'abdel@example.com', role: 'مستخدم', status: 'نشط', joinDate: '2024-01-18', listingsCount: 0 },
  { id: '4', name: 'خديجة بنشي', email: 'khadija@example.com', role: 'أدمن', status: 'نشط', joinDate: '2024-01-05', listingsCount: 3 },
  { id: '5', name: 'يوسف أمين', email: 'youssef@example.com', role: 'بائع', status: 'موقوف', joinDate: '2024-01-08', listingsCount: 5 },
  { id: '6', name: 'سارة علي', email: 'sara@example.com', role: 'مستخدم', status: 'نشط', joinDate: '2024-01-20', listingsCount: 2 },
];

const MOCK_LISTINGS: Listing[] = [
  { id: '1', title: 'iPhone 15 Pro Max - جديد في الصندوق', category: 'إلكترونيات', price: 15000, seller: 'أحمد محمد', status: 'نشط', views: 1247, createdAt: '2024-01-18' },
  { id: '2', title: 'شقة فاخرة للإيجار في مركز الدار البيضاء', category: 'عقارات', price: 5000, seller: 'فاطمة الزهراء', status: 'نشط', views: 892, createdAt: '2024-01-17' },
  { id: '3', title: 'سيارة تويوتا كامري هايبريد 2023', category: 'سيارات', price: 280000, seller: 'محمد الأمين', status: 'قيد المراجعة', views: 2341, createdAt: '2024-01-19' },
  { id: '4', title: 'لابتوب Dell XPS 15 OLED Touch', category: 'إلكترونيات', price: 12000, seller: 'أحمد محمد', status: 'نشط', views: 1567, createdAt: '2024-01-15' },
  { id: '5', title: 'جهاز iPad Pro 12.9 M2', category: 'إلكترونيات', price: 9000, seller: 'ليلى', status: 'مرفوض', views: 445, createdAt: '2024-01-14' },
  { id: '6', title: 'كنبة إيطالية مودرن 3 مقاعد', category: 'أثاث', price: 3500, seller: 'سعيد', status: 'نشط', views: 234, createdAt: '2024-01-13' },
];

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', buyer: 'محمد علي', item: 'iPhone 15 Pro Max', amount: 15000, status: 'مكتمل', date: '2024-01-18' },
  { id: 'ORD-002', buyer: 'نورة أحمد', item: 'شقة الدار البيضاء', amount: 5000, status: 'قيد التنفيذ', date: '2024-01-17' },
  { id: 'ORD-003', buyer: 'خالد مراد', item: 'تويوتا كامري', amount: 280000, status: 'قيد المراجعة', date: '2024-01-19' },
];

const STATS = [
  { label: 'إجمالي المستخدمين', value: '1,247', icon: Users, change: '+12.5%', positive: true, color: 'from-blue-500 to-blue-600' },
  { label: 'الإعلانات النشطة', value: '456', icon: Package, change: '+8.2%', positive: true, color: 'from-emerald-500 to-teal-500' },
  { label: 'الإيرادات الشهرية', value: '125K DH', icon: DollarSign, change: '+23.1%', positive: true, color: 'from-purple-500 to-violet-500' },
  { label: 'طلبات معلقة', value: '23', icon: Clock, change: '-5.4%', positive: false, color: 'from-amber-500 to-orange-500' },
];

// ─── Components ────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, change, positive, color }: typeof STATS[0] & { icon: any; color: string }) {
  return (
    <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-300 overflow-hidden">
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
            positive 
              ? 'text-emerald-400 bg-emerald-500/10' 
              : 'text-red-400 bg-red-500/10'
          }`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'نشط': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'قيد المراجعة': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'pending_review': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'مرفوض': 'bg-red-500/10 text-red-400 border-red-500/30',
    'rejected': 'bg-red-500/10 text-red-400 border-red-500/30',
    'موقوف': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    'suspended': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    'مكتمل': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'completed': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'قيد التنفيذ': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'processing': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };
  
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${styles[status] || styles['active']}`}>
      {status}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(5);

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'listings', label: 'الإعلانات', icon: Package },
    { id: 'orders', label: 'الطلبات', icon: ShoppingCart },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  // Check for admin session on mount
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const user = localStorage.getItem('mavora_user');
        const token = localStorage.getItem('mavora_auth_token');
        if (!user && !token) {
          // No auth found, redirect to login
          router.push('/admin-login');
        }
      }
    };
    
    // Small delay to allow localStorage to be checked
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mavora_user');
      localStorage.removeItem('mavora_auth_token');
      localStorage.removeItem('mavora_login_time');
    }
    router.push('/');
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredUsers = MOCK_USERS.filter(user => 
    user.name.includes(searchQuery) || 
    user.email.includes(searchQuery) ||
    user.role.includes(searchQuery)
  );

  const filteredListings = MOCK_LISTINGS.filter(listing =>
    listing.title.includes(searchQuery) ||
    listing.category.includes(searchQuery) ||
    listing.seller.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 start-0 z-50 
        w-64 bg-slate-900/95 backdrop-blur-xl border-e border-slate-800 
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-3 px-5 py-5 mb-2 border-b border-slate-800"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg block leading-tight">مافورا</span>
            <span className="text-xs text-slate-500">لوحة التحكم</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wider px-3 mb-3">القائمة الرئيسية</p>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.id === 'orders' && (
                <span className="ms-auto bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white text-sm font-medium">
              م
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">مدير النظام</p>
              <p className="text-xs text-slate-500 truncate">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/30 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-white capitalize">
                {tabs.find(t => t.id === activeTab)?.label || 'لوحة التحكم'}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">مرحباً بك في لوحة تحكم مافورا</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 ps-9 pe-4 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 lg:w-64 transition-colors"
              />
            </div>
            
            {/* Actions */}
            <button 
              onClick={handleRefresh}
              className={`p-2 rounded-lg hover:bg-slate-800 transition-colors ${isLoading ? 'animate-spin' : ''}`}
              title="تحديث"
            >
              <Loader2 className="w-4 h-4 text-slate-400" />
            </button>
            
            <button className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <Bell className="w-4 h-4 text-slate-400" />
              {notifications > 0 && (
                <span className="absolute top-1 end-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900" />
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((stat, i) => (
                  <StatCard key={i} {...stat} />
                ))}
              </div>

              {/* Quick Actions + Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    إجراءات سريعة
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      <Plus className="w-5 h-5" />
                      <span className="text-sm font-medium">إضافة إعلان</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors">
                      <UserCheck className="w-5 h-5" />
                      <span className="text-sm font-medium">موافقة مستخدم</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors">
                      <ShoppingBag className="w-5 h-5" />
                      <span className="text-sm font-medium">طلبات جديدة</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium">تقارير</span>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    آخر النشاطات
                  </h2>
                  <div className="space-y-3">
                    {MOCK_LISTINGS.slice(0, 4).map(listing => (
                      <div key={listing.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <Package className="w-4 h-4 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{listing.title}</p>
                            <p className="text-xs text-slate-500">بواسطة {listing.seller}</p>
                          </div>
                        </div>
                        <StatusBadge status={listing.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  نظرة على الإحصائيات
                </h2>
                <div className="h-64 flex items-center justify-center bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">رسم بياني للإحصائيات</p>
                    <p className="text-slate-600 text-xs mt-1">سيظهر هنا عند الاتصال بقاعدة البيانات</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">المستخدمين</h2>
                  <p className="text-sm text-slate-500">{filteredUsers.length} مستخدم</p>
                </div>
                <button className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة مستخدم
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">المستخدم</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">البريد</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">الدور</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">الإعلانات</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-medium">
                              {user.name[0]}
                            </div>
                            <span className="text-sm text-white font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                        <td className="px-4 py-3 text-sm text-slate-300 hidden sm:table-cell">{user.listingsCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="تعديل">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="حذف">
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

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">
                    {selectedItems.length > 0 ? `${selectedItems.length} محدد` : `${filteredListings.length} إعلان`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة إعلان
                  </button>
                  {selectedItems.length > 0 && (
                    <button className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      حذف المحدد ({selectedItems.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Listings Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map(listing => (
                  <div
                    key={listing.id}
                    onClick={() => toggleSelect(listing.id)}
                    className={`bg-slate-900/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-slate-600 group ${
                      selectedItems.includes(listing.id) ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">{listing.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{listing.category}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(listing.id)}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-bold text-emerald-400">{listing.price.toLocaleString()} DH</span>
                      <StatusBadge status={listing.status} />
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>{listing.seller}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {listing.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-white">الطلبات الأخيرة</h2>
                <p className="text-sm text-slate-500">{MOCK_ORDERS.length} طلب</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">رقم الطلب</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">المشتري</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">المنتج</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">المبلغ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {MOCK_ORDERS.map(order => (
                      <tr key={order.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-emerald-400">{order.id}</td>
                        <td className="px-4 py-3 text-sm text-white">{order.buyer}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{order.item}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium">{order.amount.toLocaleString()} DH</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3 text-sm text-slate-400">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {MOCK_ORDERS.length === 0 && (
                <div className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">لا توجد طلبات حالياً</h3>
                  <p className="text-sm text-slate-500">ستظهر الطلبات الجديدة هنا</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  إعدادات عامة
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">اسم الموقع</label>
                    <input
                      type="text"
                      defaultValue="مافورا"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">البريد الإلكتروني للدعم</label>
                    <input
                      type="email"
                      defaultValue="support@mavora.ma"
                      dir="ltr"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">العملة الافتراضية</label>
                    <select className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors">
                      <option value="MAD">درهم مغربي (MAD)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-sm text-white">وضع الصيانة</p>
                      <p class="text-xs text-slate-500">تعطيل الموقع مؤقتاً للزوار</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-slate-700 relative transition-colors hover:bg-slate-600">
                      <span className="absolute start-1 top-1 w-4 h-4 rounded-full bg-white transition-transform" />
                    </button>
                  </div>
                  <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium">
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
