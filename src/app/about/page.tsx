import { Metadata } from 'next';
import AboutContent from './AboutClient';

export const metadata: Metadata = {
  title: 'من نحن | MAVORA',
  description: 'تعرف على مافورا - أكبر سوق إلكتروني في المغرب وشمال إفريقيا',
};

export default function AboutPage() {
  return <AboutContent />;
}
