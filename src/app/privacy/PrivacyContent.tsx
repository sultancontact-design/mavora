'use client';

import { useTranslation } from '@/hooks/useTranslation';
import MavoraLogo from '@/components/common/MavoraLogo';

export default function PrivacyContent() {
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {locale === 'ar' ? 'محمية وآمنة' : locale === 'fr' ? 'Protégé & Sécurisé' : 'Protected & Secure'}
            </div>
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
              {locale === 'ar' ? 'سياسة الخصوصية' : locale === 'fr' ? 'Politique de Confidentialité' : 'Privacy Policy'}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-purple-100">
              {locale === 'ar'
                ? 'نحن ملتزمون بحماية خصوصيتك. تعرف على كيفية جمع واستخدام وحماية بياناتك.'
                : locale === 'fr'
                  ? 'Nous nous engageons à protéger votre vie privée. Découvrez comment nous collectons, utilisons et protégeons vos données.'
                  : 'We are committed to protecting your privacy. Learn how we collect, use, and protect your data.'}
            </p>
            <p className="mt-4 text-sm text-purple-200">
              {locale === 'ar' ? 'آخر تحديث: يناير 2025' : locale === 'fr' ? 'Dernière mise à jour: Janvier 2025' : 'Last updated: January 2025'}
            </p>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 start-0 end-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-teal-600 hover:prose-a:text-teal-700">
          
          {/* Introduction */}
          <div className="mb-10 rounded-2xl bg-violet-50 border border-violet-100 p-6">
            <h2 className="!mt-0 !text-violet-800 flex items-center gap-2">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {locale === 'ar' ? 'مقدمة' : locale === 'fr' ? 'Introduction' : 'Introduction'}
            </h2>
            <p className="text-gray-700 mb-0">
              {locale === 'ar'
                ? 'مرحباً بكم في مافورا ("نحن"، "لنا"، "شركتنا"). نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وتخزيننا ومشاركتنا للمعلومات عند استخدامك لمنصتنا.'
                : locale === 'fr'
                  ? 'Bienvenue chez MAVORA (\"nous\", \"notre\", \"notre entreprise\"). Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles. Cette politique explique comment nous collectons, utilisons, stockons et partageons vos informations lorsque vous utilisez notre plateforme.'
                  : 'Welcome to MAVORA ("we", "our", "company"). We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, store, and share your information when you use our platform.'}
            </p>
          </div>

          {/* Section 1: Information We Collect */}
          <div className="mb-10">
            <h2 className="!text-gray-900 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 text-lg font-bold">1</span>
              {locale === 'ar' ? 'المعلومات التي نجمعها' : locale === 'fr' ? 'Informations que nous collectons' : 'Information We Collect'}
            </h2>
            
            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-gray-200 p-5 hover:border-teal-300 transition-colors">
                <h3 className="!text-lg !mt-0 text-gray-800">
                  {locale === 'ar' ? 'أ. المعلومات الشخصية' : locale === 'fr' ? 'A. Informations personnelles' : 'A. Personal Information'}
                </h3>
                <ul className="mt-3 space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500" />
                    {locale === 'ar' ? 'الاسم الكامل وعنوان البريد الإلكتروني ورقم الهاتف' : locale === 'fr' ? 'Nom complet, adresse e-mail, numéro de téléphone' : 'Full name, email address, phone number'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500" />
                    {locale === 'ar' ? 'الصورة الشخصية والسيرة الذاتية' : locale === 'fr' ? 'Photo de profil, biographie' : 'Profile photo, biography'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500" />
                    {locale === 'ar' ? 'الموقع الجغرافي (المدينة/البلد)' : locale === 'fr' ? 'Localisation géographique (ville/pays)' : 'Geographic location (city/country)'}
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 p-5 hover:border-teal-300 transition-colors">
                <h3 className="!text-lg !mt-0 text-gray-800">
                  {locale === 'ar' ? 'ب. معاملات الاستخدام' : locale === 'fr' ? 'B. Données d\'utilisation' : 'B. Usage Data'}
                </h3>
                <ul className="mt-3 space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-500" />
                    {locale === 'ar' ? 'سجل التصفح والصفحات التي زرتها' : locale === 'fr' ? 'Historique de navigation, pages visitées' : 'Browsing history, pages visited'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-500" />
                    {locale === 'ar' ? 'عمليات البحث والتفاعلات مع الإعلانات' : locale === 'fr' ? 'Recherches et interactions avec les annonces' : 'Searches and interactions with listings'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-500" />
                    {locale === 'ar' ? 'عنوان IP ونوع المتصفح والجهاز' : locale === 'fr' ? 'Adresse IP, type de navigateur, appareil' : 'IP address, browser type, device'}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: How We Use Your Information */}
          <div className="mb-10">
            <h2 className="!text-gray-900 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 text-lg font-bold">2</span>
              {locale === 'ar' ? 'كيف نستخدم معلوماتك' : locale === 'fr' ? 'Comment utilisons-nous vos informations' : 'How We Use Your Information'}
            </h2>
            
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { emoji: '🔐', text: locale === 'ar' ? 'تأمين حسابك وحمايته' : locale === 'fr' ? 'Sécuriser votre compte' : 'Secure and protect your account' },
                { emoji: '📢', text: locale === 'ar' ? 'عرض الإعلانات ذات الصلة' : locale === 'fr' ? 'Afficher des annonces pertinentes' : 'Show relevant listings' },
                { emoji: '💬', text: locale === 'ar' ? 'تمكين التواصل بين المستخدمين' : locale === 'fr' ? 'Permettre la communication' : 'Enable user communication' },
                { emoji: '📊', text: locale === 'ar' ? 'تحسين خدماتنا ومنصتنا' : locale === 'fr' ? 'Améliorer nos services' : 'Improve our services' },
                { emoji: '🛡️', text: locale === 'ar' ? 'منع الاحتيال والأنشطة غير القانونية' : locale === 'fr' ? 'Prévenir la fraude' : 'Prevent fraud and illegal activities' },
                { emoji: '📧', text: locale === 'ar' ? 'إرسال إشعارات وتحديثات مهمة' : locale === 'fr' ? 'Envoyer des notifications' : 'Send important notifications' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-gray-700 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Data Protection */}
          <div className="mb-10">
            <h2 className="!text-gray-900 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 text-lg font-bold">3</span>
              {locale === 'ar' ? 'حماية البيانات' : locale === 'fr' ? 'Protection des données' : 'Data Protection'}
            </h2>
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="!text-lg !mt-0 text-green-800">
                    {locale === 'ar' ? 'تدابير الأمان الخاصة بنا' : locale === 'fr' ? 'Nos mesures de sécurité' : 'Our Security Measures'}
                  </h3>
                  <ul className="mt-3 space-y-2 text-gray-700">
                    <li>• {locale === 'ar' ? 'تشفير SSL/TLS لجميع البيانات' : locale === 'fr' ? 'Chiffrement SSL/TLS pour toutes les données' : 'SSL/TLS encryption for all data'}</li>
                    <li>• {locale === 'ar' ? 'تخزين آمن في خوادم Supabase المعتمدة' : locale === 'fr' ? 'Stockage sécurisé sur des serveurs Supabase certifiés' : 'Secure storage on certified Supabase servers'}</li>
                    <li>• {locale === 'ar' ? 'تحديثات أمان منتظمة ومراجعات دورية' : locale === 'fr' ? 'Mises à jour de sécurité régulières et audits périodiques' : 'Regular security updates and periodic audits'}</li>
                    <li>• {locale === 'ar' ? 'التحقق من هوية المستخدمين الحساسين' : locale === 'fr' ? 'Vérification d\'identité pour les comptes sensibles' : 'Identity verification for sensitive accounts'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Your Rights */}
          <div className="mb-10">
            <h2 className="!text-gray-900 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 text-lg font-bold">4</span>
              {locale === 'ar' ? 'حقوقك' : locale === 'fr' ? 'Vos droits' : 'Your Rights'}
            </h2>
            <div className="mt-6 space-y-3">
              {[
                { right: locale === 'ar' ? 'الوصول إلى بياناتك' : locale === 'fr' ? 'Accéder à vos données' : 'Access your data', desc: locale === 'ar' ? 'يمكنك طلب نسخة من جميع البيانات التي نحتفظ بها عنك' : locale === 'fr' ? 'Vous pouvez demander une copie de toutes les données que nous détenons sur vous' : 'You can request a copy of all data we hold about you' },
                { right: locale === 'ar' ? 'تصحيح المعلومات' : locale === 'fr' ? 'Corriger les informations' : 'Correct information', desc: locale === 'ar' ? 'يمكنك تحديث أو تصحيح بياناتك الشخصية في أي وقت' : locale === 'fr' ? 'Vous pouvez mettre à jour ou corriger vos informations personnelles à tout moment' : 'You can update or correct your personal information at any time' },
                { right: locale === 'ar' ? 'حذف الحساب' : locale === 'fr' ? 'Supprimer le compte' : 'Delete account', desc: locale === 'ar' ? 'يمكنك طلب حذف حسابك وجميع البيانات المرتبطة به' : locale === 'fr' ? 'Vous pouvez demander la suppression de votre compte et de toutes les données associées' : 'You can request deletion of your account and all associated data' },
                { right: locale === 'ar' ? 'إلغاء الاشتراك' : locale === 'fr' ? 'Se désabonner' : 'Unsubscribe', desc: locale === 'ar' ? 'يمكنك إلغاء اشتراكك في الرسائل التسويقية في أي وقت' : locale === 'fr' ? 'Vous pouvez vous désabonner des messages marketing à tout moment' : 'You can unsubscribe from marketing communications at any time' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 rounded-xl border border-gray-200 p-4 hover:border-teal-300 hover:bg-teal-50/30 transition-all">
                  <svg className="mt-0.5 size-5 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.right}</h4>
                    <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Contact */}
          <div className="rounded-2xl bg-gray-900 p-8 text-white">
            <h2 className="!text-white !mt-0 flex items-center gap-3">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {locale === 'ar' ? 'للتواصل معنا' : locale === 'fr' ? 'Pour nous contacter' : 'Contact Us'}
            </h2>
            <p className="mt-4 text-gray-300">
              {locale === 'ar'
                ? 'إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه أو ممارساتنا، لا تتردد في الاتصال بنا:'
                : locale === 'fr'
                  ? 'Si vous avez des questions sur cette politique de confidentialité ou nos pratiques, n\'hésitez pas à nous contacter:'
                  : 'If you have any questions about this privacy policy or our practices, please feel free to contact us:'}
            </p>
            <div className="mt-6 space-y-3">
              <a href="mailto:privacy@mavora.ma" className="flex items-center gap-3 text-teal-400 hover:text-teal-300 transition-colors">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                privacy@mavora.ma
              </a>
              <div className="flex items-center gap-3 text-gray-400">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                الدار البيضاء، المغرب / Casablanca, Morocco
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
