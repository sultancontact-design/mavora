/**
 * صفحة الرسائل والمحادثات
 * Messages & Conversations Page
 * 
 * @features
 * - Full chat interface
 * - Conversation list sidebar
 * - Mobile responsive layout
 * - Real-time messaging
 * - Arabic RTL support
 */

import { Metadata } from 'next';
import MessagesPageClient from './MessagesPageClient';

// ==================== Metadata ====================

export const metadata: Metadata = {
  title: 'الرسائل | مافورا',
  description: 'محادثاتك مع البائعين والمشتريين في سوق مافورا المغربي',
};

// ==================== Page Component ====================

export default function MessagesPage() {
  return <MessagesPageClient />;
}
