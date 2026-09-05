'use client';

/**
 * AdminCharts Component - لوحة الرسوم البيانية التفاعلية
 * 2026 Modern Design with Recharts & Motion
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign,
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Types ───────────────────────────────────────────────

interface ChartData {
  date: string;
  listings?: number;
  users?: number;
  revenue?: number;
}

interface ChartsProps {
  data?: {
    charts?: {
      listings: Array<{ date: string; count: number }>;
      users: Array<{ date: string; count: number }>;
    };
    overview?: {
      total_users: number;
      total_listings: number;
      total_revenue: number;
      pending_reports: number;
    };
    categories?: Array<{ id: string; name: string; nameAr?: string; slug: string }>;
    revenue?: {
      total: number;
      monthly: number;
    };
  };
}

// ─── Color Palette (2026 Modern) ──────────────────────────

const COLORS = [
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
];

const GRADIENTS = {
  violet: { start: '#8b5cf6', end: '#c084fc' },
  emerald: { start: '#10b981', end: '#34d399' },
  blue: { start: '#3b82f6', end: '#60a5fa' },
  amber: { start: '#f59e0b', end: '#fbbf24' },
};

// ─── Mock Data (will be replaced with real API data) ──────

const generateMockData = (): { listings: ChartData[]; users: ChartData[]; categoryData: Array<{ name: string; value: number; color: string }> } => {
  const days = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const listings = days.map((date, i) => ({
    date,
    listings: Math.floor(Math.random() * 500) + 200 + (i * 20),
    users: Math.floor(Math.random() * 300) + 100 + (i * 15),
    revenue: Math.floor(Math.random() * 50000) + 10000 + (i * 2000),
  }));

  const categoryData = [
    { name: 'سيارات', value: 35, color: COLORS[0] },
    { name: 'عقارات', value: 25, color: COLORS[1] },
    { name: 'إلكترونيات', value: 20, color: COLORS[2] },
    { name: 'وظائف', value: 10, color: COLORS[3] },
    { name: 'خدمات', value: 7, color: COLORS[4] },
    { name: 'أخرى', value: 3, color: COLORS[5] },
  ];

  return { listings, users: listings, categoryData };
};

// ─── Custom Tooltip Component ──────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('ar-MA') : entry.value}
            </span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
};

// ─── Stats Card with Sparkline ─────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  gradient: typeof GRADIENTS.violet;
  data?: number[];
}

function StatCard({ title, value, change, icon: Icon, gradient, data = [] }: StatCardProps) {
  const isPositive = change >= 0;

  // Generate sparkline data
  const sparkData = data.map((value, i) => ({ value, index: i }));

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(change)}%</span>
                <span className="text-gray-400">من الشهر الماضي</span>
              </div>
            </div>
            
            <div
              className={`p-3 rounded-2xl bg-gradient-to-br ${gradient.start} to-${gradient.end} text-white shadow-lg`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </div>

          {/* Mini Sparkline */}
          {sparkData.length > 0 && (
            <div className="mt-4 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gradient.start} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={gradient.start} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={gradient.start}
                    fill={`url(#gradient-${title})`}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Charts Component ─────────────────────────────────

export default function AdminCharts({ data }: ChartsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  const { listings, categoryData } = useMemo(() => generateMockData(), []);

  // Use real data if available, otherwise use mock
  const chartData = data?.charts?.listings?.map((item, i) => ({
    date: new Date(item.date).toLocaleDateString('ar-MA', { month: 'short' }),
    listings: item.count,
    users: data.charts?.users[i]?.count || 0,
  })) || listings;

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* ─── Header with Time Range Selector ──────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-600" />
            التحليلات والإحصائيات
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">نظرة عامة على أداء المنصة</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(['week', 'month', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={`rounded-lg ${timeRange === range ? 'shadow-md' : ''}`}
            >
              {range === 'week' ? 'أسبوع' : range === 'month' ? 'شهر' : 'سنة'}
            </Button>
          ))}
        </div>
      </div>

      {/* ─── Stats Cards Row ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المستخدمين"
          value={data?.overview?.total_users?.toLocaleString('ar-MA') || '150,000+'}
          change={12.5}
          icon={Users}
          gradient={GRADIENTS.violet}
          data={[30, 45, 35, 50, 49, 60, 70, 75, 80, 85, 90, 95]}
        />
        <StatCard
          title="إجمالي الإعلانات"
          value={data?.overview?.total_listings?.toLocaleString('ar-MA') || '75,000+'}
          change={8.2}
          icon={Package}
          gradient={GRADIENTS.emerald}
          data={[20, 25, 30, 28, 35, 40, 38, 45, 50, 55, 60, 65]}
        />
        <StatCard
          title="الإيرادات"
          value={`${(data?.revenue?.total || 2500000).toLocaleString('ar-MA')} درهم`}
          change={15.3}
          icon={DollarSign}
          gradient={GRADIENTS.blue}
          data={[10, 15, 12, 18, 20, 25, 22, 28, 30, 35, 40, 45]}
        />
        <StatCard
          title="معدل النمو"
          value="+23%"
          change={23}
          icon={TrendingUp}
          gradient={GRADIENTS.amber}
          data={[5, 8, 7, 10, 12, 15, 14, 18, 20, 22, 25, 28]}
        />
      </div>

      {/* ─── Main Charts Grid ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Area Chart - Listings & Users Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                  النمو الشهري
                </CardTitle>
                <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  <Calendar className="w-3 h-3 ml-1" />
                  2026
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient="colorListings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="listings"
                      name="الإعلانات"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#colorListings)"
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="المستخدمون"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart - Monthly Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  الإيرادات الشهرية
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="w-4 h-4" />
                  تصدير
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="revenue"
                      name="الإيرادات (درهم)"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart - Categories Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-600" />
                توزيع التصنيفات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-gray-600 dark:text-gray-300">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Line Chart - User Growth Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                اتجاه نمو المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name="المستخدمون الجدد"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
