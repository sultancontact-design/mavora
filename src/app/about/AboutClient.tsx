'use client';

import { useTranslation } from '@/hooks/useTranslation';
import MavoraLogo from '@/components/common/MavoraLogo';
import { Shield, Users, Lightbulb, Heart, Zap, Eye } from 'lucide-react';

export default function AboutContent() {
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
            <MavoraLogo size="lg" className="text-white justify-center mb-6" />
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {locale === 'ar' ? 'من نحن' : locale === 'fr' ? 'À propos de nous' : 'About Us'}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-teal-100 sm:text-xl">
              {locale === 'ar'
                ? 'مافورا - رؤيتنا هي تمكين كل فرد في المغرب وشمال إفريقيا من التداول بثقة وأمان'
                : locale === 'fr'
                  ? 'MAVORA - Notre vision est de permettre à chacun au Maroc et en Afrique du Nord de commercer en toute confiance et sécurité'
                  : 'MAVORA - Our vision is to enable everyone in Morocco and North Africa to trade with confidence and security'}
            </p>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 start-0 end-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* Our Story */}
        <div className={`grid gap-12 lg:grid-cols-2 lg:items-center mb-20 ${isRtl ? 'rtl:space-x-reverse' : ''}`}>
          <div className={isRtl ? 'lg:order-last' : ''}>
            <h2 className="mb-6 text-3xl font-bold text-gray-900 sm:text-4xl">
              {locale === 'ar' ? 'قصتنا' : locale === 'fr' ? 'Notre histoire' : 'Our Story'}
            </h2>
            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
              <p>
                {locale === 'ar'
                  ? 'ولدت مافورا من رؤية بسيطة: أن يكون هناك سوق إلكتروني موثوق يخدم احتياجات الناس في المغرب والمنطقة العربية.'
                  : locale === 'fr'
                    ? 'MAVORA est née d\'une vision simple : créer une place de marché en ligne fiable qui répond aux besoins des gens au Maroc.'
                    : 'MAVORA was born from a simple vision: to have a reliable online marketplace that serves people\'s needs in Morocco.'}
              </p>
              <p>
                {locale === 'ar'
                  ? 'في عام 2024، بدأنا رحلتنا لبناء منصة تجارية شاملة تجمع بين سهولة الاستخدام والأمان والموثوقية.'
                  : locale === 'fr'
                    ? 'En 2024, nous avons commencé notre voyage pour construire une plateforme commerciale complète.'
                    : 'In 2024, we began our journey to build a comprehensive trading platform.'}
              </p>
            </div>
          </div>
          <div className={`rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 p-8 lg:p-12 ${isRtl ? 'lg:order-first' : ''}`}>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-teal-600">100+</div>
                <div className="mt-1 text-sm text-gray-500">
                  {locale === 'ar' ? 'إعلان نشط' : locale === 'fr' ? 'Annonces actives' : 'Active Listings'}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-emerald-600">10K+</div>
                <div className="mt-1 text-sm text-gray-500">
                  {locale === 'ar' ? 'مستخدم مسجل' : locale === 'fr' ? 'Utilisateurs inscrits' : 'Registered Users'}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-violet-600">6</div>
                <div className="mt-1 text-sm text-gray-500">
                  {locale === 'ar' ? 'دول مدعومة' : locale === 'fr' ? 'Pays supportés' : 'Countries Supported'}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-amber-600">24/7</div>
                <div className="mt-1 text-sm text-gray-500">
                  {locale === 'ar' ? 'دعم فني' : locale === 'fr' ? 'Support technique' : 'Tech Support'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="mb-20 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-lg border border-gray-100">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
              <Zap className="size-7" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              {locale === 'ar' ? 'مهمتنا' : locale === 'fr' ? 'Notre mission' : 'Our Mission'}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {locale === 'ar'
                ? 'تمكين الأفراد والشركات في المغرب وشمال إفريقيا من الشراء والبيع بسهولة وأمان وثقة.'
                : locale === 'fr'
                  ? 'Permettre aux individus et entreprises au Maroc et en Afrique du Nord d\'acheter et de vendre facilement.'
                  : 'Empower individuals and businesses in Morocco and North Africa to buy and sell with ease, security, and trust.'}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg border border-gray-100">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Eye className="size-7" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              {locale === 'ar' ? 'رؤيتنا' : locale === 'fr' ? 'Notre vision' : 'Our Vision'}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {locale === 'ar'
                ? 'أن نصبح المنصة التجارية الرائدة في المنطقة العربية، حيث يمكن للجميع التداول بثقة تامة.'
                : locale === 'fr'
                  ? 'Devenir la plateforme commerciale leader dans le monde arabe.'
                  : 'To become the leading trading platform in the Arab world.'}
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">
            {locale === 'ar' ? 'قيمنا' : locale === 'fr' ? 'Nos valeurs' : 'Our Values'}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Shield className="size-6" />,
                title: locale === 'ar' ? 'الثقة والأمان' : locale === 'fr' ? 'Confiance & Sécurité' : 'Trust & Security',
                desc: locale === 'ar'
                  ? 'نضمن حماية بياناتكم ومعاملاتكم بأحدث تقنيات الأمان'
                  : 'We ensure the protection of your data and transactions',
                color: 'teal'
              },
              {
                icon: <Users className="size-6" />,
                title: locale === 'ar' ? 'الشمولية' : locale === 'fr' ? 'Inclusion' : 'Inclusivity',
                desc: locale === 'ar'
                  ? 'منصة للجميع بغض النظر عن الموقع أو اللغة'
                  : 'A platform for everyone regardless of location or language',
                color: 'violet'
              },
              {
                icon: <Lightbulb className="size-6" />,
                title: locale === 'ar' ? 'الابتكار' : locale === 'fr' ? 'Innovation' : 'Innovation',
                desc: locale === 'ar'
                  ? 'نسعى دائماً لتطوير حلول جديدة'
                  : 'We always strive to develop new solutions',
                color: 'amber'
              },
              {
                icon: <Heart className="size-6" />,
                title: locale === 'ar' ? 'العملاء أولاً' : locale === 'fr' ? 'Clients d\'abord' : 'Customers First',
                desc: locale === 'ar'
                  ? 'رضاكم هو أولويتنا'
                  : 'Your satisfaction is our priority',
                color: 'rose'
              }
            ].map((value, index) => (
              <div key={index} className="group rounded-2xl bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600 group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12 text-white text-center">
          <h2 className="mb-4 text-3xl font-bold">
            {locale === 'ar' ? 'تواصل معنا' : locale === 'fr' ? 'Contactez-nous' : 'Contact Us'}
          </h2>
          <p className="mb-8 text-lg text-gray-300 max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'هل لديك أسئلة أو اقتراحات؟ نحب أن نسمع منك!'
              : locale === 'fr'
                ? 'Vous avez des questions ou des suggestions ?'
                : 'Do you have questions or suggestions?'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-teal-600 transition-colors"
            >
              {locale === 'ar' ? 'تواصل معنا' : locale === 'fr' ? 'Nous contacter' : 'Contact Us'}
            </a>
            <a
              href="mailto:support@mavora.ma"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              support@mavora.ma
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
