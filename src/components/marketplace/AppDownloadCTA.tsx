'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, Download, ArrowRight, Star, Shield, Zap, Bell,
  Apple, Play, QrCode, ChevronDown
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

/* ── App Features Data ── */
const APP_FEATURES = [
  {
    icon: Zap,
    textAr: 'إشعارات فورية للعروض الجديدة',
    textEn: 'Instant notifications for new offers',
    textFr: 'Notifications instantanées pour les nouvelles offres',
  },
  {
    icon: Shield,
    textAr: 'دفع آمن ومشفر بالكامل',
    textEn: 'Secure & fully encrypted payments',
    textFr: 'Paiements sécurisés et entièrement chiffrés',
  },
  {
    icon: Bell,
    textAr: 'تنبيهات مخصصة حسب اهتماماتك',
    textEn: 'Custom alerts based on your interests',
    textFr: 'Alertes personnalisées selon vos intérêts',
  },
];

/* ════════════════════════════════════════════════════════════════════
    MAIN APP DOWNLOAD CTA COMPONENT
   ════════════════════════════════════════════════════════════════════ */

interface AppDownloadCTAProps {
  variant?: 'default' | 'compact' | 'minimal';
}

export default function AppDownloadCTA({ variant = 'default' }: AppDownloadCTAProps) {
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Get localized text helper
  const getText = (texts: { ar?: string; en?: string; fr?: string }) => {
    return locale === 'ar' ? texts.ar : locale === 'fr' ? texts.fr : texts.en;
  };

  if (variant === 'minimal') {
    return (
      <section dir={isRtl ? 'rtl' : 'ltr'} className="py-12 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-start">
              <h3 className="text-xl font-bold mb-1">
                {locale === 'ar' ? 'حمّل تطبيق مافورا' : locale === 'fr' ? 'Téléchargez l\'application Mavora' : 'Download Mavora App'}
              </h3>
              <p className="text-white/80 text-sm">
                {locale === 'ar' ? 'متاح على iOS و Android' : locale === 'fr' ? 'Disponible sur iOS et Android' : 'Available on iOS & Android'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {/* App Store Button */}
              <a
                href="/coming-soon"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black rounded-xl hover:bg-gray-900 transition-colors"
                aria-label="Download on App Store"
                onClick={(e) => { e.preventDefault(); alert('قريباً على App Store'); }}
              >
                <Apple className="w-6 h-6" />
                <div className="text-start">
                  <div className="text-[10px] leading-none opacity-80">Download on the</div>
                  <div className="text-sm font-semibold -mt-0.5">App Store</div>
                </div>
              </a>

              {/* Google Play Button */}
              <a
                href="/coming-soon"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black rounded-xl hover:bg-gray-900 transition-colors"
                aria-label="Get it on Google Play"
                onClick={(e) => { e.preventDefault(); alert('قريباً على Google Play'); }}
              >
                <Play className="w-5 h-5 fill-current" />
                <div className="text-start">
                  <div className="text-[10px] leading-none opacity-80">GET IT ON</div>
                  <div className="text-sm font-semibold -mt-0.5">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'compact') {
    return (
      <section dir={isRtl ? 'rtl' : 'ltr'} className="py-16 bg-gradient-to-br from-primary to-teal-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-start">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
                <Smartphone className="w-4 h-4" />
                {locale === 'ar' ? 'تطبيق الجوال' : locale === 'fr' ? 'Application mobile' : 'Mobile App'}
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {locale === 'ar' 
                  ? 'مافورا في جيبك'
                  : locale === 'fr'
                    ? 'Mavora dans votre poche'
                    : 'Mavora in Your Pocket'
                }
              </h2>
              
              <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto lg:mx-0">
                {locale === 'ar'
                  ? 'حمّل التطبيق واستمتع بتجربة تسوق سلسة أينما كنت'
                  : locale === 'fr'
                    ? 'Téléchargez l\'application et profitez d\'une expérience d\'achat fluide où que vous soyez'
                    : 'Download the app and enjoy a seamless shopping experience wherever you are'
                }
              </p>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                {APP_FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-white/90">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <feature.icon className="w-4 h-4" />
                    </div>
                    <span>{getText(feature)}</span>
                  </div>
                ))}
              </div>

              {/* Store Buttons */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <a
                  href="/coming-soon"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-black rounded-xl hover:bg-gray-900 transition-all duration-300 hover:scale-105 shadow-lg"
                  aria-label="Download on App Store"
                  onClick={(e) => { e.preventDefault(); alert('قريباً على App Store'); }}
                >
                  <Apple className="w-7 h-7" />
                  <div className="text-start">
                    <div className="text-[11px] leading-none opacity-70">Download on the</div>
                    <div className="text-base font-semibold -mt-0.5">App Store</div>
                  </div>
                </a>

                <a
                  href="/coming-soon"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-black rounded-xl hover:bg-gray-900 transition-all duration-300 hover:scale-105 shadow-lg"
                  aria-label="Get it on Google Play"
                  onClick={(e) => { e.preventDefault(); alert('قريباً على Google Play'); }}
                >
                  <Play className="w-6 h-6 fill-current" />
                  <div className="text-start">
                    <div className="text-[11px] leading-none opacity-70">GET IT ON</div>
                    <div className="text-base font-semibold -mt-0.5">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative flex-shrink-0">
              <div className="relative w-[280px] sm:w-[320px]">
                {/* Phone Frame */}
                <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                    {/* Screen Content Mockup */}
                    <div className="h-full bg-gradient-to-b from-primary/10 to-violet/10 p-4">
                      {/* Status Bar */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-16 h-2 bg-muted rounded-full" />
                        <div className="w-8 h-2 bg-muted rounded-full" />
                      </div>
                      
                      {/* Search Bar Mockup */}
                      <div className="h-10 bg-muted rounded-xl mb-4" />
                      
                      {/* Categories Grid Mockup */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="aspect-square bg-gradient-to-br from-primary/20 to-violet/20 rounded-xl" />
                        ))}
                      </div>
                      
                      {/* Listing Cards Mockup */}
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-white rounded-xl shadow-sm p-2 flex gap-2">
                            <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-1.5 pt-1">
                              <div className="h-2 bg-muted rounded w-3/4" />
                              <div className="h-2 bg-muted rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Notch */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full" />
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 px-3 py-2 bg-gold text-white rounded-xl text-sm font-bold shadow-lg animate-bounce">
                  ⭐ 4.9
                </div>
                
                <div className="absolute -bottom-2 -left-4 px-3 py-2 bg-emerald text-white rounded-xl text-xs font-medium shadow-lg">
                  +50K تحميل
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default / Full Featured Variant
  return (
    <section 
      ref={sectionRef}
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      
      {/* Background with Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-teal-700 via-violet-900 to-primary" />
      
      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[120px]" />
      </div>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-start">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6 border border-white/20">
              <Smartphone className="w-4 h-4 text-gold" />
              {locale === 'ar' ? 'تطبيق الجوال متاح الآن' : locale === 'fr' ? 'Application mobile disponible maintenant' : 'Mobile App Now Available'}
              <Star className="w-4 h-4 text-gold fill-current" />
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
              {locale === 'ar' && (
                <>
                  <span className="block">مافورا في جيبك،</span>
                  <span className="block mt-2">
                    <span className="bg-gradient-to-l from-gold via-orange-300 to-gold bg-clip-text text-transparent animate-gradient bg-[size:200%_200%]">
                      أينما ذهبت!
                    </span>
                  </span>
                </>
              )}
              {locale === 'fr' && (
                <>
                  <span className="block">Mavora dans votre poche,</span>
                  <span className="block mt-2">
                    <span className="bg-gradient-to-r from-gold via-orange-300 to-gold bg-clip-text text-transparent animate-gradient bg-[size:200%_200%]]">
                      où que vous alliez !
                    </span>
                  </span>
                </>
              )}
              {locale === 'en' && (
                <>
                  <span className="block">Mavora in Your Pocket,</span>
                  <span className="block mt-2">
                    <span className="bg-gradient-to-r from-gold via-orange-300 to-gold bg-clip-text text-transparent animate-gradient bg-[size:200%_200%]">
                      Wherever You Go!
                    </span>
                  </span>
                </>
              )}
            </h2>

            {/* Description */}
            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {locale === 'ar'
                ? 'حمّل تطبيق مافورا واستمتع بتجربة تسوق استثنائية مع إشعارات فورية وبحث ذكى ودفع آمن.'
                : locale === 'fr'
                  ? 'Téléchargez l\'application Mavora et profitez d\'une expérience d\'achat exceptionnelle avec des notifications instantanées, une recherche intelligente et des paiements sécurisés.'
                  : 'Download the Mavora app and enjoy an exceptional shopping experience with instant notifications, smart search, and secure payments.'
              }
            </p>

            {/* Features */}
            <div className="space-y-4 mb-10">
              {APP_FEATURES.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-white/90 font-medium text-lg">{getText(feature)}</span>
                </div>
              ))}
            </div>

            {/* App Store Buttons */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              {/* App Store */}
              <a
                href="/coming-soon"
                className="group inline-flex items-center gap-3 px-7 py-4 bg-black rounded-2xl hover:bg-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg"
                aria-label="Download on App Store"
                onClick={(e) => { e.preventDefault(); alert('قريباً على App Store'); }}
              >
                <Apple className="w-8 h-8 text-white" />
                <div className="text-start">
                  <div className="text-[11px] leading-none text-white/60">Download on the</div>
                  <div className="text-xl font-semibold text-white -mt-0.5">App Store</div>
                </div>
              </a>

              {/* Google Play */}
              <a
                href="/coming-soon"
                className="group inline-flex items-center gap-3 px-7 py-4 bg-black rounded-2xl hover:bg-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg"
                aria-label="Get it on Google Play"
                onClick={(e) => { e.preventDefault(); alert('قريباً على Google Play'); }}
              >
                <Play className="w-7 h-7 text-white fill-current" />
                <div className="text-start">
                  <div className="text-[11px] leading-none text-white/60">GET IT ON</div>
                  <div className="text-xl font-semibold text-white -mt-0.5">Google Play</div>
                </div>
              </a>

              {/* QR Code Option */}
              <button
                className="group hidden sm:inline-flex items-center gap-2 px-5 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300"
                aria-label="Scan QR Code"
              >
                <QrCode className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <span className="text-white font-medium">{locale === 'ar' ? 'مسح QR' : 'Scan QR'}</span>
              </button>
            </div>
          </div>

          {/* Right - Phone Mockup */}
          <div className="flex-shrink-0 relative">
            <div className="relative w-[280px] sm:w-[320px] lg:w-[340px] mx-auto">
              
              {/* Glow Effect Behind Phone */}
              <div className="absolute inset-0 bg-gradient-to-r from-gold/30 via-transparent to-violet/30 rounded-[4rem] blur-2xl scale-110" />
              
              {/* Phone Frame */}
              <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19.5] shadow-inner">
                  {/* Screen Content */}
                  <div className="h-full bg-gradient-to-b from-slate-50 to-white p-4 flex flex-col">
                    
                    {/* Status Bar */}
                    <div className="flex justify-between items-center mb-4 px-1">
                      <span className="text-xs font-medium text-foreground">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-2 bg-foreground rounded-sm" />
                      </div>
                    </div>

                    {/* Header */}
                    <div className="mb-4">
                      <div className="h-5 w-24 bg-foreground/10 rounded-lg mb-2" />
                      <div className="h-3 w-32 bg-foreground/5 rounded" />
                    </div>

                    {/* Search Bar */}
                    <div className="h-10 bg-foreground/5 rounded-xl flex items-center px-3 mb-4">
                      <div className="w-4 h-4 rounded-full bg-foreground/10 me-2" />
                      <div className="h-3 w-20 bg-foreground/10 rounded" />
                    </div>

                    {/* Categories */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {['🚗', '🏠', '📱', '💼'].map((emoji, i) => (
                        <div key={i} className="aspect-square bg-gradient-to-br from-primary/10 to-violet/10 rounded-xl flex items-center justify-center text-xl">
                          {emoji}
                        </div>
                      ))}
                    </div>

                    {/* Featured Section */}
                    <div className="mb-3">
                      <div className="h-4 w-20 bg-foreground/10 rounded mb-2" />
                    </div>

                    {/* Listing Cards */}
                    <div className="space-y-2 flex-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-white rounded-xl shadow-sm border border-border/50 p-2 flex gap-2">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-violet/20 rounded-lg flex-shrink-0" />
                          <div className="flex-1 py-1 space-y-1.5">
                            <div className="h-2.5 bg-foreground/10 rounded w-3/4" />
                            <div className="h-2 bg-foreground/5 rounded w-1/2" />
                            <div className="h-2.5 w-12 bg-emerald/20 rounded mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Nav */}
                    <div className="flex justify-around pt-3 border-t border-border/50 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`w-8 h-8 rounded-xl ${i === 1 ? 'bg-primary/20' : ''}`} />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-900 rounded-full" />
              </div>

              {/* Floating Badges */}
              <div className="absolute -top-3 -end-3 px-4 py-2 bg-gradient-to-r from-gold to-orange-400 text-white rounded-xl shadow-lg animate-bounce">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-white" />
                  <span className="font-bold">4.9</span>
                </div>
              </div>

              <div className="absolute bottom-20 -start-6 px-3 py-2 bg-emerald text-white rounded-xl shadow-lg text-sm font-medium">
                +50K {locale === 'ar' ? 'تحميل' : 'downloads'}
              </div>

              {/* Notification Popup */}
              <div className="absolute top-1/3 -end-8 bg-white rounded-2xl shadow-xl p-3 w-48 animate-float hidden lg:block">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-emerald/20 rounded-full flex items-center justify-center text-sm">✓</div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{locale === 'ar' ? 'تم البيع!' : 'Sold!'}</div>
                    <div className="text-[10px] text-muted-foreground">{locale === 'ar' ? 'منذ دقيقتين' : '2 min ago'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { APP_FEATURES };
