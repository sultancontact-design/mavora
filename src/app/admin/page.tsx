import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';

export const metadata = {
  title: 'لوحة تحكم المسؤول - مافورا',
  description: 'Mavora Admin Dashboard - Manage users, listings, orders and more',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <SuperAdminDashboard />;
}
