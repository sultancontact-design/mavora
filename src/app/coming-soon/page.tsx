'use client';

import { useTranslation } from '@/hooks/useTranslation';
import MavoraLogo from '@/components/common/MavoraLogo';
import { Smartphone, Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ComingSoonPage() {
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <MavoraLogo size="lg" className="text-white justify-center mb-8" />
        
        {/* Phone Icon */}
        <div className="mx-auto mb-8 flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-2xl shadow-teal-500/30">
          <Smartphone className="size-12 text-white" />
        </div>
        
        {/* Content */}
        <h1 className="mb-4 text-4xl font-extrabold text-white">
          {locale === 'ar' ? 'قريباً!' : locale === 'fr' ? 'Bientôt disponible !' : 'Coming Soon!'}
        </h1>
        <p className="mb-8 text-lg text-gray-400 leading-relaxed">
          {locale === 'ar'
            ? 'نعمل بجد لإطلاق تطبيق مافورا للموبايل. سيعطيك تجربة أفضل وأسرع للتصفح والبيع والشراء.'
            : locale === 'fr'
              ? 'Nous travaillons dur pour lancer l\'application mobile MAVORA. Elle vous offrira une meilleure et plus rapide expérience de navigation, d\'achat et de vente.'
              : 'We\'re working hard to launch the MAVORA mobile app. It will give you a better and faster experience for browsing, buying, and selling.'}
        </p>
        
        {/* Notification Signup */}
        {!isSubscribed ? (
          <form onSubmit={handleSubscribe} className="mb-8">
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={locale === 'ar' ? 'بريدك الإلكتروني' : locale === 'fr' ? 'Votre e-mail' : 'Your email'}
                className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-teal-500/30 transition-all"
              >
                <Bell className="size-5" />
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {locale === 'ar'
                ? 'سنُعلمك عند إطلاق التطبيق'
                : locale === 'fr'
                  ? 'Nous vous informons au lancement de l\'application'
                  : 'We\'ll notify you when the app launches'}
            </p>
          </form>
        ) : (
          <div className="mb-8 rounded-xl bg-green-500/20 border border-green-500/30 p-4">
            <p className="text-green-400 font-medium">
              ✅ {locale === 'ar' ? 'تم التسجيل بنجاح!' : locale === 'fr' ? 'Inscrit avec succès !' : 'Successfully subscribed!'}
            </p>
          </div>
        )}
        
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className={`size-4 ${locale === 'ar' ? '' : 'rotate-180'}`} />
          {locale === 'ar' ? 'العودة للموقع' : locale === 'fr' ? 'Retour au site' : 'Back to website'}
        </Link>
      </div>
    </div>
  );
}
