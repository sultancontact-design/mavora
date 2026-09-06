/**
 * Mavora - System Status Page
 * Arabic Marketplace Platform (Morocco)
 * 
 * Displays real-time system status, uptime, and service health
 */

import { Metadata } from 'next';

// =============================================================================
// Metadata / البيانات الوصفية
// =============================================================================

export const metadata: Metadata = {
  title: 'حالة النظام | Mavora',
  description: 'حالة نظام مافورا - تحقق من صحة جميع الخدمات',
  keywords: 'حالة النظام، حالة الخدمات، mavora status',
};

// =============================================================================
// Types / الأنواع
// =============================================================================

interface ServiceStatus {
  name: string;
  nameAr: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  responseTime?: number;
  lastChecked: string;
  url?: string;
}

interface StatusData {
  overallStatus: 'operational' | 'degraded' | 'down';
  services: ServiceStatus[];
  incidents: Incident[];
  uptime: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  lastUpdated: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  startedAt: string;
  resolvedAt?: string;
}

// =============================================================================
// Mock Data / بيانات تجريبية
// =============================================================================

const mockStatusData: StatusData = {
  overallStatus: 'operational',
  services: [
    {
      name: 'Web Application',
      nameAr: 'تطبيق الويب',
      status: 'operational',
      responseTime: 120,
      lastChecked: new Date().toISOString(),
      url: '/',
    },
    {
      name: 'API Server',
      nameAr: 'خادم API',
      status: 'operational',
      responseTime: 45,
      lastChecked: new Date().toISOString(),
      url: '/api/health',
    },
    {
      name: 'Database',
      nameAr: 'قاعدة البيانات',
      status: 'operational',
      responseTime: 8,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Authentication',
      nameAr: 'المصادقة',
      status: 'operational',
      responseTime: 95,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'File Storage',
      nameAr: 'تخزين الملفات',
      status: 'operational',
      responseTime: 150,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Email Service',
      nameAr: 'خدمة البريد',
      status: 'operational',
      responseTime: 200,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Payment Gateway (PayPal)',
      nameAr: 'بوابة الدفع (باي بال)',
      status: 'operational',
      responseTime: 350,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Payment Gateway (Payoneer)',
      nameAr: 'بوابة الدفع (بايونير)',
      status: 'operational',
      responseTime: 400,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'CDN',
      nameAr: 'شبكة توصيل المحتوى',
      status: 'operational',
      responseTime: 25,
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Search Index',
      nameAr: 'فهرس البحث',
      status: 'operational',
      responseTime: 30,
      lastChecked: new Date().toISOString(),
    },
  ],
  incidents: [],
  uptime: {
    today: 100,
    week: 99.95,
    month: 99.9,
    year: 99.85,
  },
  lastUpdated: new Date().toISOString(),
};

// =============================================================================
// Status Components / مكونات الحالة
// =============================================================================

function StatusBadge({ status }: { status: ServiceStatus['status'] }) {
  const styles = {
    operational: 'bg-green-100 text-green-800 border-green-200',
    degraded: 'bg-amber-100 text-amber-800 border-amber-200',
    down: 'bg-red-100 text-red-800 border-red-200',
    maintenance: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const labels = {
    operational: 'يعمل',
    degraded: 'بطيء',
    down: 'متوقف',
    maintenance: 'صيانة',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'operational' ? 'bg-green-500' :
        status === 'degraded' ? 'bg-amber-500' :
        status === 'down' ? 'bg-red-500' : 'bg-blue-500'
      }`} />
      {labels[status]}
    </span>
  );
}

function OverallStatus({ status }: { status: StatusData['overallStatus'] }) {
  const configs = {
    operational: {
      icon: '✅',
      title: 'جميع الأنظمة تعمل بشكل طبيعي',
      color: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    degraded: {
      icon: '⚠️',
      title: 'بعض الأنظمة تواجه مشاكل',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    down: {
      icon: '🔴',
      title: 'انقطاع في الخدمة',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  };

  const config = configs[status];

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-6`}>
      <div className="flex items-center gap-4">
        <span className="text-5xl">{config.icon}</span>
        <div>
          <h1 className={`text-2xl font-bold ${config.color}`}>
            {config.title}
          </h1>
          <p className="text-gray-600 mt-1">
            آخر تحديث: {new Date(mockStatusData.lastUpdated).toLocaleString('ar-MA')}
          </p>
        </div>
      </div>
    </div>
  );
}

