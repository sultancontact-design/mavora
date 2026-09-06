'use client';

import { 
  Shield, Lock, CreditCard, Award, CheckCircle2, 
  Headphones, RefreshCw, Truck, UserCheck,
  BadgeCheck, Fingerprint, Eye, Globe
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

/* ── Payment Methods Data ── */
const PAYMENT_METHODS = [
  { name: 'Visa', icon: '💳' },
  { name: 'Mastercard', icon: '💳' },
  { name: 'PayPal', icon: '🅿️' },
  { name: 'Apple Pay', icon: '🍎' },
  { name: 'Google Pay', icon: '🔵' },
  { name: 'Cash on Delivery', icon: '💵' },
];

/* ── Security Features Data ── */
const SECURITY_FEATURES = [
  {
    icon: Shield,
    titleAr: 'حماية المشتري',
    titleEn: 'Buyer Protection',
    titleFr: 'Protection de l\'acheteur',
    descAr: 'استرداد كامل في حالة الاحتيال',
    descEn: 'Full refund in case of fraud',
    descFr: 'Remboursement complet en cas de fraude',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Lock,
    titleAr: 'تشفير SSL',
    titleEn: 'SSL Encryption',
    titleFr: 'Chiffrement SSL',
    descAr: 'بياناتك محمية بتشفير 256-bit',
    descEn: 'Your data is protected with 256-bit encryption',
    descFr: 'Vos données sont protégées par un chiffrement 256 bits',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Fingerprint,
    titleAr: 'مصادقة ثنائية',
    titleEn: 'Two-Factor Auth',
    titleFr: 'Authentification à deux facteurs',
    descAr: 'طبقة أمان إضافية لحسابك',
    descEn: 'Extra security layer for your account',
    descFr: 'Couche de sécurité supplémentaire pour votre compte',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Eye,
    titleAr: 'خصوصية البيانات',
    titleEn: 'Data Privacy',
    titleFr: 'Confidentialité des données',
    descAr: 'لا نشارك بياناتك مع أطراف ثالثة',
    descEn: 'We never share your data with third parties',
    descFr: 'Nous ne partageons jamais vos données avec des tiers',
    gradient: 'from-gold to-orange-500',
  },
];

/* ── Trust Indicators Data ── */
const TRUST_INDICATORS = [
  { 
    icon: CheckCircle2, 
    textAr: 'متحقق من قبل CMT', 
    textEn: 'Verified by CMT',
    textFr: 'Vérifié par le CMT',
  },
  { 
    icon: Award, 
    textAr: 'جائزة أفضل تطبيق 2024', 
    textEn: 'Best App Award 2024',
    textFr: 'Prix de la meilleure application 2024',
  },
  { 
    icon: UserCheck, 
    textAr: '+150,000 مستخدم موثق', 
    textEn: '+150K Verified Users',
    textFr: '+150K Utilisateurs vérifiés',
  },
  { 
    icon: Globe, 
    textAr: 'متوفر في 48 مدينة مغربية', 
    textEn: 'Available in 48 Moroccan Cities',
    textFr: 'Disponible dans 48 villes marocaines',
  },
];

/* ════════════════════════════════════════════════════════════════════
    MAIN TRUST BADGES COMPONENT
   ════════════════════════════════════════════════════════════════════ */

interface TrustBadgesProps {
  variant?: 'default' | 'compact' | 'full';
}

export default function TrustBadges({ variant = 'default' }: TrustBadgesProps) {
  const { locale } = useTranslation();
  const isRtl = locale === 'ar';

  // Get localized text helper
  const getText = (texts: { ar?: string; en?: string; fr?: string }) => {
    return locale === 'ar' ? texts.ar : locale === 'fr' ? texts.fr : texts.en;
  };

  if (variant === 'compact') {
    return (
      <section dir={isRtl ? 'rtl' : 'ltr'} className="py-8 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {TRUST_INDICATORS.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="w-5 h-5 text-emerald" />
                <span className="text-sm font-medium">{getText(item)}</span>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center mb-3">
              {locale === 'ar' ? 'طرق الدفع المدعومة' : locale === 'fr' ? 'Modes de paiement acceptés' : 'Accepted Payment Methods'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PAYMENT_METHODS.map((method, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-lg border border-border/50 text-sm"
                  title={method.name}
                >
                  <span>{method.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground hidden sm:inline">{method.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'full') {
    return (
      <section dir={isRtl ? 'rtl' : 'ltr'} className="py-16 sm:py-20 bg-background relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald/10 text-emerald text-sm font-semibold mb-4">
              <Shield className="w-4 h-4" />
              {locale === 'ar' ? 'أمان وثقة' : locale === 'fr' ? 'Sécurité et confiance' : 'Security & Trust'}
              <BadgeCheck className="w-4 h-4" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {locale === 'ar' 
                ? 'أمانك أولويتنا القصوى'
                : locale === 'fr'
                  ? 'Votre sécurité est notre priorité absolue'
                  : 'Your Security Is Our Top Priority'
              }
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {locale === 'ar'
                ? 'نستخدم أحدث تقنيات الأمان لحماية بياناتك وضمان تجربة تسوق آمنة'
                : locale === 'fr'
                  ? 'Nous utilisons les dernières technologies de sécurité pour protéger vos données et garantir une expérience d\'achat sûre'
                  : 'We use the latest security technologies to protect your data and ensure a safe shopping experience'
              }
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {SECURITY_FEATURES.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {getText(feature)}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {getText({
                    ar: feature.descAr,
                    en: feature.descEn,
                    fr: feature.descFr,
                  })}
                </p>

                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 blur-xl transition-opacity duration-300 pointer-events-none`} />
              </div>
            ))}
          </div>

          {/* Payment Methods Section */}
          <div className="bg-muted/30 rounded-3xl p-8 md:p-10">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-foreground mb-2">
                {locale === 'ar' ? 'طرق الدفع المتعددة' : locale === 'fr' ? 'Modes de paiement multiples' : 'Multiple Payment Methods'}
              </h3>
              <p className="text-muted-foreground">
                {locale === 'ar' 
                  ? 'ادفع بالطريقة التي تناسبك - جميع المعاملات مشفرة وآمنة'
                  : locale === 'fr'
                    ? 'Payez comme vous le souhaitez - toutes les transactions sont chiffrées et sécurisées'
                    : 'Pay your way - All transactions are encrypted and secure'
                }
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {PAYMENT_METHODS.map((method, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-3 px-5 py-3 bg-card rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-default"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{method.icon}</span>
                  <span className="font-semibold text-foreground">{method.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {TRUST_INDICATORS.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5 text-muted-foreground">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald/10">
                  <item.icon className="w-5 h-5 text-emerald" />
                </div>
                <span className="text-sm font-medium">{getText(item)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default variant
  return (
    <section dir={isRtl ? 'rtl' : 'ltr'} className="py-12 bg-muted/30 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Trust Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Shield, text: locale === 'ar' ? 'حماية مشتري' : locale === 'fr' ? 'Protection acheteur' : 'Buyer Protection', color: 'text-emerald' },
            { icon: Lock, text: locale === 'ar' ? 'دفع آمن' : locale === 'fr' ? 'Paiement sécurisé' : 'Secure Payment', color: 'text-blue-500' },
            { icon: RefreshCw, text: locale === 'ar' ? 'استرجاع سهل' : locale === 'fr' ? 'Retour facile' : 'Easy Returns', color: 'text-violet' },
            { icon: Headphones, text: locale === 'ar' ? 'دعم 24/7' : locale === 'fr' ? 'Support 24/7' : '24/7 Support', color: 'text-gold' },
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center p-4 rounded-2xl bg-card border border-border/50 hover:shadow-md transition-shadow">
              <item.icon className={`w-8 h-8 ${item.color} mb-2`} />
              <span className="text-sm font-medium text-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="pt-6 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {locale === 'ar' ? 'طرق الدفع الآمنة:' : locale === 'fr' ? 'Modes de paiement sécurisés :' : 'Secure Payment Methods:'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PAYMENT_METHODS.slice(0, 5).map((method, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-lg border border-border/50"
                  title={method.name}
                >
                  <span className="text-base">{method.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground hidden md:inline">{method.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { PAYMENT_METHODS, SECURITY_FEATURES, TRUST_INDICATORS };
