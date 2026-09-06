'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Upload, Handshake, ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

/* ── Step Data ── */
const STEPS_DATA = [
  {
    id: 1,
    icon: Search,
    gradient: 'from-blue-500 to-cyan-400',
    bgGradient: 'from-blue-50 to-cyan-50',
    darkBg: 'dark:from-blue-950/20 dark:to-cyan-950/20',
    titleAr: 'ابحث عن ما تريد',
    titleFr: 'Cherchez ce que vous voulez',
    titleEn: 'Search What You Want',
    descAr: 'استخدم محرك البحث المتقدم للعثور على المنتجات أو الخدمات التي تحتاجها في منطقتك',
    descFr: 'Utilisez le moteur de recherche avancé pour trouver les produits ou services dont vous avez besoin dans votre région',
    descEn: 'Use our advanced search engine to find products or services you need in your area',
    emoji: '🔍',
  },
  {
    id: 2,
    icon: Upload,
    gradient: 'from-violet-500 to-purple-400',
    bgGradient: 'from-violet-50 to-purple-50',
    darkBg: 'dark:from-violet-950/20 dark:to-purple-950/20',
    titleAr: 'أضف إعلانك مجاناً',
    titleFr: 'Publiez votre annonce gratuitement',
    titleEn: 'Post Your Listing for Free',
    descAr: 'أنشئ حسابك وأضف إعلاناتك مع صور وفيديو بسهولة تامة ودون أي رسوم',
    descFr: 'Créez votre compte et ajoutez vos annonces avec photos et vidéos facilement et sans aucun frais',
    descEn: 'Create your account and add your listings with photos and videos easily without any fees',
    emoji: '📝',
  },
  {
    id: 3,
    icon: Handshake,
    gradient: 'from-emerald-500 to-teal-400',
    bgGradient: 'from-emerald-50 to-teal-50',
    darkBg: 'dark:from-emerald-950/20 dark:to-teal-950/20',
    titleAr: 'تواصل وتداول بأمان',
    titleFr: 'Communiquez et échangez en toute sécurité',
    titleEn: 'Connect & Trade Safely',
    descAr: 'تواصل مباشرة مع البائعين وأتمم صفقاتك بثقة مع نظام حماية مشترياتك',
    descFr: 'Communiquez directement avec les vendeurs et finalisez vos transactions en confiance avec notre système de protection',
    descEn: 'Connect directly with sellers and complete your transactions with confidence using our protection system',
    emoji: '🤝',
  },
];

/* ── Animated Step Card Component ── */
interface StepCardProps {
  step: typeof STEPS_DATA[0];
  index: number;
  isActive: boolean;
  isRtl: boolean;
  locale: string;
}

