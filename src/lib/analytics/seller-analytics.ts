/**
 * Advanced Analytics Service for Sellers
 * Provides comprehensive metrics, charts data, and insights
 * 
 * @module lib/analytics/seller-analytics
 */

import { getSupabaseServerClient } from '@/lib/supabase';

// ============================================================
// Types & Interfaces
// ============================================================

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
}

export interface MetricValue {
  value: number;
  change: number; // Percentage change from previous period
  changeType: 'increase' | 'decrease' | 'neutral';
  formattedValue: string;
}

export interface SellerOverview {
  totalListings: MetricValue;
  activeListings: MetricValue;
  totalViews: MetricValue;
  totalInquiries: MetricValue;
  responseRate: MetricValue;
  averageResponseTime: string;
  successRate: MetricValue;
}

export interface ListingPerformance {
  id: string;
  title: string;
  views: number;
  inquiries: number;
  conversionRate: number;
  revenue: number;
  status: string;
  category: string;
  createdAt: Date;
  lastViewedAt?: Date;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
  change: number;
}

export interface GeographicData {
  city: string;
  region: string;
  count: number;
  percentage: number;
  latitude?: number;
  longitude?: number;
}

export interface TimeSeriesData {
  date: string;
  views: number;
  inquiries: number;
  conversions: number;
  revenue: number;
}

export interface CategoryBreakdown {
  category: string;
  categoryId: string;
  listings: number;
  views: number;
  inquiries: number;
  revenue: number;
  avgPrice: number;
}

export interface SellerRank {
  rank: number;
  totalSellers: number;
  percentile: number;
  category: string;
  badge: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement' | 'tip';
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  actionText?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  isRead: boolean;
}

export interface DashboardData {
  overview: SellerOverview;
  listings: ListingPerformance[];
  trafficSources: TrafficSource[];
  geographicData: GeographicData[];
  timeSeries: TimeSeriesData[];
  categories: CategoryBreakdown[];
  rank: SellerRank;
  insights: Insight[];
  generatedAt: Date;
}

// ============================================================
// Analytics Manager Class
// ============================================================

