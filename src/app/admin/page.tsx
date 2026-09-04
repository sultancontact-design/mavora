import ProjectStatusDashboard from '@/components/admin/ProjectStatusDashboard';

export const metadata = {
  title: 'لوحة حالة المشروع - مافورا',
  description: 'Mavora Project Status Dashboard - Monitor system health and development progress',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <ProjectStatusDashboard />;
}