function StepCard({ step, index, isActive, isRtl, locale }: StepCardProps) {
  const Icon = step.icon;
  
  const title = locale === 'ar' ? step.titleAr : locale === 'fr' ? step.titleFr : step.titleEn;
  const desc = locale === 'ar' ? step.descAr : locale === 'fr' ? step.descFr : step.descEn;

  return (
    <div 
      className={`
        relative group
        transition-all duration-700 ease-out
        ${isActive 
          ? 'opacity-100 scale-100' 
          : 'opacity-60 scale-95'
        }
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Card Container */}
      <div className={`
        relative overflow-hidden rounded-3xl p-8 md:p-10
        bg-gradient-to-br ${step.bgGradient} ${step.darkBg}
        border border-border/50
        transition-all duration-500
        hover:shadow-xl hover:-translate-y-2
        h-full
      `}>
        
        {/* Background Decoration */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${step.gradient} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />
        
        {/* Step Number */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`
            flex items-center justify-center w-14 h-14 rounded-2xl
            bg-gradient-to-br ${step.gradient}
            shadow-lg group-hover:scale-110 group-hover:rotate-6
            transition-all duration-300
          `}>
            <span className="text-2xl">{step.emoji}</span>
          </div>
          
          <div>
            <span className={`text-sm font-bold bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
              {locale === 'ar' ? `الخطوة ${step.id}` : locale === 'fr' ? `Étape ${step.id}` : `Step ${step.id}`}
            </span>
            {isActive && (
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {locale === 'ar' ? 'نشط الآن' : locale === 'fr' ? 'Actif' : 'Active'}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
          {title}
        </h3>
        
        <p className="text-muted-foreground leading-relaxed">
          {desc}
        </p>

        {/* Bottom Accent Line */}
        <div className={`absolute bottom-0 start-0 h-1 w-0 bg-gradient-to-r ${step.gradient} group-hover:w-full transition-all duration-500 rounded-tl-full rounded-tr-full`} />
      </div>

      {/* Connector Line (except for last item) */}
      {index < STEPS_DATA.length - 1 && (
        <div className={`
          hidden lg:flex absolute top-1/2 -translate-y-1/2
          ${isRtl ? '-start-8' : '-end-8'} w-8 items-center justify-center
        `}>
          <ArrowRight className={`w-5 h-5 text-muted-foreground/30 ${isRtl ? 'rotate-180' : ''}`} />
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
    MAIN HOW IT WORKS COMPONENT
   ════════════════════════════════════════════════════════════════════ */

interface HowItWorksProps {
  variant?: 'default' | 'compact' | 'horizontal';
}

export default function HowItWorks({ variant = 'default' }: HowItWorksProps) {
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';
  const [activeStep, setActiveStep] = useState(0);
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

  // Auto-rotate active step
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS_DATA.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  if (variant === 'horizontal') {
    return (
      <section ref={sectionRef} dir={isRtl ? 'rtl' : 'ltr'} className="py-16 sm:py-20 bg-muted/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              {locale === 'ar' ? 'كيف يعمل؟' : locale === 'fr' ? 'Comment ça marche ?' : 'How It Works?'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {locale === 'ar' ? 'ثلاث خطوات بسيطة للبدء' : locale === 'fr' ? 'Trois étapes simples pour commencer' : 'Three Simple Steps to Get Started'}
            </h2>
          </div>

          {/* Horizontal Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS_DATA.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                isActive={activeStep === index}
                isRtl={isRtl}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'compact') {
    return (
      <section dir={isRtl ? 'rtl' : 'ltr'} className="py-12 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Left Content */}
            <div className="md:w-1/3">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {locale === 'ar' ? 'كيف يعمل مافورا؟' : locale === 'fr' ? 'Comment fonctionne Mavora ?' : 'How Mavora Works'}
              </h3>
              <p className="text-muted-foreground">
                {locale === 'ar' ? 'ثلاث خطوات فقط للبدء في البيع والشراء' : locale === 'fr' ? 'Seulement trois étapes pour commencer à acheter et vendre' : 'Just three steps to start buying and selling'}
              </p>
            </div>

            {/* Right Steps */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              {STEPS_DATA.map((step, index) => {
                const Icon = step.icon;
                const title = locale === 'ar' ? step.titleAr : locale === 'fr' ? step.titleFr : step.titleEn;
                
                return (
                  <div key={step.id} className="text-center group">
                    <div className={`
                      inline-flex items-center justify-center w-12 h-12 rounded-xl
                      bg-gradient-to-br ${step.gradient} mb-3
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {locale === 'ar' ? `خطوة ${step.id}` : locale === 'fr' ? `Étape ${step.id}` : `Step ${step.id}`}
                    </div>
                    <div className="text-sm font-semibold text-foreground">{title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default variant - Full Featured
  return (
    <section 
      ref={sectionRef}
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -start-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -end-32 w-64 h-64 bg-violet/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ═════════════════════ HEADER ═════════════════════ */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-violet/10 to-gold/10 text-sm font-bold text-foreground mb-6 border border-border/50">
            <Sparkles className="w-4 h-4 text-gold" />
            {locale === 'ar' ? 'سهل وسريع' : locale === 'fr' ? 'Simple et rapide' : 'Easy & Fast'}
            <Sparkles className="w-4 h-4 text-violet" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
            {locale === 'ar' && (
              <>
                كيف يعمل{' '}
                <span className="bg-gradient-to-l from-primary to-violet bg-clip-text text-transparent">مافورا</span>؟
              </>
            )}
            {locale === 'fr' && (
              <>
                Comment fonctionne{' '}
                <span className="bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">Mavora</span> ?
              </>
            )}
            {locale === 'en' && (
              <>
                How does{' '}
                <span className="bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">Mavora</span> work?
              </>
            )}
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {locale === 'ar'
              ? 'ابدأ رحلتك في ثلاث خطوات بسيطة فقط. سجل، أضف إعلانك، وابدأ في البيع!'
              : locale === 'fr'
                ? 'Commencez votre voyage en seulement trois étapes simples. Inscrivez-vous, publiez votre annonce et commencez à vendre !'
                : 'Start your journey in just three simple steps. Sign up, post your listing, and start selling!'
            }
          </p>
        </div>

        {/* ═════════════════════ STEPS GRID ═════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS_DATA.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              isActive={activeStep === index}
              isRtl={isRtl}
              locale={locale}
            />
          ))}
        </div>

        {/* ═════════════════════ CTA BUTTON ═════════════════════ */}
        <div className={`text-center mt-12 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Button
            size="lg"
            className="px-8 py-6 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            {locale === 'ar' ? 'ابدأ الآن مجاناً' : locale === 'fr' ? 'Commencer gratuitement' : 'Get Started for Free'}
            <ArrowRight className={`ms-2 w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </Button>
          
          <p className="mt-4 text-sm text-muted-foreground">
            {locale === 'ar' ? 'لا حاجة لبطاقة ائتمان • إنشاء حساب في دقيقة واحدة' : locale === 'fr' ? 'Pas de carte de crédit requise • Création de compte en 1 minute' : 'No credit card required • Account setup in 1 minute'}
          </p>
        </div>
      </div>
    </section>
  );
}

export { STEPS_DATA, StepCard };