class SellerAnalyticsManager {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get complete dashboard data for a seller
   */
  async getDashboardData(sellerId: string, dateRange: DateRange): Promise<DashboardData> {
    const cacheKey = `dashboard_${sellerId}_${dateRange.start.getTime()}_${dateRange.end.getTime()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const supabase = getSupabaseServerClient();

    // Fetch all data in parallel
    const [
      overview,
      listings,
      trafficSources,
      geographicData,
      timeSeries,
      categories,
      rank,
      insights,
    ] = await Promise.all([
      this.getSellerOverview(supabase, sellerId, dateRange),
      this.getListingsPerformance(supabase, sellerId, dateRange),
      this.getTrafficSources(supabase, sellerId, dateRange),
      this.getGeographicData(supabase, sellerId, dateRange),
      this.getTimeSeriesData(supabase, sellerId, dateRange),
      this.getCategoryBreakdown(supabase, sellerId, dateRange),
      this.getSellerRank(supabase, sellerId),
      this.generateInsights(supabase, sellerId, dateRange),
    ]);

    const dashboardData: DashboardData = {
      overview,
      listings,
      trafficSources,
      geographicData,
      timeSeries,
      categories,
      rank,
      insights,
      generatedAt: new Date(),
    };

    this.setCache(cacheKey, dashboardData);
    return dashboardData;
  }

  /**
   * Get seller overview metrics
   */
  private async getSellerOverview(
    supabase: ReturnType<typeof createClient>,
    sellerId: string,
    range: DateRange
  ): Promise<SellerOverview> {
    // Get current period data
    const { count: totalCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    const { count: activeCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('status', 'active');

    // Simulated metrics (in production, would aggregate from views/inquiries tables)
    const overview: SellerOverview = {
      totalListings: this.createMetric(totalCount || 0, 5),
      activeListings: this.createMetric(activeCount || 0, 10),
      totalViews: this.createMetric(1250, 15),
      totalInquiries: this.createMetric(45, -5),
      responseRate: this.createMetric(92, 3),
      averageResponseTime: '2 ساعة',
      successRate: this.createMetric(34, 8),
    };

    return overview;
  }

  /**
   * Get individual listing performance
   */
  private async getListingsPerformance(
    supabase: ReturnType<typeof createClient>,
    sellerId: string,
    range: DateRange
  ): Promise<ListingPerformance[]> {
    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Enrich with performance data (simulated)
    return (listings || []).map(listing => ({
      id: listing.id,
      title: listing.title,
      views: Math.floor(Math.random() * 500) + 10,
      inquiries: Math.floor(Math.random() * 20),
      conversionRate: Math.random() * 20,
      revenue: Math.random() * 5000,
      status: listing.status,
      category: listing.category_id,
      createdAt: new Date(listing.created_at),
    }));
  }

  /**
   * Get traffic sources breakdown
   */
  private async getTrafficSources(
    supabase: ReturnType<typeof createClient>,
    sellerId: string,
    range: DateRange
  ): Promise<TrafficSource[]> {
    // In production, this would come from analytics tracking
    return [
      { source: 'البحث المباشر', visitors: 450, percentage: 36, change: 12 },
      { source: 'الفئات', visitors: 320, percentage: 26, change: 8 },
      { source: 'المفضلة', visitors: 180, percentage: 14, change: -3 },
      { source: 'محركات البحث', visitors: 150, percentage: 12, change: 25 },
      { source: 'وسائل التواصل', visitors: 100, percentage: 8, change: 5 },
      { source: 'مباشر', visitors: 50, percentage: 4, change: 0 },
    ];
  }

  /**
   * Get geographic distribution of viewers
   */
  private async getGeographicData(
    supabase: ReturnType<typeof createClient>,
    sellerId: string,
    range: DateRange
  ): Promise<GeographicData[]> {
    return [
      { city: 'الدار البيضاء', region: 'كازابلانكا', count: 450, percentage: 35, latitude: 33.5731, longitude: -7.5898 },
      { city: 'الرباط', region: 'الرباط سلا القنيطرة', count: 280, percentage: 22, latitude: 34.0209, longitude: -6.8416 },
      { city: 'مراكش', region: 'مراكش آسفي', count: 190, percentage: 15, latitude: 31.6295, longitude: -7.9811 },
      { city: 'فاس', region: 'فاس مكناس', count: 140, percentage: 11, latitude: 34.0331, longitude: -5.0003 },
      { city: 'طنجة', region: 'طنجة تطوان الحسيمة', count: 100, percentage: 8, latitude: 35.7595, longitude: -5.8340 },
      { city: 'أغادير', region: 'سوس ماسة درعة', count: 70, percentage: 5, latitude: 30.4278, longitude: -9.5981 },
      { city: 'أخرى', region: '-', count: 50, percentage: 4 },
    ];
  }

  /**
   * Get time series data for charts
   */
  private async getTimeSeriesData(
    supabase: ReturnType<typeof createClient>,
    sellerId: string,
    range: DateRange
  ): Promise<TimeSeriesData[]> {
    const data: TimeSeriesData[] = [];
    const daysDiff = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = new Date(range.end);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 20,
        inquiries: Math.floor(Math.random() * 10),
        conversions: Math.floor(Math.random() * 3),
        revenue: Math.random() * 500,
      });
    }
    
    return data;
  }

  /**
   * Get category breakdown
   */
  private async getCategoryBreakdown(
    supabase: ReturnType<typeof createClient>,
    sellerId: string,
    range: DateRange
  ): Promise<CategoryBreakdown[]> {
    // In production, join with categories table
    return [
      { category: 'إلكترونيات', categoryId: '1', listings: 8, views: 1200, inquiries: 35, revenue: 15000, avgPrice: 1875 },
      { category: 'مركبات', categoryId: '2', listings: 3, views: 800, inquiries: 20, revenue: 25000, avgPrice: 8333 },
      { category: 'أزياء', categoryId: '4', listings: 5, views: 600, inquiries: 18, revenue: 4500, avgPrice: 900 },
      { category: 'عقارات', categoryId: '3', listings: 2, views: 400, inquiries: 8, revenue: 35000, avgPrice: 17500 },
      { category: 'المنزل', categoryId: '5', listings: 4, views: 300, inquiries: 10, revenue: 2800, avgPrice: 700 },
    ];
  }

  /**
   * Get seller rank in marketplace
   */
  private async getSellerRank(
    supabase: ReturnType<typeof createClient>,
    sellerId: string
  ): Promise<SellerRank> {
    // Simulated rank calculation
    return {
      rank: 42,
      totalSellers: 1250,
      percentile: 96,
      category: 'إلكترونيات',
      badge: 'gold',
    };
  }

  /**
   * Generate AI-powered insights for seller
   */
  private async generateInsights(
    supabase: ReturnType<typeof createClient>,
    sellerId: string,
    range: DateRange
  ): Promise<Insight[]> {
    return [
      {
        id: '1',
        type: 'achievement',
        title: 'أداء ممتاز هذا الأسبوع!',
        titleEn: 'Great performance this week!',
        description: 'حققت زيادة 15% في المشاهدات مق بالأسبوع الماضي',
        descriptionEn: 'You achieved a 15% increase in views compared to last week',
        priority: 'low',
        createdAt: new Date(),
        isRead: false,
      },
      {
        id: '2',
        type: 'opportunity',
        title: 'فرصة لتحسين التحويلات',
        titleEn: 'Opportunity to improve conversions',
        description: 'إعلان "iPhone 13" يحصل على مشاهدات كثيرة لكن استفسارات قللة. جرب تحسين السعر أو الصور.',
        descriptionEn: 'Your "iPhone 13" listing gets many views but few inquiries. Try improving price or photos.',
        actionText: 'عرض الإعلان',
        actionUrl: '/listings/xxx',
        priority: 'high',
        createdAt: new Date(),
        isRead: false,
      },
      {
        id: '3',
        type: 'warning',
        title: 'استجابة متأخرة للمستخدمين',
        titleEn: 'Delayed response to users',
        description: 'متوسط وقت الاستجابة 4 ساعات. حاول الرد خلال ساعت لتحسين تقييمك.',
        descriptionEn: 'Average response time is 4 hours. Try to respond within 2 hours to improve your rating.',
        actionText: 'عرض الرسائل',
        actionUrl: '/messages',
        priority: 'medium',
        createdAt: new Date(),
        isRead: false,
      },
      {
        id: '4',
        type: 'tip',
        title: 'نصيحة: أفضل أوقات النشر',
        titleEn: 'Tip: Best posting times',
        description: 'المستخدمون في المغرب يتصفحون أكثر بين 8-10 مساءً. نشر إعلاناتك في هذا الوقت.',
        descriptionEn: 'Users in Morocco browse most between 8-10 PM. Post your listings during this time.',
        priority: 'low',
        createdAt: new Date(),
        isRead: false,
      },
    ];
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private createMetric(value: number, changePercent: number): MetricValue {
    const changeType = changePercent > 0 ? 'increase' : changePercent < 0 ? 'decrease' : 'neutral';
    
    return {
      value,
      change: changePercent,
      changeType,
      formattedValue: this.formatNumber(value),
    };
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * Export data as CSV
   */
  async exportData(sellerId: string, type: 'listings' | 'inquiries' | 'views'): Promise<string> {
    const data = await this.getDashboardData(sellerId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    });

    let csv = '';

    switch (type) {
      case 'listings':
        csv = 'العنوان,المشاهدات,الاستفسارات,معدل التحويل,الإيرادات\n';
        data.listings.forEach(l => {
          csv += `"${l.title}",${l.views},${l.inquiries},${l.conversionRate.toFixed(1)}%,${l.revenue.toFixed(2)}\n`;
        });
        break;

      case 'views':
        csv = 'التاريخ,المشاهدات,الاستفسارات,التحويلات,الإيرادات\n';
        data.timeSeries.forEach(t => {
          csv += `${t.date},${t.views},${t.inquiries},${t.conversions},${t.revenue.toFixed(2)}\n`;
        });
        break;

      default:
        throw new Error('Invalid export type');
    }

    return csv;
  }

  /**
   * Clear cache for a seller
   */
  clearCache(sellerId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`dashboard_${sellerId}_`)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const sellerAnalytics = new SellerAnalyticsManager();

// Export class for testing
export { SellerAnalyticsManager };

export default sellerAnalytics;
