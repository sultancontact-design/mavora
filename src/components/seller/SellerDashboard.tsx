/**
 * Seller Dashboard Component
 * Comprehensive dashboard for sellers to manage their listings, orders, and earnings
 * 
 * @module components/seller/SellerDashboard
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  MessageSquare, 
  Eye, 
  Heart,
  DollarSign,
  ShoppingCart,
  Star,
  Plus,
  MoreVertical,
  Filter,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// ============================================================
// Types
// ============================================================

interface SellerStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalLikes: number;
  totalMessages: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayout: number;
  averageRating: number;
  responseRate: number;
  responseTime: string; // e.g., "within 1 hour"
}

interface ListingPerformance {
  id: string;
  title: string;
  price: number;
  currency: string;
  views: number;
  likes: number;
  messages: number;
  status: 'active' | 'pending' | 'sold' | 'expired' | 'rejected';
  publishedAt: Date;
  category: string;
}

interface RecentOrder {
  id: string;
  buyerName: string;
  itemTitle: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
}

interface EarningData {
  date: string;
  revenue: number;
  orders: number;
}

interface MessagePreview {
  id: string;
  senderName: string;
  message: string;
  listingTitle?: string;
  time: string;
  isRead: boolean;
}

// ============================================================
// Mock Data (would come from API)
// ============================================================

const mockStats: SellerStats = {
  totalListings: 24,
  activeListings: 18,
  totalViews: 15420,
  totalLikes: 892,
  totalMessages: 156,
  totalOrders: 43,
  totalRevenue: 28500,
  pendingPayout: 1250,
  averageRating: 4.8,
  responseRate: 95,
  responseTime: 'خلال ساعة',
};

const mockListings: ListingPerformance[] = [];

const mockOrders: RecentOrder[] = [];

const mockEarnings: EarningData[] = [];

const mockMessages: MessagePreview[] = [];

// ============================================================
// Components
// ============================================================

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType,
  suffix = '',
  prefix = ''
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  change?: number; 
  changeType?: 'positive' | 'negative' | 'neutral';
  suffix?: string;
  prefix?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{prefix}{value}{suffix}</div>
        {change !== undefined && (
          <p className={`text-xs ${changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
            {changeType === 'positive' ? '+' : ''}{change}% من الأسبوع الماضي
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'نشط', variant: 'default' },
    pending: { label: 'قيد المراجعة', variant: 'secondary' },
    sold: { label: 'مباع', variant: 'outline' },
    expired: { label: 'منتهي', variant: 'secondary' },
    rejected: { label: 'مرفوض', variant: 'destructive' },
    confirmed: { label: 'مؤكد', variant: 'default' },
    shipped: { label: 'تم الشحن', variant: 'secondary' },
    delivered: { label: 'تم التوصيل', variant: 'outline' },
    cancelled: { label: 'ملغي', variant: 'destructive' },
    pending: { label: 'قيد الانتظار', variant: 'secondary' },
  };

  const config = variants[status] || { label: status, variant: 'secondary' as const };
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ============================================================
// Main Component
// ============================================================

export function SellerDashboard() {
  const [stats] = useState<SellerStats>(mockStats);
  const [listings] = useState<ListingPerformance[]>(mockListings);
  const [orders] = useState<RecentOrder[]>(mockOrders);
  const [earnings] = useState<EarningData[]>(mockEarnings);
  const [messages] = useState<MessagePreview[]>(mockMessages);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'MAD') => {
    return new Intl.NumberFormat('ar-MA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalRevenue = earnings.reduce((sum, e) => sum + e.revenue, 0);
  const totalOrders = earnings.reduce((sum, e) => sum + e.orders, 0);

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">لوحة البائع</h1>
          <p className="text-muted-foreground">مرحباً! إليك نظرة عامة على أداء متجرك</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير التقرير
          </Button>
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            إضافة إعلان جديد
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الإعلانات"
          value={stats.totalListings}
          icon={Package}
          change={12}
          changeType="positive"
        />
        <StatCard
          title="إجمالي المشاهدات"
          value={stats.totalViews.toLocaleString('ar-MA')}
          icon={Eye}
          change={8}
          changeType="positive"
        />
        <StatCard
          title="الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          change={23}
          changeType="positive"
        />
        <StatCard
          title="معدل الاستجابة"
          value={`${stats.responseRate}%`}
          icon={MessageSquare}
          change={2}
          changeType="positive"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="listings">إعلاناتي</TabsTrigger>
          <TabsTrigger value="orders">الطلبات</TabsTrigger>
          <TabsTrigger value="messages">الرسائل</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  آخر الطلبات
                </CardTitle>
                <CardDescription>آخر 5 طلبات جديدة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{order.buyerName}</p>
                        <p className="text-xs text-muted-foreground">{order.itemTitle}</p>
                      </div>
                      <div className="text-left space-y-1">
                        <StatusBadge status={order.status} />
                        <p className="text-sm font-medium">{formatCurrency(order.amount, order.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  الرسائل الأخيرة
                </CardTitle>
                <CardDescription>رسائل لم تُقرأ بعد</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex items-start gap-3 p-3 rounded-lg border ${!msg.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">
                          {msg.senderName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{msg.senderName}</p>
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                        {msg.listingTitle && (
                          <p className="text-xs text-primary">بخصوص: {msg.listingTitle}</p>
                        )}
                      </div>
                      {!msg.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">التقييم العام</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">{stats.averageRating}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">من 125 تقييم</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مدة الاستجابة</p>
                    <p className="text-2xl font-bold mt-1">{stats.responseTime}</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مدفوعات معلقة</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(stats.pendingPayout)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Listings Tab */}
        <TabsContent value="listings" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="ml-2 h-4 w-4" />
                فلتر
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              عرض {listings.length} من {stats.totalListings} إعلان
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-3 font-medium">الإعلان</th>
                  <th className="text-right p-3 font-medium">السعر</th>
                  <th className="text-right p-3 font-medium">المشاهدات</th>
                  <th className="text-right p-3 font-medium">الإعجابات</th>
                  <th className="text-right p-3 font-medium">الرسائل</th>
                  <th className="text-right p-3 font-medium">الحالة</th>
                  <th className="text-right p-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(listing => (
                  <tr key={listing.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">{listing.category}</p>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{formatCurrency(listing.price, listing.currency)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {listing.views}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        {listing.likes}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        {listing.messages}
                      </div>
                    </td>
                    <td className="p-3"><StatusBadge status={listing.status} /></td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4">
            {orders.map(order => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">{order.buyerName}</p>
                        <p className="text-sm text-muted-foreground">{order.itemTitle}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.createdAt.toLocaleDateString('ar-MA')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left space-y-2">
                      <StatusBadge status={order.status} />
                      <p className="text-lg font-bold">{formatCurrency(order.amount, order.currency)}</p>
                    </div>
                  </div>
                  
                  {/* Order Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {order.status === 'confirmed' && (
                      <>
                        <Button size="sm">تحديث كـ تم الشحن</Button>
                        <Button size="sm" variant="outline">تواصل مع المشتري</Button>
                      </>
                    )}
                    {order.status === 'shipped' && (
                      <Button size="sm">تحديث كـ تم التوصيل</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">جميع الرسائل</h3>
            <Button variant="outline" size="sm">
              تحديد الكل كمقروء
            </Button>
          </div>
          
          <div className="space-y-2">
            {messages.map(msg => (
              <Card 
                key={msg.id} 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${!msg.isRead ? 'border-primary' : ''}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold">
                        {msg.senderName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">{msg.senderName}</p>
                        <span className="text-xs text-muted-foreground">{msg.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                      {msg.listingTitle && (
                        <p className="text-xs text-primary mt-1">
                          بخصوص: {msg.listingTitle}
                        </p>
                      )}
                    </div>
                    {!msg.isRead && (
                      <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  الإيرادات الأخيرة
                </CardTitle>
                <CardDescription>آخر 7 أيام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end gap-2">
                  {earnings.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-primary rounded-t-md transition-all hover:bg-primary/80"
                        style={{ height: `${(day.revenue / Math.max(...earnings.map(e => e.revenue))) * 250}px` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(day.date).getDate()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                  <span>إجمالي الإيرادات:</span>
                  <span className="font-bold">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>عدد الطلبات:</span>
                  <span className="font-bold">{totalOrders}</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  مؤشرات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">معدل الاستجابة</span>
                    <span className="text-sm font-medium">{stats.responseRate}%</span>
                  </div>
                  <Progress value={stats.responseRate} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">معدل التحويل (مشاهدات → رسائل)</span>
                    <span className="text-sm font-medium">
                      {((stats.totalMessages / stats.totalViews) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(stats.totalMessages / stats.totalViews) * 100} />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">معدل التحويل (رسائل → طلبات)</span>
                    <span className="text-sm font-medium">
                      {((stats.totalOrders / stats.totalMessages) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(stats.totalOrders / stats.totalMessages) * 100} />
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">الإعلانات النشطة: {stats.activeListings}/{stats.totalListings}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">إعلانات قيد المراجعة: {listings.filter(l => l.status === 'pending').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SellerDashboard;
