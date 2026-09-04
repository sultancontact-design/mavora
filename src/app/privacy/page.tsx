import { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | MAVORA',
  description: 'سياسة خصوصية مافورا - كيف نجمع ونستخدم ونحمي بياناتك',
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
