/**
 * صفحة مركز الإشعارات
 * Notification Center Page
 */

import { Metadata } from 'next';
import NotificationCenter from '@/components/notifications/notification-center';

// ==================== Metadata ====================

export const metadata: Metadata = {
  title: 'الإشعارات | مافورا',
  description: 'جميع إشعاراتك في سوق مافورا المغربي',
};

// ==================== Page Component ====================

export default function NotificationsPage() {
  return <NotificationCenter />;
}
