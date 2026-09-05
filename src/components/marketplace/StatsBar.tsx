'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Package, ArrowLeftRight, MapPin, Star, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

/* ── Animated Counter Hook ── */
function useAnimatedCounter(
  end: number,
  duration: number = 2000,
  startOnView: boolean = true
): { count: number; ref: React.RefObject<HTMLDivElement | null> } {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const animate = useCallback(() => {
    if (hasStarted) return;
    setHasStarted(true);
    
    const startTime = Date.now();
    const animateValue = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function - ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * end);
      
      setCount(current);
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(animateValue);
  }, [end, duration, hasStarted]);

  useEffect(() => {
    if (!startOnView) {
      animate();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [animate, startOnView]);

  return { count, ref };
}

/* ── Stat Card Component ── */
interface StatCardProps {
  icon: React.ElementType;
  value: number;
  suffix?: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  gradient: string;
  delay?: number;
}

function StatCard({ 
  icon: Icon, 
  value, 
  suffix = '', 
  labelAr, 
  labelFr, 
  labelEn, 
  gradient,
  delay = 0 
}: StatCardProps) {
  const { locale } = useTranslation();
  const { count, ref } = useAnimatedCounter(value, 2000);
  const isRtl = locale === 'ar';
  
  const label = locale === 'ar' ? labelAr : locale === 'fr' ? labelFr : labelEn;

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-lg transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border border-border/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Gradient on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      {/* Icon Container */}
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl sm:text-4xl font-bold text-foreground">
          {count.toLocaleString(isRtl ? 'ar-SA' : 'en-US')}
        </span>
        {suffix && (
          <span className="text-xl font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      
      {/* Label */}
      <p className="text-sm text-muted-foreground font-medium">
        {label}
      </p>

      {/* Decorative Corner */}
      <div className={`absolute -top-8 -end-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`} />
    </div>
  );
}

/* ── Stats Data ── */
const STATS_DATA = [
  {
    icon: Users,
    value: 150000,
    suffix: '+',
    labelAr: 'مستخدم نشط',
    labelFr: 'Utilisateurs actifs',
    labelEn: 'Active Users',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Package,
    value: 50000,
    suffix: '+',
    labelAr: 'إعلان معروض',
    labelFr: 'Annonces publiées',
    labelEn: 'Listings Posted',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: ArrowLeftRight,
    value: 25000,
    suffix: '+',
    labelAr: 'صفقة ناجحة',
    labelFr: 'Transactions réussies',
    labelEn: 'Successful Deals',
    gradient: 'from-gold to-orange-500',
  },
  {
    icon: MapPin,
    value: 48,
    suffix: '',
    labelAr: 'مدينة مغربية',
    labelFr: 'Villes marocaines',
    labelEn: 'Moroccan Cities',
    gradient: 'from-coral to-red-500',
  },
];

/* ════════════════════════════════════════════════════════════════════
    MAIN STATS BAR COMPONENT
   ════════════════════════════════════════════════════════════════════ */

interface StatsBarProps {
  variant?: 'default' | 'compact' | 'featured';
}

export default function StatsBar({ variant = 'default' }: StatsBarProps) {
  const { locale } = useTranslation();
  const isRtl = locale === 'ar';

  if (variant === 'compact') {
    return (
      <section className="relative py-8 bg-gradient-to-r from-primary/5 via-transparent to-violet/5 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {STATS_DATA.map((stat, index) => (
              <StatCard key={index} {...stat} delay={index * 100} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'featured') {
    return (
      <section dir={isRtl ? 'rtl' : 'ltr'} className="relative py-16 sm:py-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-teal-700 to-violet-900" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(at 70% 50%, rgba(245,158,11,0.15) 0%, transparent 50%)
            `,
          }}
        />
        
        {/* Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4 text-gold" />
              {locale === 'ar' ? 'مافورا بالأرقام' : locale === 'fr' ? 'Mavora en chiffres' : 'Mavora by Numbers'}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              {locale === 'ar' ? 'ثق بمنصة تنمو معك' : locale === 'fr' ? 'Faites confiance à une plateforme qui grandit avec vous' : 'Trust a Platform That Grows With You'}
            </h2>
            <p className="text-white/70 max-w-xl mx-auto">
              {locale === 'ar' ? 'نفتخر بأرقام تعكس ثقة المستخدمين في منصتنا' : locale === 'fr' ? 'Nous sommes fiers de chiffres qui reflètent la confiance des utilisateurs' : 'Proud numbers that reflect user trust in our platform'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STATS_DATA.map((stat, index) => (
              <div
                key={index}
                className="group relative text-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <StatCounter end={stat.value} suffix={stat.suffix} />
                </div>
                
                <p className="text-white/80 text-sm font-medium">
                  {locale === 'ar' ? stat.labelAr : locale === 'fr' ? stat.labelFr : stat.labelEn}
                </p>

                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default variant
  return (
    <section dir={isRtl ? 'rtl' : 'ltr'} className="py-12 sm:py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
            <Star className="w-4 h-4" />
            {locale === 'ar' ? 'مافورا في أرقام' : locale === 'fr' ? 'Mavora en chiffres' : 'Mavora in Numbers'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {locale === 'ar' ? 'منصة تثق بها آلاف المستخدمين' : locale === 'fr' ? 'Une plateforme de confiance pour des milliers d\'utilisateurs' : 'A Trusted Platform for Thousands of Users'}
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS_DATA.map((stat, index) => (
            <StatCard key={index} {...stat} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Standalone Counter Component ── */
function StatCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const { count } = useAnimatedCounter(end, 2000, false);
  
  return (
    <>
      <span className="text-3xl sm:text-4xl font-bold text-white">
        {count.toLocaleString()}
      </span>
      {suffix && <span className="text-xl font-semibold text-white/80">{suffix}</span>}
    </>
  );
}

export { useAnimatedCounter, StatCard };
