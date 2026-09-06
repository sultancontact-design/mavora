/**
 * Advanced Seller Dashboard Component
 * Comprehensive analytics and insights for sellers
 * 
 * @module components/seller/AdvancedSellerDashboard
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// Types
import {
  DashboardData,
  SellerOverview,
  ListingPerformance,
  TrafficSource,
  TimeSeriesData,
  Insight,
} from '@/lib/analytics/seller-analytics';

interface AdvancedSellerDashboardProps {
  sellerId: string;
  className?: string;
}

// ============================================================
// Sub-components
// ============================================================

interface MetricCardProps {
  title: string;
  titleEn: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
}

function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  const changeColor = changeType === 'increase' ? 'text-green-600' : changeType === 'decrease' ? 'text-red-600' : 'text-gray-500';
  const changeIcon = changeType === 'increase' ? '↑' : changeType === 'decrease' ? '↓' : '→';

  return (
    <Card className="rtl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 font-medium">{title}</span>
          <div className="text-primary/80">{icon}</div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className={`text-sm flex items-center gap-1 ${changeColor}`}>
          <span>{changeIcon}</span>
          <span>{Math.abs(change)}%</span>
          <span className="text-gray-400 text-xs">من الشهر الماضي</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Mini Chart Component (SVG-based)
interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
  showAxis?: boolean;
}

function MiniChart({ data, color = '#6366f1', height = 60, showAxis = false }: MiniChartProps) {
  if (!data || data.length === 0) return null;

  const width = 200;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Area fill
  const areaD = `${pathD} L ${width},${height} L 0,{height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Area fill */}
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#gradient-${color.replace('#', '')})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      
      {showAxis && (
        <>
          <line x1="0" y1={height} x2={width} y2={height} stroke="#e5e7eb" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}

// Insight Card
function InsightCard({ insight, onAction }: { insight: Insight; onAction?: () => void }) {
  const typeConfig = {
    opportunity: { bg: 'bg-blue-50', icon: '💡', color: 'text-blue-700' },
    warning: { bg: 'bg-amber-50', icon: '⚠️', color: 'text-amber-700' },
    achievement: { bg: 'bg-green-50', icon: '🎉', color: 'text-green-700' },
    tip: { bg: 'bg-purple-50', icon: '💡', color: 'text-purple-700' },
  };

  const config = typeConfig[insight.type];

  return (
    <Card className={`${config.bg} border-0`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div className="flex-1">
            <h4 className={`font-semibold ${config.color} mb-1`}>{insight.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
            {insight.actionText && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAction}
                className="text-xs"
              >
                {insight.actionText}
              </Button>
            )}
          </div>
          {!insight.isRead && (
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Ranking Badge
function RankBadge({ rank, badge, percentile }: { rank: number; badge: string; percentile: number }) {
  const badgeConfig = {
    bronze: { color: 'bg-amber-700', label: 'برونزي' },
    silver: { color: 'bg-gray-400', label: 'فضي' },
    gold: { color: 'bg-yellow-500', label: 'ذهبي' },
    platinum: { color: 'bg-gradient-to-r from-purple-400 to-pink-300', label: 'بلاتيني' },
  };

  const config = badgeConfig[badge as keyof typeof badgeConfig];

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6 text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config?.color || 'bg-gray-400'} text-white text-xl font-bold mb-3`}>
          {rank}
        </div>
        <p className="text-sm text-gray-500 mb-1">ترتيبك بين البائعين</p>
        <p className="text-lg font-bold text-gray-900">{config?.label || badge}</p>
        <p className="text-xs text-gray-500 mt-1">أفضل من {percentile}% من البائعين</p>
        
        <Progress value={percentile} className="mt-3 h-2" />
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Dashboard Component
// ============================================================

export function AdvancedSellerDashboard({ sellerId, className = '' }: AdvancedSellerDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [sellerId, dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // In production, fetch from API
      // const response = await fetch(`/api/seller/${sellerId}/analytics?range=${dateRange}`);
      // const dashboardData = await response.json();
      
      // Simulated data for now
      setData({
        overview: {
          totalListings: { value: 24, change: 5, changeType: 'increase', formattedValue: '24' },
          activeListings: { value: 18, change: 10, changeType: 'increase', formattedValue: '18' },
          totalViews: { value: 12500, change: 15, changeType: 'increase', formattedValue: '12.5K' },
          totalInquiries: { value: 342, change: -3, changeType: 'decrease', formattedValue: '342' },
          responseRate: { value: 94, change: 2, changeType: 'increase', formattedValue: '94%' },
          averageResponseTime: '1.5 ساعة',
          successRate: { value: 38, change: 8, changeType: 'increase', formattedValue: '38%' },
        },
        listings: [
          { id: '1', title: 'iPhone 13 Pro - مثل جديد', views: 450, inquiries: 23, conversionRate: 5.1, revenue: 45000, status: 'active', category: 'إلكترونيات', createdAt: new Date() },
          { id: '2', title: 'شقة للكراء في الدار البيضاء', views: 320, inquiries: 15, conversionRate: 4.7, revenue: 0, status: 'active', category: 'عقارات', createdAt: new Date() },
          { id: '3', title: 'سيارة رونو 2022', views: 280, inquiries: 12, conversionRate: 4.3, revenue: 180000, status: 'active', category: 'مركبات', createdAt: new Date() },
        ],
        trafficSources: [
          { source: 'البحث المباشر', visitors: 450, percentage: 36, change: 12 },
          { source: 'الفئات', visitors: 320, percentage: 26, change: 8 },
          { source: 'المفضلة', visitors: 180, percentage: 14, change: -3 },
          { source: 'محركات البحث', visitors: 150, percentage: 12, change: 25 },
          { source: 'وسائل التواصل', visitors: 100, percentage: 8, change: 5 },
          { source: 'مباشر', visitors: 50, percentage: 4, change: 0 },
        ],
        geographicData: [
          { city: 'الدار البيضاء', region: 'كازابلانكا', count: 450, percentage: 35 },
          { city: 'الرباط', region: 'الرباط سلا القنيطرة', count: 280, percentage: 22 },
          { city: 'مراكش', region: 'مراكش آسفي', count: 190, percentage: 15 },
          { city: 'فاس', region: 'فاس مكناس', count: 140, percentage: 11 },
          { city: 'طنجة', region: 'طنجة تطوان الحسيمة', count: 100, percentage: 8 },
          { city: 'أغادير', region: 'سوس ماسة درعة', count: 70, percentage: 5 },
          { city: 'أخرى', region: '-', count: 50, percentage: 4 },
        ],
        timeSeries: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 100) + 20,
          inquiries: Math.floor(Math.random() * 10),
          conversions: Math.floor(Math.random() * 3),
          revenue: Math.random() * 500,
        })),
        categories: [
          { category: 'إلكترونيات', categoryId: '1', listings: 8, views: 1200, inquiries: 35, revenue: 15000, avgPrice: 1875 },
          { category: 'مركبات', categoryId: '2', listings: 3, views: 800, inquiries: 20, revenue: 25000, avgPrice: 8333 },
          { category: 'أزياء', categoryId: '4', listings: 5, views: 600, inquiries: 18, revenue: 4500, avgPrice: 900 },
          { category: 'عقارات', categoryId: '3', listings: 2, views: 400, inquiries: 8, revenue: 35000, avgPrice: 17500 },
          { category: 'المنزل', categoryId: '5', listings: 4, views: 300, inquiries: 10, revenue: 2800, avgPrice: 700 },
        ],
        rank: { rank: 42, totalSellers: 1250, percentile: 96, category: 'إلكترونيات', badge: 'gold' },
        insights: [
          { id: '1', type: 'achievement', title: 'أداء ممتاز هذا الأسبوع!', titleEn: 'Great performance!', description: 'حققت زيادة 15% في المشاهدات', descriptionEn: '15% increase in views', priority: 'low', createdAt: new Date(), isRead: false },
          { id: '2', type: 'opportunity', title: 'فرصة لتحسين التحويلات', titleEn: 'Improve conversions', description: 'إعلان iPhone يحصل على مشاهدات كثيرة', descriptionEn: 'iPhone listing gets many views', actionText: 'عرض الإعلان', actionUrl: '/listings/xxx', priority: 'high', createdAt: new Date(), isRead: false },
          { id: '3', type: 'warning', title: 'استجابة متأخرة', titleEn: 'Delayed responses', description: 'متوسط وقت الاستجابة 4 ساعات', descriptionEn: 'Avg response time is 4 hours', actionText: 'عرض الرسائل', actionUrl: '/messages', priority: 'medium', createdAt: new Date(), isRead: false },
        ],
        generatedAt: new Date(),
      });
    } catch (error) {
      console.error('[Dashboard] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        فشل في تحميل بيانات لوحة التحكم
      </div>
    );
  }

  const { overview, listings, trafficSources, geographicData, timeSeries, categories, rank, insights } = data;

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم المتقدمة</h1>
          <p className="text-gray-500 mt-1">آخر تحديث: {data.generatedAt.toLocaleString('ar-MA')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">هذا الربع سنة</SelectItem>
              <SelectItem value="year">هذه السنة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadDashboardData()}>
            🔄 تحديث
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="إجمالي الإعلانات"
          titleEn="Total Listings"
          value={overview.totalListings.formattedValue}
          change={overview.totalListings.change}
          changeType={overview.totalListings.changeType}
          icon="📦"
        />
        <MetricCard
          title="المشاهدات"
          titleEn="Total Views"
          value={overview.totalViews.formattedValue}
          change={overview.totalViews.change}
          changeType={overview.totalViews.changeType}
          icon="👁️"
        />
        <MetricCard
          title="الاستفسارات"
          titleEn="Inquiries"
          value={overview.totalInquiries.formattedValue}
          change={overview.totalInquiries.change}
          changeType={overview.totalInquiries.changeType}
          icon="💬"
        />
        <MetricCard
          title="معدل النجاح"
          titleEn="Success Rate"
          value={overview.successRate.formattedValue}
          change={overview.successRate.change}
          changeType={overview.successRate.changeType}
          icon="🎯"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Views Chart */}
          <Card>
            <CardHeader>
              <CardTitle>مشاهدات الإعلانات</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniChart
                data={timeSeries.map(d => d.views)}
                color="#6366f1"
                height={200}
                showAxis
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>30 يوم مضت</span>
                <span>اليوم</span>
              </div>
            </CardContent>
          </Card>

          {/* Listings Performance Table */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>أداء الإعلانات</CardTitle>
              <Button variant="ghost" size="sm">عرض الكل</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-2 font-medium text-gray-500">الإعلان</th>
                      <th className="pb-2 font-medium text-gray-500">المشاهدات</th>
                      <th className="pb-2 font-medium text-gray-500">الاستفسارات</th>
                      <th className="pb-2 font-medium text-gray-500">التحويل</th>
                      <th className="pb-2 font-medium text-gray-500">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.slice(0, 5).map(listing => (
                      <tr key={listing.id} className="border-b last:border-0">
                        <td className="py-3 pr-2 font-medium max-w-[200px] truncate">{listing.title}</td>
                        <td className="py-2">{listing.views}</td>
                        <td className="py-2">{listing.inquiries}</td>
                        <td className="py-2">{listing.conversionRate.toFixed(1)}%</td>
                        <td className="py-2">
                          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                            {listing.status === 'active' ? 'نشط' : listing.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Rank Badge */}
          <RankBadge {...rank} />

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>رؤى وتحليلات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle>مصادر الزوار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trafficSources.slice(0, 5).map(source => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{source.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-10 text-left">{source.percentage}%</span>
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${source.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>التوزيع الجغرافي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {geographicData.map(geo => (
              <div key={geo.city} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">{geo.city}</p>
                <p className="text-2xl font-bold text-primary mt-1">{geo.count}</p>
                <p className="text-xs text-gray-500">{geo.percentage}% من الزوار</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>الأداء حسب الفئة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-right">
                  <th className="pb-2 font-medium text-gray-500">الفئة</th>
                  <th className="pb-2 font-medium text-gray-500">الإعلانات</th>
                  <th className="pb-2 font-medium text-gray-500">المشاهدات</th>
                  <th className="pb-2 font-medium text-gray-500">الإيرادات</th>
                  <th className="pb-2 font-medium text-gray-500">متوسط السعر</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.categoryId} className="border-b last:border-0">
                    <td className="py-3 pr-2 font-medium">{cat.category}</td>
                    <td className="py-2">{cat.listings}</td>
                    <td className="py-2">{cat.views.toLocaleString('ar-MA')}</td>
                    <td className="py-2 font-medium text-green-600">{cat.revenue.toLocaleString('ar-MA')} MAD</td>
                    <td className="py-2">{cat.avgPrice.toLocaleString('ar-MA')} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedSellerDashboard;