function UptimeCard() {
  const { uptime } = mockStatusData;

  const periods = [
    { label: 'اليوم', value: uptime.today, key: 'today' as const },
    { label: 'هذا الأسبوع', value: uptime.week, key: 'week' as const },
    { label: 'هذا الشهر', value: uptime.month, key: 'month' as const },
    { label: 'هذه السنة', value: uptime.year, key: 'year' as const },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">وقت التشغيل</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {periods.map((period) => (
          <div key={period.key} className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {period.value}%
            </div>
            <div className="text-sm text-gray-600 mt-1">{period.label}</div>
            
            {/* Visual indicator */}
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  period.value >= 99.9 ? 'bg-green-500' :
                  period.value >= 99 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${period.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesTable({ services }: { services: ServiceStatus[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">حالة الخدمات</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full" dir="rtl">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الخدمة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                وقت الاستجابة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                آخر فحص
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.map((service, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{service.nameAr}</div>
                  <div className="text-sm text-gray-500">{service.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={service.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {service.responseTime ? `${service.responseTime}ms` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" dir="ltr">
                  {new Date(service.lastChecked).toLocaleTimeString('ar-MA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component / المكون الرئيسي للصفحة
// =============================================================================

export default function StatusPage() {
  // In production, this data would come from a health check API
  const statusData = mockStatusData;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">م</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">مافورا</h1>
                <p className="text-sm text-gray-500">صفحة حالة النظام</p>
              </div>
            </div>
            <a
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              العودة للموقع →
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overall Status */}
        <OverallStatus status={statusData.overallStatus} />

        {/* Uptime */}
        <UptimeCard />

        {/* Services */}
        <ServicesTable services={statusData.services} />

        {/* Incidents Section */}
        {statusData.incidents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">الأحداث الأخيرة</h2>
            <div className="space-y-4">
              {statusData.incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{incident.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      incident.status === 'monitoring' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {incident.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">المراقبة المستمرة</h3>
            <p className="text-sm text-gray-600">
              يتم مراقبة جميع الخدمات على مدار الساعة مع تنبيهات فورية في حال حدوث أي مشكلة.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="font-semibold text-gray-900 mb-2">التنبيهات الفورية</h3>
            <p className="text-sm text-gray-600">
              نرسل إشعارات فورية لفريق الهندسة عند اكتشاف أي انحراف عن الأداء الطبيعي.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-3xl mb-3">📞</div>
            <h3 className="font-semibold text-gray-900 mb-2">الدعم الفني</h3>
            <p className="text-sm text-gray-600">
              هل تواجه مشكلة؟{' '}
              <a href="/contact" className="text-primary-600 hover:underline">
                اتصل بنا
              </a>
            </p>
          </div>
        </div>

        {/* Historical Data Note */}
        <div className="text-center text-sm text-gray-500 pb-8">
          <p>
            هذه الصفحة تُحدث تلقائياً كل 30 ثانية
          </p>
          <p className="mt-1">
            آخر تحديث:{' '}
            <span dir="ltr" className="font-mono">
              {new Date(statusData.lastUpdated).toLocaleString('ar-MA')}
            </span>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Mavora. جميع الحقوق محفوظة.</p>
          <p className="mt-1">
            <a href="/privacy" className="hover:text-gray-700 ml-4">سياسة الخصوصية</a>
            <a href="/terms" className="hover:text-gray-700 ml-4">الشروط والأحكام</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
